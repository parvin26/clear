"""Phase 2: Store and retrieve decision context (append-only snapshots)."""
from uuid import UUID
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import DecisionContext


def store_context(
    decision_id: UUID,
    context_json: dict,
    db: Session,
    enterprise_id: Optional[int] = None,
) -> DecisionContext:
    """Append a new context snapshot for a decision_id (append-only; never update)."""
    rec = DecisionContext(
        decision_id=decision_id,
        enterprise_id=enterprise_id,
        context_json=context_json,
    )
    db.add(rec)
    db.flush()
    return rec


def get_context(decision_id: UUID, db: Session) -> Optional[DecisionContext]:
    """Get latest context snapshot for a decision_id."""
    return (
        db.query(DecisionContext)
        .filter(DecisionContext.decision_id == decision_id)
        .order_by(desc(DecisionContext.created_at))
        .first()
    )


def get_context_history(decision_id: UUID, db: Session, limit: int = 50) -> List[DecisionContext]:
    """Get all context snapshots for a decision_id (newest first)."""
    return (
        db.query(DecisionContext)
        .filter(DecisionContext.decision_id == decision_id)
        .order_by(desc(DecisionContext.created_at))
        .limit(limit)
        .all()
    )
