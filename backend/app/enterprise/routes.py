"""Phase 2: Enterprise CRUD + decision context APIs at /api/enterprises and /api/decisions/{id}/context."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.enterprise.schemas import (
    EnterpriseCreate,
    EnterpriseUpdate,
    EnterpriseOut,
    EnterpriseListItem,
    DecisionContextCreate,
    DecisionContextOut,
)
from app.enterprise.service import enterprise_service
from app.enterprise.decision_context_service import store_context, get_context, get_context_history

router = APIRouter(prefix="/api", tags=["Enterprise (Phase 2)"])


@router.post("/enterprises", response_model=EnterpriseOut)
def create_enterprise(data: EnterpriseCreate, db: Session = Depends(get_db)):
    """Create enterprise (Phase 2)."""
    ent = enterprise_service.create(db, data)
    db.commit()
    db.refresh(ent)
    return ent


@router.get("/enterprises", response_model=list[EnterpriseListItem])
def list_enterprises(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List enterprises."""
    return enterprise_service.list_(db, skip=skip, limit=limit)


@router.get("/enterprises/{id}", response_model=EnterpriseOut)
def get_enterprise(id: int, db: Session = Depends(get_db)):
    """Get enterprise by id."""
    ent = enterprise_service.get_by_id(db, id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return ent


@router.patch("/enterprises/{id}", response_model=EnterpriseOut)
def update_enterprise(id: int, data: EnterpriseUpdate, db: Session = Depends(get_db)):
    """Update enterprise (partial)."""
    ent = enterprise_service.update(db, id, data)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    db.commit()
    db.refresh(ent)
    return ent


@router.post("/decisions/{decision_id}/context", response_model=DecisionContextOut)
def post_decision_context(
    decision_id: UUID,
    body: DecisionContextCreate,
    db: Session = Depends(get_db),
):
    """Store context snapshot for a decision."""
    rec = store_context(decision_id, body.context_json, db, enterprise_id=body.enterprise_id)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/decisions/{decision_id}/context")
def get_decision_context(decision_id: UUID, db: Session = Depends(get_db)):
    """Get latest context snapshot + full history for a decision (Phase 2: append-only)."""
    latest = get_context(decision_id, db)
    history = get_context_history(decision_id, db)

    def _row(r):
        return {
            "id": r.id,
            "decision_id": str(r.decision_id),
            "enterprise_id": r.enterprise_id,
            "context_json": r.context_json,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
    return {
        "latest": _row(latest) if latest else None,
        "history": [_row(r) for r in history],
    }
