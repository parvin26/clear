"""Cohort service: create cohort, add enterprises, list with activation/health/velocity, summary."""
from datetime import date
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import Cohort, CohortEnterprise, Enterprise, EnterpriseHealthSnapshot
from app.clear.decision_velocity import compute_decision_velocity


def create_cohort(
    db: Session,
    name: str,
    partner_org_id: Optional[int] = None,
    start_date: Optional[date] = None,
    activation_window_days: int = 14,
) -> Cohort:
    """Create a new cohort."""
    c = Cohort(
        name=name,
        partner_org_id=partner_org_id,
        start_date=start_date,
        activation_window_days=activation_window_days,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def add_enterprise_to_cohort(
    db: Session,
    cohort_id: int,
    enterprise_id: int,
    activation_progress: Optional[dict] = None,
) -> CohortEnterprise:
    """Add an enterprise to a cohort. Idempotent: if already in cohort, returns existing and optionally updates activation_progress."""
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise ValueError("Cohort not found")
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise ValueError("Enterprise not found")
    ce = db.query(CohortEnterprise).filter(
        CohortEnterprise.cohort_id == cohort_id,
        CohortEnterprise.enterprise_id == enterprise_id,
    ).first()
    if ce:
        if activation_progress is not None:
            ce.activation_progress = activation_progress
            db.commit()
            db.refresh(ce)
        return ce
    ce = CohortEnterprise(
        cohort_id=cohort_id,
        enterprise_id=enterprise_id,
        activation_progress=activation_progress,
    )
    db.add(ce)
    db.commit()
    db.refresh(ce)
    return ce


def list_cohort_enterprises(
    db: Session,
    cohort_id: int,
    activation_incomplete: Optional[bool] = None,
    health_score_below: Optional[int] = None,
    velocity_band: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    List enterprises in a cohort with activation_progress, health_score, decision_velocity.
    Optional filters: activation_incomplete (True = only enterprises not fully activated),
    health_score_below (only enterprises with latest health score < threshold),
    velocity_band (fast, healthy, slow, at_risk).
    """
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise ValueError("Cohort not found")
    ces = db.query(CohortEnterprise).filter(CohortEnterprise.cohort_id == cohort_id).all()
    out = []
    for ce in ces:
        ent = db.query(Enterprise).filter(Enterprise.id == ce.enterprise_id).first()
        activation = ce.activation_progress or {}
        completed_count = activation.get("completed_count", 0)
        activation_complete = completed_count >= 5
        if activation_incomplete is True and activation_complete:
            continue
        if activation_incomplete is False and not activation_complete:
            continue
        # Latest health score
        health_row = (
            db.query(EnterpriseHealthSnapshot)
            .filter(EnterpriseHealthSnapshot.enterprise_id == ce.enterprise_id)
            .order_by(desc(EnterpriseHealthSnapshot.snapshot_date))
            .first()
        )
        health_score = health_row.score if health_row else None
        if health_score_below is not None and (health_score is None or health_score >= health_score_below):
            continue
        vel = compute_decision_velocity(db, enterprise_id=ce.enterprise_id)
        band = vel.get("velocity_band")
        if velocity_band is not None and band != velocity_band:
            continue
        out.append({
            "cohort_enterprise_id": ce.id,
            "enterprise_id": ce.enterprise_id,
            "enterprise_name": ent.name if ent else None,
            "joined_at": ce.joined_at.isoformat() if ce.joined_at else None,
            "activation_progress": activation,
            "activation_completed_count": completed_count,
            "activation_complete": activation_complete,
            "health_score": health_score,
            "decision_velocity": {
                "avg_cycle_days": vel.get("avg_cycle_days"),
                "velocity_band": band,
                "cycle_count": vel.get("cycle_count", 0),
            },
        })
    return out


def cohort_activation_summary(db: Session, cohort_id: int) -> dict[str, Any]:
    """
    Cohort-level activation summary: enterprises enrolled, activation progress per enterprise,
    cohort averages, at-risk count (activation incomplete or low health or slow velocity).
    """
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise ValueError("Cohort not found")
    ces = db.query(CohortEnterprise).filter(CohortEnterprise.cohort_id == cohort_id).all()
    total = len(ces)
    completed = 0
    activation_pcts: list[float] = []
    health_scores: list[int] = []
    avg_cycle_days_list: list[float] = []
    at_risk = 0
    for ce in ces:
        activation = ce.activation_progress or {}
        completed_count = activation.get("completed_count", 0)
        pct = min(100, round(100 * completed_count / 5.0)) if completed_count is not None else 0
        activation_pcts.append(pct)
        if completed_count >= 5:
            completed += 1
        health_row = (
            db.query(EnterpriseHealthSnapshot)
            .filter(EnterpriseHealthSnapshot.enterprise_id == ce.enterprise_id)
            .order_by(desc(EnterpriseHealthSnapshot.snapshot_date))
            .first()
        )
        hs = health_row.score if health_row else None
        if hs is not None:
            health_scores.append(hs)
        vel = compute_decision_velocity(db, enterprise_id=ce.enterprise_id)
        avg_days = vel.get("avg_cycle_days")
        if avg_days is not None:
            avg_cycle_days_list.append(avg_days)
        # At risk: activation incomplete, or health < 40, or velocity at_risk
        if completed_count < 5 or (hs is not None and hs < 40) or vel.get("velocity_band") == "at_risk":
            at_risk += 1
    avg_activation_pct = round(sum(activation_pcts) / total, 1) if total else 0
    avg_health = round(sum(health_scores) / len(health_scores), 1) if health_scores else None
    avg_velocity_days = round(sum(avg_cycle_days_list) / len(avg_cycle_days_list), 1) if avg_cycle_days_list else None
    return {
        "cohort_id": cohort_id,
        "cohort_name": cohort.name,
        "enterprises_enrolled": total,
        "activation_complete_count": completed,
        "average_activation_pct": avg_activation_pct,
        "average_health_score": avg_health,
        "average_decision_velocity_days": avg_velocity_days,
        "at_risk_count": at_risk,
    }


def list_cohorts(
    db: Session,
    partner_org_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Cohort]:
    """List cohorts, optionally filtered by partner_org_id."""
    q = db.query(Cohort)
    if partner_org_id is not None:
        q = q.filter(Cohort.partner_org_id == partner_org_id)
    return q.order_by(desc(Cohort.created_at)).offset(skip).limit(limit).all()
