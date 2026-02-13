"""Record usage events (server-side only; no PII beyond enterprise/decision IDs)."""
import logging
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import UsageEvent

logger = logging.getLogger(__name__)

EVENT_DIAGNOSTIC_STARTED = "diagnostic_started"
EVENT_DIAGNOSTIC_COMPLETED = "diagnostic_completed"
EVENT_DECISION_CREATED = "decision_created"
EVENT_PLAN_COMMITTED = "plan_committed"
EVENT_OUTCOME_REVIEW_CREATED = "outcome_review_created"
EVENT_ADVISOR_CHAT_SENT = "advisor_chat_sent"
EVENT_ADVISOR_CHAT_REPLY = "advisor_chat_reply"


def record_event(
    db: Session,
    event_type: str,
    enterprise_id: int | None = None,
    decision_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Insert one usage_events row. Call from routes after the action succeeds."""
    try:
        ev = UsageEvent(
            enterprise_id=enterprise_id,
            decision_id=decision_id,
            event_type=event_type,
            event_metadata=metadata or None,
        )
        db.add(ev)
        db.commit()
    except Exception as e:
        logger.warning("Usage event record failed (non-blocking): %s", e)
        db.rollback()
