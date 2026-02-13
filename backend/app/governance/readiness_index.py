"""
Execution Capital Readiness Index (ECRI).

Single institutional signal for capital partners: operational readiness for funding,
scaling, or structured capital programs. Behavioral execution readiness (0-100).

Components:
  - Activation completion: 20%
  - Enterprise Health Score: 35%
  - Decision Velocity: 25%
  - Governance maturity: 20%
"""
from __future__ import annotations

from datetime import date
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.models import (
    Decision,
    DecisionEvidenceLink,
    OutcomeReview,
)
from app.governance.ledger_service import _derive_status_from_ledger

# Weights (points out of 100)
ACTIVATION_MAX = 20
HEALTH_MAX = 35
VELOCITY_MAX = 25
GOVERNANCE_MAX = 20

# Velocity band -> points (Component 3)
VELOCITY_POINTS = {"fast": 25, "healthy": 20, "slow": 12, "at_risk": 5}


def _activation_component(activation_progress: Optional[dict[str, Any]], cycles_completed: int) -> float:
    """
    Activation: 20 points max.
    Incomplete -> 0-10; first cycle completed -> 20; multiple -> 20.
    """
    if activation_progress is not None:
        completed_count = (activation_progress.get("completed_count") or 0) if isinstance(activation_progress, dict) else 0
        if completed_count >= 2:
            return float(ACTIVATION_MAX)
        if completed_count >= 1:
            return float(ACTIVATION_MAX)
        # Incomplete: score 0-10 based on steps if available
        steps = (activation_progress.get("completed_steps") or []) if isinstance(activation_progress, dict) else []
        return min(10.0, len(steps) * 2.0) if steps else 0.0
    # Derive from cycles_completed (outcome reviews = completed cycles)
    if cycles_completed >= 2 or cycles_completed >= 1:
        return float(ACTIVATION_MAX)
    return 0.0 if cycles_completed == 0 else float(ACTIVATION_MAX)


def _health_component(enterprise_health_score: Optional[int]) -> float:
    """Health score 0-100 -> 35 points max (direct scale)."""
    if enterprise_health_score is None:
        return 0.0
    return round(min(HEALTH_MAX, max(0, (enterprise_health_score / 100.0) * HEALTH_MAX)), 1)


def _velocity_component(velocity_band: Optional[str], avg_cycle_days: Optional[float]) -> float:
    """Velocity: fast 25, healthy 20, slow 12, at_risk 5."""
    if velocity_band and velocity_band in VELOCITY_POINTS:
        return float(VELOCITY_POINTS[velocity_band])
    if avg_cycle_days is not None:
        if avg_cycle_days < 30:
            return 25.0
        if avg_cycle_days < 60:
            return 20.0
        if avg_cycle_days < 90:
            return 12.0
        return 5.0
    return 0.0


def _governance_component(metrics: Optional[dict[str, Any]]) -> float:
    """
    Governance maturity: 20 points from weighted metrics.
    Inputs: pct_finalized, pct_review_scheduled, pct_evidence_attached, (optional) pct_shared.
    """
    if not metrics or not isinstance(metrics, dict):
        return 0.0
    pct_finalized = min(1.0, max(0.0, float(metrics.get("pct_finalized") or 0)))
    pct_review_scheduled = min(1.0, max(0.0, float(metrics.get("pct_review_scheduled") or 0)))
    pct_evidence = min(1.0, max(0.0, float(metrics.get("pct_evidence_attached") or 0)))
    pct_shared = min(1.0, max(0.0, float(metrics.get("pct_shared_with_partners") or 0)))
    # Weights: finalized 35%, review scheduled 30%, evidence 25%, shared 10%
    raw = 0.35 * pct_finalized + 0.30 * pct_review_scheduled + 0.25 * pct_evidence + 0.10 * pct_shared
    return round(min(GOVERNANCE_MAX, raw * GOVERNANCE_MAX), 1)


def compute_readiness_index(
    *,
    activation_progress: Optional[dict[str, Any]] = None,
    enterprise_health_score: Optional[int] = None,
    decision_velocity: Optional[dict[str, Any]] = None,
    governance_maturity_metrics: Optional[dict[str, Any]] = None,
    cycles_completed: Optional[int] = None,
) -> dict[str, Any]:
    """
    Compute ECRI from provided inputs.

    Returns:
        readiness_index (0-100),
        activation_component, health_component, velocity_component, governance_component,
        readiness_band ("Capital-ready" | "Developing" | "Early"),
        trend_direction (None when no snapshot; set by caller or snapshot comparison).
    """
    cycles = cycles_completed if cycles_completed is not None else 0
    act = _activation_component(activation_progress, cycles)
    health = _health_component(enterprise_health_score)
    vel_band = (decision_velocity or {}).get("velocity_band")
    vel_days = (decision_velocity or {}).get("avg_cycle_days")
    vel = _velocity_component(vel_band, vel_days)
    gov = _governance_component(governance_maturity_metrics)

    total = round(act + health + vel + gov, 0)
    total = min(100, max(0, int(total)))

    if total >= 70:
        readiness_band = "Capital-ready"
    elif total >= 40:
        readiness_band = "Developing"
    else:
        readiness_band = "Early"

    return {
        "readiness_index": total,
        "activation_component": round(act, 1),
        "health_component": round(health, 1),
        "velocity_component": round(vel, 1),
        "governance_component": round(gov, 1),
        "readiness_band": readiness_band,
        "trend_direction": None,
    }


