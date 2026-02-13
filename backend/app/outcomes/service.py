"""Phase 2: Outcomes service."""
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import Outcome
from app.outcomes.schemas import OutcomeCreate


class OutcomesService:
    @staticmethod
    def create_outcome(
        db: Session,
        decision_id: UUID,
        data: OutcomeCreate,
        enterprise_id: Optional[int] = None,
    ) -> Outcome:
        o = Outcome(
            decision_id=decision_id,
            enterprise_id=enterprise_id,
            outcome_type=data.outcome_type,
            metrics_json=data.metrics_json,
            notes=data.notes,
        )
        db.add(o)
        db.flush()
        return o

    @staticmethod
    def list_by_decision(db: Session, decision_id: UUID):
        return (
            db.query(Outcome)
            .filter(Outcome.decision_id == decision_id)
            .order_by(desc(Outcome.measured_at))
            .all()
        )


outcomes_service = OutcomesService()
