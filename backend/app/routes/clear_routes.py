"""CLEAR governance API (Phase 1). Additive only; does not alter existing agent routes."""
import logging
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Decision, DecisionLedgerEvent, DecisionArtifact, DecisionEvidenceLink, Enterprise, DecisionChatSession
from app.schemas.clear.artifact import DecisionArtifactSchema
from app.schemas.clear.enterprise import EnterpriseCreate, EnterpriseOut, EnterpriseUpdate
from app.schemas.clear.ledger import (
    DecisionOut,
    DecisionListItem,
    LedgerEventOut,
    FinalizeRequest,
    SignOffRequest,
    StatusTransitionRequest,
    CreateDecisionRequest,
    DerivedDecisionStatus,
)
from app.schemas.clear.evidence import EvidenceLinkCreate, EvidenceLinkOut
from app.governance.ledger_service import (
    LedgerServiceError,
    create_decision,
    append_artifact_created,
    finalize_decision,
    sign_off_decision,
    transition_status,
    get_latest_artifact_for_decision,
    _derive_status_from_ledger,
    _artifact_count_for_decision,
)
from app.governance.validator import governance_completeness_errors
from app.governance.bootstrap import create_draft_from_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clear", tags=["CLEAR Governance"])


# ----- Enterprises -----

@router.post("/enterprises", response_model=EnterpriseOut)
def create_enterprise(body: EnterpriseCreate, db: Session = Depends(get_db)):
    """Create enterprise (minimal profile)."""
    ent = Enterprise(
        name=body.name,
        sector=body.sector,
        geography=body.geography,
        operating_model=body.operating_model,
        size_band=body.size_band,
    )
    db.add(ent)
    db.commit()
    db.refresh(ent)
    return ent