def compute_governance_maturity_metrics(db: Session, enterprise_id: int) -> dict[str, Any]:
    """
    Compute governance metrics for an enterprise: % finalized, % with review scheduled,
    % with evidence attached. Optional: % shared with partners (e.g. members with partner role).
    """
    decisions = db.query(Decision).filter(Decision.enterprise_id == enterprise_id).all()
    if not decisions:
        return {
            "pct_finalized": 0.0,
            "pct_review_scheduled": 0.0,
            "pct_evidence_attached": 0.0,
            "pct_shared_with_partners": 0.0,
            "total_decisions": 0,
        }
    n = len(decisions)
    decision_ids = [d.decision_id for d in decisions]
    finalized = sum(1 for d in decisions if _derive_status_from_ledger(db, d.decision_id) not in ("draft",))
    review_scheduled = sum(1 for d in decisions if getattr(d, "outcome_review_reminder", False))
    with_evidence = (
        db.query(func.count(func.distinct(DecisionEvidenceLink.decision_id)))
        .filter(DecisionEvidenceLink.decision_id.in_(decision_ids))
        .scalar() or 0
    )
    # Shared: enterprises with capital_partner / partner members (simplified: count enterprises with any member)
    from app.db.models import EnterpriseMember
    partner_count = (
        db.query(func.count(func.distinct(EnterpriseMember.enterprise_id)))
        .filter(
            EnterpriseMember.enterprise_id == enterprise_id,
            EnterpriseMember.role.in_(["capital_partner", "partner", "advisor"]),
        )
        .scalar() or 0
    )
    pct_shared = 1.0 if partner_count > 0 else 0.0  # binary for now

    return {
        "pct_finalized": round(finalized / n, 4) if n else 0.0,
        "pct_review_scheduled": round(review_scheduled / n, 4) if n else 0.0,
        "pct_evidence_attached": round(with_evidence / n, 4) if n else 0.0,
        "pct_shared_with_partners": pct_shared,
        "total_decisions": n,
    }


def _cycles_completed_for_enterprise(db: Session, enterprise_id: int) -> int:
    """Number of outcome reviews (completed cycles) for this enterprise."""
    count = (
        db.query(func.count(OutcomeReview.id))
        .join(Decision, Decision.decision_id == OutcomeReview.decision_id)
        .filter(Decision.enterprise_id == enterprise_id)
        .scalar()
    )
    return count or 0


def compute_readiness_index_for_enterprise(
    db: Session,
    enterprise_id: int,
    activation_progress_override: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Compute ECRI for an enterprise by loading health, velocity, governance from DB.
    Optionally pass activation_progress (e.g. from cohort) to override derived activation.
    """
    from app.governance.health_score import compute_health_score
    from app.clear.decision_velocity import compute_decision_velocity

    health = compute_health_score(db, enterprise_id)
    velocity = compute_decision_velocity(db, enterprise_id=enterprise_id)
    gov_metrics = compute_governance_maturity_metrics(db, enterprise_id)
    cycles = _cycles_completed_for_enterprise(db, enterprise_id)

    result = compute_readiness_index(
        activation_progress=activation_progress_override,
        enterprise_health_score=health.get("total_score"),
        decision_velocity=velocity,
        governance_maturity_metrics=gov_metrics,
        cycles_completed=cycles,
    )
    # Map health/velocity trend to ECRI trend_direction (Improving / Stable / Declining)
    trend = _trend_from_snapshots(db, enterprise_id, result["readiness_index"])
    if trend:
        result["trend_direction"] = trend
    return result


def _trend_from_snapshots(db: Session, enterprise_id: int, current_index: int) -> Optional[str]:
    """Compare current index to previous snapshot. Returns Improving | Stable | Declining."""
    try:
        from app.db.models import EnterpriseReadinessSnapshot
        today = date.today()
        prev = (
            db.query(EnterpriseReadinessSnapshot)
            .filter(
                EnterpriseReadinessSnapshot.enterprise_id == enterprise_id,
                EnterpriseReadinessSnapshot.snapshot_date < today,
            )
            .order_by(desc(EnterpriseReadinessSnapshot.snapshot_date))
            .limit(1)
            .first()
        )
        if not prev or prev.readiness_index is None:
            return None
        if current_index > prev.readiness_index:
            return "Improving"
        if current_index < prev.readiness_index:
            return "Declining"
        return "Stable"
    except Exception:
        return None


def save_readiness_snapshot(
    db: Session,
    enterprise_id: int,
    readiness_index: int,
    snapshot_date: Optional[date] = None,
    activation_component: Optional[float] = None,
    health_component: Optional[float] = None,
    velocity_component: Optional[float] = None,
    governance_component: Optional[float] = None,
    readiness_band: Optional[str] = None,
) -> None:
    """Append a snapshot row for trend computation and history."""
    from app.db.models import EnterpriseReadinessSnapshot
    if snapshot_date is None:
        snapshot_date = date.today()
    row = EnterpriseReadinessSnapshot(
        enterprise_id=enterprise_id,
        readiness_index=readiness_index,
        snapshot_date=snapshot_date,
        activation_component=activation_component,
        health_component=health_component,
        velocity_component=velocity_component,
        governance_component=governance_component,
        readiness_band=readiness_band,
    )
    db.add(row)
    db.commit()
