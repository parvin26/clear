"""Phase 3: Capability and financing readiness APIs."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import Capability, CapabilityScore, FinancingReadiness, Enterprise
from app.capability.engine import recompute_enterprise
from app.capability.schemas import CapabilityOut, CapabilityScoreOut, FinancingReadinessOut

router = APIRouter(prefix="/api/capabilities", tags=["Capabilities (Phase 3)"])


@router.post("/recompute")
def recompute(
    enterprise_id: int = Query(..., description="Enterprise to recompute"),
    decision_id: UUID | None = Query(None, description="Optional decision scope"),
    db: Session = Depends(get_db),
):
    """Recompute capability_scores and financing_readiness for an enterprise from its analyses (admin/internal)."""
    try:
        scores, fr = recompute_enterprise(db, enterprise_id, decision_id=decision_id)
        db.commit()
        return {
            "enterprise_id": enterprise_id,
            "decision_id": str(decision_id) if decision_id else None,
            "capability_scores_created": len(scores),
            "financing_readiness_created": 1 if fr else 0,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/enterprises/{enterprise_id}/capabilities", response_model=list)
def list_enterprise_capabilities(
    enterprise_id: int,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Time series of capability scores for an enterprise (latest first). Enriched with capability code, name, domain for read-only UI."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    rows = (
        db.query(CapabilityScore, Capability)
        .join(Capability, CapabilityScore.capability_id == Capability.id)
        .filter(CapabilityScore.enterprise_id == enterprise_id)
        .order_by(desc(CapabilityScore.computed_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": cs.id,
            "enterprise_id": cs.enterprise_id,
            "decision_id": str(cs.decision_id) if cs.decision_id else None,
            "capability_id": cs.capability_id,
            "capability_code": cap.code,
            "capability_name": cap.name,
            "domain": cap.domain,
            "score": float(cs.score),
            "confidence": float(cs.confidence) if cs.confidence is not None else None,
            "evidence_json": cs.evidence_json,
            "computed_at": cs.computed_at.isoformat() if cs.computed_at else None,
        }
        for cs, cap in rows
    ]


@router.get("/enterprises/{enterprise_id}/financing-readiness", response_model=list)
def list_enterprise_financing_readiness(
    enterprise_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Time series of financing readiness for an enterprise (latest first)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    rows = (
        db.query(FinancingReadiness)
        .filter(FinancingReadiness.enterprise_id == enterprise_id)
        .order_by(desc(FinancingReadiness.computed_at))
        .limit(limit)
        .all()
    )
    return [FinancingReadinessOut.model_validate(r) for r in rows]


@router.get("/definitions", response_model=list[CapabilityOut])
def list_capability_definitions(db: Session = Depends(get_db)):
    """List capability definitions (codes, domains)."""
    return db.query(Capability).all()