@router.get("/enterprises", response_model=List[EnterpriseOut])
def list_enterprises(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List enterprises."""
    rows = db.query(Enterprise).offset(skip).limit(limit).all()
    return rows


@router.get("/enterprises/{enterprise_id}", response_model=EnterpriseOut)
def get_enterprise(enterprise_id: int, db: Session = Depends(get_db)):
    """Get enterprise by id."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return ent


@router.patch("/enterprises/{enterprise_id}", response_model=EnterpriseOut)
def update_enterprise(enterprise_id: int, body: EnterpriseUpdate, db: Session = Depends(get_db)):
    """Update enterprise (partial)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ent, k, v)
    db.commit()
    db.refresh(ent)
    return ent


# ----- Decisions -----

@router.post("/decisions", response_model=DecisionOut)
def create_decision_endpoint(body: CreateDecisionRequest, db: Session = Depends(get_db)):
    """Create a new decision (optional draft artifact)."""
    try:
        decision = create_decision(
            db,
            enterprise_id=body.enterprise_id,
            initial_artifact=body.initial_artifact,
            actor_id=body.actor_id,
            actor_role=body.actor_role,
        )
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    latest = get_latest_artifact_for_decision(db, decision.decision_id)
    return _decision_to_out(decision, latest, db)


@router.post("/decisions/bootstrap-from-analysis", response_model=DecisionOut)
def bootstrap_draft_from_analysis(
    domain: str = Query(..., description="cfo | cmo | coo | cto"),
    analysis_id: int = Query(...),
    enterprise_id: Optional[int] = Query(None),
    actor_id: Optional[str] = Query(None),
    actor_role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Create draft decision from agent analysis (evidence artifact). Enrich artifact before finalize."""
    try:
        decision = create_draft_from_analysis(
            db, domain=domain, analysis_id=analysis_id, enterprise_id=enterprise_id, actor_id=actor_id, actor_role=actor_role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    latest = get_latest_artifact_for_decision(db, decision.decision_id)
    return _decision_to_out(decision, latest, db)


def _decision_to_out(d: Decision, latest_art: Optional[DecisionArtifact], db: Session) -> DecisionOut:
    status = _derive_status_from_ledger(db, d.decision_id)
    version_count = _artifact_count_for_decision(db, d.decision_id)
    return DecisionOut(
        decision_id=d.decision_id,
        enterprise_id=d.enterprise_id,
        current_status=status,
        current_artifact_version=version_count,
        created_at=d.created_at,
        updated_at=d.updated_at,
        latest_artifact=latest_art.canonical_json if latest_art else None,
        latest_artifact_hash=latest_art.canonical_hash if latest_art else None,
        latest_version_id=latest_art.version_id if latest_art else None,
    )


@router.get("/decisions", response_model=List[DecisionListItem])
def list_decisions(
    enterprise_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List decisions (filter by enterprise_id, status). State derived from ledger."""
    q = db.query(Decision)
    if enterprise_id is not None:
        q = q.filter(Decision.enterprise_id == enterprise_id)
    q = q.order_by(Decision.created_at.desc()).offset(skip).limit(limit)
    rows = q.all()
    out = []
    for r in rows:
        derived_status = _derive_status_from_ledger(db, r.decision_id)
        if status is not None and derived_status != status:
            continue
        version_count = _artifact_count_for_decision(db, r.decision_id)
        out.append(DecisionListItem(decision_id=r.decision_id, enterprise_id=r.enterprise_id, current_status=derived_status, current_artifact_version=version_count, created_at=r.created_at))
    return out


@router.get("/decisions/{decision_id}", response_model=DecisionOut)
def get_decision(decision_id: UUID, db: Session = Depends(get_db)):
    """Get decision by decision_id (UUID)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    latest = get_latest_artifact_for_decision(db, d.decision_id)
    return _decision_to_out(d, latest, db)


@router.post("/decisions/{decision_id}/artifact", response_model=DecisionOut)
def add_artifact_version(
    decision_id: UUID,
    body: DecisionArtifactSchema,
    reason_code: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Append new artifact version (draft only). Supersedes is computed server-side from latest artifact; client must not supply it."""
    artifact = body.model_dump()
    try:
        append_artifact_created(
            db,
            decision_id=decision_id,
            artifact=artifact,
            reason_code=reason_code,
            actor_id=actor_id,
            actor_role=actor_role,
        )
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    latest = get_latest_artifact_for_decision(db, decision_id)
    return _decision_to_out(d, latest, db)


@router.get("/decisions/{decision_id}/completeness")
def get_completeness(decision_id: UUID, db: Session = Depends(get_db)):
    """Return governance completeness errors for current artifact (empty => ready to finalize)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    latest = get_latest_artifact_for_decision(db, decision_id)
    if not latest or not latest.canonical_json:
        return {"ready": False, "errors": ["No artifact to finalize"]}
    errors = governance_completeness_errors(latest.canonical_json)
    return {"ready": len(errors) == 0, "errors": errors}


@router.post("/decisions/{decision_id}/finalize", response_model=DecisionOut)
def finalize_decision_endpoint(decision_id: UUID, body: FinalizeRequest, db: Session = Depends(get_db)):
    """Transition to finalized. Governance completeness validator must pass; otherwise 400."""
    try:
        decision = finalize_decision(db, decision_id, actor_id=body.actor_id, actor_role=body.actor_role)
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    latest = get_latest_artifact_for_decision(db, decision.decision_id)
    return _decision_to_out(decision, latest, db)


@router.post("/decisions/{decision_id}/sign-off", response_model=DecisionOut)
def sign_off_decision_endpoint(decision_id: UUID, body: SignOffRequest, db: Session = Depends(get_db)):
    """Mandatory acknowledgement: finalized -> signed. Writes sign_off event to ledger."""
    try:
        decision = sign_off_decision(db, decision_id, actor_id=body.actor_id, actor_role=body.actor_role, comment=body.comment)
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    latest = get_latest_artifact_for_decision(db, decision.decision_id)
    return _decision_to_out(decision, latest, db)


@router.post("/decisions/{decision_id}/status", response_model=DecisionOut)
def transition_status_endpoint(decision_id: UUID, body: StatusTransitionRequest, db: Session = Depends(get_db)):
    """Rule-controlled status transition (signed->implemented, etc.). Use /finalize and /sign-off for draft->finalized->signed."""
    try:
        decision = transition_status(db, decision_id, to_status=body.to_status, reason_code=body.reason_code, actor_id=body.actor_id, actor_role=body.actor_role)
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    latest = get_latest_artifact_for_decision(db, decision.decision_id)
    return _decision_to_out(decision, latest, db)


# ----- Ledger (read-only from API) -----

@router.get("/decisions/{decision_id}/ledger", response_model=List[LedgerEventOut])
def list_ledger_events(decision_id: UUID, db: Session = Depends(get_db)):
    """List ledger events for a decision (append-only; no writes from this endpoint)."""
    events = db.query(DecisionLedgerEvent).filter(DecisionLedgerEvent.decision_id == decision_id).order_by(DecisionLedgerEvent.created_at).all()
    return events


# ----- Evidence -----

@router.post("/decisions/{decision_id}/evidence", response_model=EvidenceLinkOut)
def add_evidence_link(decision_id: UUID, body: EvidenceLinkCreate, db: Session = Depends(get_db)):
    """Link evidence to decision (analysis, rag_snippet, document, metric_snapshot)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if body.decision_id != decision_id:
        raise HTTPException(status_code=400, detail="decision_id in body must match path")
    link = DecisionEvidenceLink(
        decision_id=decision_id,
        evidence_type=body.evidence_type,
        source_ref=body.source_ref,
        source_table=body.source_table,
        source_id=body.source_id,
        retrieval_metadata=body.retrieval_metadata,
        integrity_hash=body.integrity_hash,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/decisions/{decision_id}/evidence", response_model=List[EvidenceLinkOut])
def list_evidence_links(decision_id: UUID, db: Session = Depends(get_db)):
    """List evidence links for a decision."""
    links = db.query(DecisionEvidenceLink).filter(DecisionEvidenceLink.decision_id == decision_id).all()
    return links


# ----- Chat session tagging -----

@router.put("/decisions/{decision_id}/chat-session")
def tag_chat_session(
    decision_id: UUID,
    session_id: str = Query(...),
    agent_domain: str = Query(..., pattern="^(cfo|cmo|coo|cto)$"),
    db: Session = Depends(get_db),
):
    """Tag a chat session to this decision (when user is in Decision Workspace)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if agent_domain not in ("cfo", "cmo", "coo", "cto"):
        raise HTTPException(status_code=400, detail="agent_domain must be cfo, cmo, coo, or cto")
    rec = db.query(DecisionChatSession).filter(
        DecisionChatSession.decision_id == decision_id,
        DecisionChatSession.session_id == session_id,
        DecisionChatSession.agent_domain == agent_domain,
    ).first()
    if not rec:
        rec = DecisionChatSession(decision_id=decision_id, session_id=session_id, agent_domain=agent_domain)
        db.add(rec)
        db.commit()
    return {"decision_id": str(decision_id), "session_id": session_id, "agent_domain": agent_domain}


@router.get("/decisions/{decision_id}/chat-sessions")
def list_chat_sessions(decision_id: UUID, db: Session = Depends(get_db)):
    """List chat sessions tagged to this decision."""
    rows = db.query(DecisionChatSession).filter(DecisionChatSession.decision_id == decision_id).all()
    return [{"session_id": r.session_id, "agent_domain": r.agent_domain} for r in rows]
