"""
Decision Velocity: average time to complete one governed decision cycle.
Cycle = situation recorded → decision finalized → first milestone started → first review completed.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.models import (
    Decision,
    DecisionLedgerEvent,
    DecisionExecutionMilestone,
    OutcomeReview,
)
from app.schemas.clear.ledger import LedgerEventType

# Configurable bands (days); can be made configurable per industry later
BAND_FAST_MAX = 30
BAND_HEALTHY_MAX = 60
BAND_SLOW_MAX = 90
# >= BAND_SLOW_MAX = At risk


def _days_between(start: datetime | None, end: datetime | None) -> Optional[float]:
    if start is None or end is None:
        return None
    delta = end - start
    return max(0.0, delta.total_seconds() / 86400.0)


def _band_from_avg_days(avg_cycle_days: float) -> str:
    if avg_cycle_days < BAND_FAST_MAX:
        return "fast"
    if avg_cycle_days < BAND_HEALTHY_MAX:
        return "healthy"
    if avg_cycle_days < BAND_SLOW_MAX:
        return "slow"
    return "at_risk"


def compute_decision_velocity(
    db: Session,
    enterprise_id: Optional[int] = None,
    decision_ids: Optional[list[UUID]] = None,
) -> dict[str, Any]:
    """
    Compute velocity metrics from decisions that have completed a full cycle
    (situation → finalized → first milestone → first review).

    Returns:
        avg_cycle_days, avg_time_to_decision, avg_time_to_execution, avg_time_to_review,
        velocity_band, trend_direction, cycle_count, per_decision (optional detail).
    """
    # Base query: decisions (optionally filtered by enterprise or explicit list)
    q = db.query(Decision)
    if enterprise_id is not None:
        q = q.filter(Decision.enterprise_id == enterprise_id)
    if decision_ids is not None:
        q = q.filter(Decision.decision_id.in_(decision_ids))
    decisions = q.all()

    # For each decision get: situation_created_at, decision_finalized_at, first_milestone_started_at, first_review_completed_at
    cycles: list[dict[str, Any]] = []

    for d in decisions:
        did = d.decision_id
        situation_created_at = d.created_at

        # First ARTIFACT_FINALIZED event for this decision
        finalized_ev = (
            db.query(DecisionLedgerEvent)
            .filter(
                and_(
                    DecisionLedgerEvent.decision_id == did,
                    DecisionLedgerEvent.event_type == LedgerEventType.ARTIFACT_FINALIZED.value,
                )
            )
            .order_by(DecisionLedgerEvent.created_at.asc())
            .limit(1)
            .first()
        )
        decision_finalized_at = finalized_ev.created_at if finalized_ev else None

        # First milestone (earliest created_at)
        first_milestone = (
            db.query(DecisionExecutionMilestone)
            .filter(DecisionExecutionMilestone.decision_id == did)
            .order_by(DecisionExecutionMilestone.created_at.asc())
            .limit(1)
            .first()
        )
        first_milestone_started_at = first_milestone.created_at if first_milestone else None

        # First outcome review
        first_review = (
            db.query(OutcomeReview)
            .filter(OutcomeReview.decision_id == did)
            .order_by(OutcomeReview.created_at.asc())
            .limit(1)
            .first()
        )
        first_review_completed_at = first_review.created_at if first_review else None

        # Only include full cycles (have review completed)
        if first_review_completed_at is None:
            continue

        time_to_decision = _days_between(situation_created_at, decision_finalized_at)
        time_to_execution = _days_between(decision_finalized_at, first_milestone_started_at)
        time_to_review = _days_between(first_milestone_started_at, first_review_completed_at)
        total_cycle = _days_between(situation_created_at, first_review_completed_at)

        if total_cycle is None:
            continue

        cycles.append({
            "decision_id": str(did),
            "enterprise_id": d.enterprise_id,
            "time_to_decision_days": time_to_decision,
            "time_to_execution_days": time_to_execution,
            "time_to_review_days": time_to_review,
            "total_cycle_days": total_cycle,
        })

    if not cycles:
        return {
            "avg_cycle_days": None,
            "avg_time_to_decision": None,
            "avg_time_to_execution": None,
            "avg_time_to_review": None,
            "velocity_band": None,
            "trend_direction": "stable",
            "cycle_count": 0,
            "per_decision": [],
        }

    n = len(cycles)
    avg_cycle = sum(c["total_cycle_days"] for c in cycles) / n
    avg_to_decision = sum(c["time_to_decision_days"] or 0 for c in cycles) / n
    avg_to_execution = sum(c["time_to_execution_days"] or 0 for c in cycles) / n
    avg_to_review = sum(c["time_to_review_days"] or 0 for c in cycles) / n

    velocity_band = _band_from_avg_days(avg_cycle)

    # Trend: compare to previous snapshot if we have one (optional; can be implemented with snapshot table)
    trend_direction = _trend_from_snapshots(db, enterprise_id, avg_cycle)

    return {
        "avg_cycle_days": round(avg_cycle, 1),
        "avg_time_to_decision": round(avg_to_decision, 1),
        "avg_time_to_execution": round(avg_to_execution, 1),
        "avg_time_to_review": round(avg_to_review, 1),
        "velocity_band": velocity_band,
        "trend_direction": trend_direction,
        "cycle_count": n,
        "per_decision": cycles,
    }


def _trend_from_snapshots(db: Session, enterprise_id: Optional[int], current_avg: float) -> str:
    """Compare current average to last snapshot; return improving | slowing | stable."""
    try:
        from app.db.models import DecisionVelocitySnapshot
        from datetime import date
        today = date.today()
        # Last month snapshot
        q = db.query(DecisionVelocitySnapshot).filter(
            DecisionVelocitySnapshot.snapshot_date < today,
        )
        if enterprise_id is not None:
            q = q.filter(DecisionVelocitySnapshot.enterprise_id == enterprise_id)
        prev = q.order_by(DecisionVelocitySnapshot.snapshot_date.desc()).limit(1).first()
        if prev is None or prev.avg_cycle_days is None:
            return "stable"
        prev_avg = float(prev.avg_cycle_days) if prev.avg_cycle_days is not None else current_avg
        if current_avg < prev_avg:
            return "improving"
        if current_avg > prev_avg:
            return "slowing"
        return "stable"
    except Exception:
        return "stable"


def save_velocity_snapshot(
    db: Session,
    enterprise_id: Optional[int],
    avg_cycle_days: float,
    snapshot_date: Optional[Any] = None,
    avg_time_to_decision: Optional[float] = None,
    avg_time_to_execution: Optional[float] = None,
    avg_time_to_review: Optional[float] = None,
    velocity_band: Optional[str] = None,
) -> None:
    """Append a monthly (or daily) snapshot for trend computation."""
    from app.db.models import DecisionVelocitySnapshot
    from datetime import date
    if snapshot_date is None:
        snapshot_date = date.today()
    if velocity_band is None:
        velocity_band = _band_from_avg_days(avg_cycle_days)
    row = DecisionVelocitySnapshot(
        enterprise_id=enterprise_id,
        avg_cycle_days=round(avg_cycle_days, 2),
        snapshot_date=snapshot_date,
        avg_time_to_decision=round(avg_time_to_decision, 2) if avg_time_to_decision is not None else None,
        avg_time_to_execution=round(avg_time_to_execution, 2) if avg_time_to_execution is not None else None,
        avg_time_to_review=round(avg_time_to_review, 2) if avg_time_to_review is not None else None,
        velocity_band=velocity_band,
    )
    db.add(row)
    db.commit()
