"""Phase 2: Outcomes APIs."""
from uuid import UUID
from fastapi import APIRouter, Depends

from app.db.database import get_db
from sqlalchemy.orm import Session
from app.outcomes.schemas import OutcomeCreate, OutcomeOut
from app.outcomes.service import outcomes_service

router = APIRouter(prefix="/api", tags=["Outcomes (Phase 2)"])


@router.post("/decisions/{decision_id}/outcomes", response_model=OutcomeOut)
def create_outcome(
    decision_id: UUID,
    data: OutcomeCreate,
    enterprise_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Record an outcome for a decision."""
    o = outcomes_service.create_outcome(db, decision_id, data, enterprise_id=enterprise_id)
    db.commit()
    db.refresh(o)
    return o


@router.get("/decisions/{decision_id}/outcomes", response_model=list[OutcomeOut])
def list_outcomes(decision_id: UUID, db: Session = Depends(get_db)):
    """List outcomes for a decision."""
    return outcomes_service.list_by_decision(db, decision_id)
