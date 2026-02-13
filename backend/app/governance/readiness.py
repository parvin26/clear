"""
Capital readiness band for a decision (V1).
Based on: outcome reviews count, milestone completion rate, governance approval.
"""
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import DecisionArtifact, DecisionExecutionMilestone, OutcomeReview


def _get_latest_artifact(db: Session, decision_id: UUID) -> DecisionArtifact | None:
    return (
        db.query(DecisionArtifact)
        .filter(DecisionArtifact.decision_id == decision_id)
        .order_by(DecisionArtifact.created_at.desc())
        .limit(1)
        .first()
    )


def compute_readiness(db: Session, decision_id: UUID) -> dict[str, Any]:
    """
    Compute readiness band and raw metrics for a decision.
    Returns: { "band": "Nascent" | "Emerging" | "Institutionalizing", "metrics": { ... } }
    """
    number_of_reviews = db.query(func.count(OutcomeReview.id)).filter(OutcomeReview.decision_id == decision_id).scalar() or 0

    latest = _get_latest_artifact(db, decision_id)
    emr = (latest.canonical_json or {}).get("emr") or {} if latest else {}
    emr_milestones = emr.get("milestones") or []
    if emr_milestones:
        total_milestones = len(emr_milestones)
        completed_milestones = sum(1 for m in emr_milestones if (m.get("status") or "").lower() == "done")
    else:
        milestones = db.query(DecisionExecutionMilestone).filter(DecisionExecutionMilestone.decision_id == decision_id).all()
        total_milestones = len(milestones)
        completed_milestones = sum(1 for m in milestones if (m.status or "").lower() == "completed")
    milestone_completion_rate = completed_milestones / total_milestones if total_milestones > 0 else 0.0

    governance = (latest.canonical_json or {}).get("governance") or {} if latest else {}
    approval_status = (governance.get("approval_status") or "draft").lower()
    governance_adherence = 1.0 if approval_status == "approved" else 0.0

    if milestone_completion_rate < 0.3 or number_of_reviews == 0:
        band = "Nascent"
    elif milestone_completion_rate < 0.7:
        band = "Emerging"
    else:
        band = "Institutionalizing"

    return {
        "band": band,
        "metrics": {
            "number_of_reviews": number_of_reviews,
            "milestone_completion_rate": round(milestone_completion_rate, 2),
            "total_milestones": total_milestones,
            "completed_milestones": completed_milestones,
            "governance_adherence": governance_adherence,
        },
    }
