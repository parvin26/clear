"""
CLEAR Activation Engine — server-side progress for first decision cycle.
Derives activation state from enterprise's decisions, milestones, artifacts, outcome reviews.
Used by GET /api/clear/enterprises/:id/activation and for cohort rollout (Layer 5).
"""
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.models import (
    Enterprise,
    Decision,
    DecisionArtifact,
    DecisionExecutionMilestone,
    OutcomeReview,
)
from app.governance.ledger_service import _derive_status_from_ledger

ACTIVATION_STEP_KEYS = ["describe", "diagnostic", "finalize", "milestones", "review"]


def _is_finalized(status: str) -> bool:
    s = (status or "").lower()
    return s in ("finalized", "signed_off", "approved", "implemented", "outcome_tracked")


def _has_review_scheduled(db: Session, decision_id) -> bool:
    """True if decision has outcome_review_reminder or artifact has next_review_date or has any outcome review."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if d and getattr(d, "outcome_review_reminder", False):
        return True
    if db.query(OutcomeReview).filter(OutcomeReview.decision_id == decision_id).limit(1).first():
        return True
    art = (
        db.query(DecisionArtifact)
        .filter(DecisionArtifact.decision_id == decision_id)
        .order_by(desc(DecisionArtifact.created_at))
        .limit(1)
        .first()
    )
    if not art or not art.canonical_json:
        return False
    emr = (art.canonical_json or {}).get("emr") or {}
    config = emr.get("config") or {}
    next_review = config.get("next_review_date")
    return isinstance(next_review, str) and next_review.strip() != ""


def compute_activation_for_enterprise(db: Session, enterprise_id: int) -> dict[str, Any]:
    """
    Compute activation progress for an enterprise from DB.
    Returns: workspace_created_at, completed_steps, completed_count, next_step_key, days_since_start, all_complete.
    """
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        return {}

    workspace_created_at = ent.created_at
    decisions = (
        db.query(Decision)
        .filter(Decision.enterprise_id == enterprise_id)
        .order_by(desc(Decision.created_at))
        .all()
    )

    completed_steps: list[str] = []
    has_any_decision = len(decisions) > 0
    if has_any_decision:
        completed_steps.extend(["describe", "diagnostic"])

    has_finalized = False
    has_milestones = False
    has_review = False

    for d in decisions:
        status = _derive_status_from_ledger(db, d.decision_id)
        if _is_finalized(status):
            has_finalized = True
        if _has_review_scheduled(db, d.decision_id):
            has_review = True

    milestone_count = (
        db.query(func.count(DecisionExecutionMilestone.id))
        .join(Decision, DecisionExecutionMilestone.decision_id == Decision.decision_id)
        .filter(Decision.enterprise_id == enterprise_id)
        .scalar()
    ) or 0
    if milestone_count and milestone_count > 0:
        has_milestones = True

    if has_finalized:
        completed_steps.append("finalize")
    if has_milestones:
        completed_steps.append("milestones")
    if has_review:
        completed_steps.append("review")

    completed_count = len(completed_steps)
    next_step_key = ACTIVATION_STEP_KEYS[completed_count] if completed_count < len(ACTIVATION_STEP_KEYS) else None
    all_complete = completed_count >= len(ACTIVATION_STEP_KEYS)

    now = datetime.now(timezone.utc)
    created = workspace_created_at.replace(tzinfo=timezone.utc) if workspace_created_at.tzinfo is None else workspace_created_at
    days_since_start = max(0, (now - created).days)

    return {
        "workspace_created_at": workspace_created_at.isoformat() if workspace_created_at else None,
        "completed_steps": completed_steps,
        "completed_count": completed_count,
        "next_step_key": next_step_key,
        "all_complete": all_complete,
        "days_since_start": days_since_start,
        "activation_mode": getattr(ent, "activation_mode", None) or "enterprise",
    }
