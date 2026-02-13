"""Enterprise timeline: ordered decisions with readiness and outcome review flag."""
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import Decision, OutcomeReview
from app.governance.ledger_service import get_latest_artifact_for_decision
from app.governance.readiness import compute_readiness


def get_enterprise_timeline(db: Session, enterprise_id: int) -> list[dict[str, Any]]:
    """
    Return ordered list of decisions for this enterprise: decision_id, created_at, primary_domain,
    readiness_band (current for that decision), decision_statement (truncated), has_outcome_review.
    """
    decisions = (
        db.query(Decision)
        .filter(Decision.enterprise_id == enterprise_id)
        .order_by(desc(Decision.created_at))
        .all()
    )
    out = []
    for d in decisions:
        art = get_latest_artifact_for_decision(db, d.decision_id)
        artifact_json = (art.canonical_json or {}) if art else {}
        synthesis = artifact_json.get("synthesis_summary") or {}
        snapshot = artifact_json.get("decision_snapshot") or {}
        primary_domain = synthesis.get("primary_domain")
        statement = (snapshot.get("decision_statement") or "")[:200]
        readiness = compute_readiness(db, d.decision_id)
        has_review = (
            db.query(OutcomeReview).filter(OutcomeReview.decision_id == d.decision_id).limit(1).first()
            is not None
        )
        out.append({
            "decision_id": str(d.decision_id),
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "primary_domain": primary_domain,
            "readiness_band": readiness.get("band"),
            "decision_statement": statement,
            "has_outcome_review": has_review,
        })
    return out
