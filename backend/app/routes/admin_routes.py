"""Admin-only routes: monthly snapshots, etc. Gated by ADMIN_API_KEY."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.db.models import (
    Enterprise,
    EnterpriseHealthSnapshot,
    EnterpriseReadinessSnapshot,
    DecisionVelocitySnapshot,
    CohortEnterprise,
    PortfolioEnterprise,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def require_admin_key(
    x_admin_api_key: Optional[str] = Header(None, alias="X-Admin-API-Key"),
    admin_api_key: Optional[str] = Header(None, alias="Admin-Api-Key"),
) -> None:
    """Require valid ADMIN_API_KEY in header. Accepts X-Admin-API-Key or Admin-Api-Key."""
    key = x_admin_api_key or admin_api_key
    if not settings.ADMIN_API_KEY or key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Admin API key required")


class RunMonthlySnapshotsBody(BaseModel):
    """Optional filters: run for one enterprise, a cohort, a portfolio, or all."""
    enterprise_id: Optional[int] = None
    cohort_id: Optional[int] = None
    portfolio_id: Optional[int] = None


def _resolve_enterprise_ids(db: Session, body: RunMonthlySnapshotsBody) -> list[int]:
    """Return list of enterprise IDs from body filters, or all enterprises."""
    if body.enterprise_id is not None:
        ent = db.query(Enterprise).filter(Enterprise.id == body.enterprise_id).first()
        if not ent:
            return []
        return [body.enterprise_id]
    if body.cohort_id is not None:
        rows = db.query(CohortEnterprise.enterprise_id).filter(
            CohortEnterprise.cohort_id == body.cohort_id
        ).distinct().all()
        return [r[0] for r in rows]
    if body.portfolio_id is not None:
        rows = db.query(PortfolioEnterprise.enterprise_id).filter(
            PortfolioEnterprise.portfolio_id == body.portfolio_id
        ).distinct().all()
        return [r[0] for r in rows]
    rows = db.query(Enterprise.id).all()
    return [r[0] for r in rows]


def _save_health_snapshot_idempotent(db: Session, enterprise_id: int) -> bool:
    """Compute health score and upsert snapshot for current month (first day). Returns True if wrote/updated."""
    from app.governance.health_score import compute_health_score
    today = date.today()
    snapshot_date = today.replace(day=1)
    result = compute_health_score(db, enterprise_id)
    existing = (
        db.query(EnterpriseHealthSnapshot)
        .filter(
            EnterpriseHealthSnapshot.enterprise_id == enterprise_id,
            EnterpriseHealthSnapshot.snapshot_date == snapshot_date,
        )
        .first()
    )
    if existing:
        existing.score = result["total_score"]
        existing.execution_score = result["execution_score"]
        existing.governance_score = result["governance_score"]
        existing.learning_score = result["learning_score"]
        db.commit()
    else:
        snap = EnterpriseHealthSnapshot(
            enterprise_id=enterprise_id,
            score=result["total_score"],
            execution_score=result["execution_score"],
            governance_score=result["governance_score"],
            learning_score=result["learning_score"],
            snapshot_date=snapshot_date,
        )
        db.add(snap)
        db.commit()
    return True


def _save_velocity_snapshot_idempotent(db: Session, enterprise_id: int) -> bool:
    """Compute velocity and upsert snapshot for current month. Returns True if wrote/updated."""
    from app.clear.decision_velocity import compute_decision_velocity, save_velocity_snapshot
    today = date.today()
    snapshot_date = today.replace(day=1)
    vel = compute_decision_velocity(db, enterprise_id=enterprise_id)
    avg_cycle = vel.get("avg_cycle_days")
    if avg_cycle is None:
        avg_cycle = 0.0
    existing = (
        db.query(DecisionVelocitySnapshot)
        .filter(
            DecisionVelocitySnapshot.enterprise_id == enterprise_id,
            DecisionVelocitySnapshot.snapshot_date == snapshot_date,
        )
        .first()
    )
    if existing:
        existing.avg_cycle_days = round(float(avg_cycle), 2)
        existing.avg_time_to_decision = round(vel.get("avg_time_to_decision") or 0, 2)
        existing.avg_time_to_execution = round(vel.get("avg_time_to_execution") or 0, 2)
        existing.avg_time_to_review = round(vel.get("avg_time_to_review") or 0, 2)
        existing.velocity_band = vel.get("velocity_band")
        db.commit()
    else:
        save_velocity_snapshot(
            db,
            enterprise_id=enterprise_id,
            avg_cycle_days=float(avg_cycle),
            snapshot_date=snapshot_date,
            avg_time_to_decision=vel.get("avg_time_to_decision"),
            avg_time_to_execution=vel.get("avg_time_to_execution"),
            avg_time_to_review=vel.get("avg_time_to_review"),
            velocity_band=vel.get("velocity_band"),
        )
    return True


def _save_readiness_snapshot_idempotent(db: Session, enterprise_id: int) -> bool:
    """Compute ECRI and upsert snapshot for current month. Returns True if wrote/updated."""
    from app.governance.readiness_index import compute_readiness_index_for_enterprise, save_readiness_snapshot
    today = date.today()
    snapshot_date = today.replace(day=1)
    result = compute_readiness_index_for_enterprise(db, enterprise_id)
    existing = (
        db.query(EnterpriseReadinessSnapshot)
        .filter(
            EnterpriseReadinessSnapshot.enterprise_id == enterprise_id,
            EnterpriseReadinessSnapshot.snapshot_date == snapshot_date,
        )
        .first()
    )
    if existing:
        existing.readiness_index = result["readiness_index"]
        existing.activation_component = result.get("activation_component")
        existing.health_component = result.get("health_component")
        existing.velocity_component = result.get("velocity_component")
        existing.governance_component = result.get("governance_component")
        existing.readiness_band = result.get("readiness_band")
        db.commit()
    else:
        save_readiness_snapshot(
            db,
            enterprise_id=enterprise_id,
            readiness_index=result["readiness_index"],
            snapshot_date=snapshot_date,
            activation_component=result.get("activation_component"),
            health_component=result.get("health_component"),
            velocity_component=result.get("velocity_component"),
            governance_component=result.get("governance_component"),
            readiness_band=result.get("readiness_band"),
        )
    return True


@router.post("/snapshots/run-monthly")
def run_monthly_snapshots(
    body: Optional[RunMonthlySnapshotsBody] = None,
    _: None = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """
    Run monthly Health, Velocity, and ECRI snapshots for enterprises.
    Optional body: enterprise_id, cohort_id, or portfolio_id to limit scope; otherwise all enterprises.
    Snapshots are idempotent per month (upsert by first day of month).
    """
    body = body or RunMonthlySnapshotsBody()
    enterprise_ids = _resolve_enterprise_ids(db, body)
    counts = {"health": 0, "velocity": 0, "readiness": 0}
    errors: list[str] = []

    for eid in enterprise_ids:
        try:
            _save_health_snapshot_idempotent(db, eid)
            counts["health"] += 1
        except Exception as e:
            errors.append(f"enterprise_id={eid} health: {e!s}")
        try:
            _save_velocity_snapshot_idempotent(db, eid)
            counts["velocity"] += 1
        except Exception as e:
            errors.append(f"enterprise_id={eid} velocity: {e!s}")
        try:
            _save_readiness_snapshot_idempotent(db, eid)
            counts["readiness"] += 1
        except Exception as e:
            errors.append(f"enterprise_id={eid} readiness: {e!s}")

    return {
        "enterprises_processed": len(enterprise_ids),
        "snapshots_written": counts,
        "errors": errors,
    }
