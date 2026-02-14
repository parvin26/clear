"""CLEAR governance API (Phase 1). Additive only; does not alter existing agent routes."""
import logging
import os
import time
import uuid
from datetime import date
from pathlib import Path
from uuid import UUID
from typing import List, Optional, Any

from app.config import settings

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Decision, DecisionLedgerEvent, DecisionArtifact, DecisionEvidenceLink, Enterprise, DecisionChatSession, DecisionExecutionMilestone, HumanReviewRequest, OutcomeReview, DiagnosticRun, IdeaStageLead, UsageEvent, ImpactFeedback, DecisionComment, EnterpriseMember, AdvisorReviewRequest
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
    ExecutionUpdateRequest,
    DerivedDecisionStatus,
)
from app.schemas.clear.milestone import MilestoneCreate, MilestoneUpdate, MilestoneOut
from app.schemas.clear.evidence import EvidenceLinkCreate, EvidenceLinkOut
from app.governance.execution_ledger_service import (
    append_task_created,
    append_task_updated,
    append_milestone_logged,
    append_outcome_recorded,
    derived_tasks,
    derived_timeline,
    derived_outcomes,
)
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
from app.schemas.clear.diagnostic_run import (
    DiagnosticRunRequest,
    DiagnosticRunResponse,
    IdeaStageLeadRequest,
    HumanReviewRequestSchema,
    ArtifactPartialUpdate,
    ExecutionCommitRequest,
    OutcomeReviewCreate,
    OutcomeReviewOut,
    OutcomeReviewCycleSummary,
    ChatMessageRequest,
    PortfolioEnrichedItem,
    TimelineItem,
    EnterpriseMemberCreate,
    EnterpriseMemberOut,
    InviteOut,
    DecisionCommentCreate,
    DecisionCommentOut,
    ImpactFeedbackCreate,
)
from app.diagnostic.run_service import run_diagnostic_run
from app.governance.readiness import compute_readiness
from app.governance.health_score import compute_health_score
from app.clear.portfolio_service import list_portfolio_enriched
from app.clear.timeline_service import get_enterprise_timeline
from app.clear.decision_velocity import compute_decision_velocity
from app.clear.members import invite_member, get_member_role_for_decision, list_members
from app.clear.usage import record_event, EVENT_DIAGNOSTIC_COMPLETED, EVENT_DECISION_CREATED, EVENT_PLAN_COMMITTED, EVENT_OUTCOME_REVIEW_CREATED, EVENT_ADVISOR_CHAT_SENT, EVENT_ADVISOR_CHAT_REPLY
from app.clear.activation import compute_activation_for_enterprise
from app.clear.activation_reminders import run_activation_reminders

logger = logging.getLogger(__name__)

# Evidence file uploads: store under backend/uploads/evidence
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = _BACKEND_DIR / "uploads" / "evidence"
ALLOWED_EXTENSIONS = frozenset(
    {"pdf", "doc", "docx", "png", "jpg", "jpeg", "gif", "webp", "md", "markdown", "xls", "xlsx", "csv", "txt"}
)
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

router = APIRouter(prefix="/api/clear", tags=["CLEAR Governance"])


# ----- Governance contract (semantic lock; no DB) -----

@router.get("/contract")
def get_governance_contract():
    """Return CLEAR governance contract (semantic lock). No DB access."""
    return {
        "contract_version": "1.0",
        "canonicalization_version": "canon_v1",
        "finalize_semantics": "finalize_then_ack",
        "artifact_status_rule": "derived_from_ledger_only",
        "ledger_event_enums": [
            "DECISION_CREATED",
            "DECISION_FINALIZED",
            "DECISION_ACKED",
            "DECISION_REVISED",
            "EVIDENCE_ATTACHED",
            "TASK_CREATED",
            "TASK_UPDATED",
            "MILESTONE_LOGGED",
            "OUTCOME_RECORDED",
        ],
        "reserved_phase2_enums": ["TASK_CREATED", "MILESTONE_LOGGED", "OUTCOME_RECORDED"],
        "pilot_mode_rules": {"enterprise_required": False},
        "scope": "CLEAR is for operating businesses. Idea-stage or pre-revenue founders can use POST /api/clear/diagnostic/idea-stage to register interest; no diagnostic run is created.",
    }


# ----- Idea-stage off-ramp (no diagnostic run) -----

@router.post("/diagnostic/idea-stage")
def idea_stage_signup(body: IdeaStageLeadRequest, db: Session = Depends(get_db)):
    """Capture signup when user selects idea/validation stage. No decision or diagnostic run created."""
    try:
        rec = IdeaStageLead(email=(body.email or "").strip() or None, short_text=(body.short_text or "").strip() or None)
        db.add(rec)
        db.commit()
    except Exception as e:
        logger.warning("idea_stage_signup save failed (table may not exist): %s", e)
        db.rollback()
    return {"success": True}


# ----- Diagnostic run (multi-agent orchestration) -----

# businessStage values that indicate idea/validation stage (no full diagnostic)
IDEA_STAGE_BUSINESS_STAGES = frozenset(
    s.lower() for s in (
        "idea / pre-revenue",
        "idea",
        "pre-revenue",
        "validation",
        "idea stage",
        "no company yet",
    )
)


@router.post("/diagnostic/run", response_model=DiagnosticRunResponse)
async def diagnostic_run_endpoint(
    body: DiagnosticRunRequest,
    db: Session = Depends(get_db),
):
    """
    Run multi-agent diagnostic: CFO, CMO, COO, CTO with diagnostic_data.
    If businessStage indicates idea/validation stage, off-ramp: no agents, no decision; return idea_stage=True.
    """
    diagnostic_data = body.diagnostic_data or {}
    business_stage = (diagnostic_data.get("businessStage") or "").strip().lower()
    if business_stage in IDEA_STAGE_BUSINESS_STAGES:
        email = None
        short_text = None
        if body.onboarding_context:
            email = (body.onboarding_context.get("email") or "").strip() or None
            short_text = (body.onboarding_context.get("short_text") or diagnostic_data.get("situationDescription") or "")[:2000].strip() or None
        try:
            rec = IdeaStageLead(email=email, short_text=short_text)
            db.add(rec)
            db.commit()
        except Exception as e:
            logger.warning("Idea-stage lead save failed: %s", e)
            db.rollback()
        trace_id = str(uuid.uuid4())
        logger.info("diagnostic_run idea_stage off_ramp trace_id=%s", trace_id)
        return DiagnosticRunResponse(
            decision_id=None,
            idea_stage=True,
            idea_stage_message="CLEAR is designed for operating businesses. We've noted your interest for a future validation path.",
            synthesis_summary={},
            next_step="idea_stage",
            next_step_payload={"message": "Use /diagnostic/idea-stage to leave contact details."},
            enterprise_id=None,
            trace_id=trace_id,
        )

    trace_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    try:
        result = await run_diagnostic_run(
            db,
            diagnostic_data=body.diagnostic_data,
            onboarding_context=body.onboarding_context,
            enterprise_id=body.enterprise_id,
            actor_id="guest",
            actor_role="msme",
        )
        if body.decision_context and result.get("decision_id"):
            try:
                from app.enterprise.decision_context_service import store_context
                store_context(UUID(result["decision_id"]), body.decision_context, db, body.enterprise_id)
                db.commit()
            except Exception as e:
                logger.warning("Store decision context failed (non-blocking): %s", e)
                db.rollback()
        try:
            record_event(db, EVENT_DIAGNOSTIC_COMPLETED, enterprise_id=result.get("enterprise_id"), decision_id=UUID(result["decision_id"]) if result.get("decision_id") else None)
            record_event(db, EVENT_DECISION_CREATED, enterprise_id=result.get("enterprise_id"), decision_id=UUID(result["decision_id"]) if result.get("decision_id") else None)
        except Exception:
            pass
        latency_sec = time.perf_counter() - t0
        logger.info("diagnostic_run completed trace_id=%s latency_sec=%.2f decision_id=%s", trace_id, latency_sec, result.get("decision_id"))
        if latency_sec > getattr(settings, "SLO_DIAGNOSTIC_RUN_P95_SEC", 90):
            logger.warning("diagnostic_run above SLO trace_id=%s latency_sec=%.2f", trace_id, latency_sec)
        return DiagnosticRunResponse(
            decision_id=result["decision_id"],
            idea_stage=False,
            synthesis_summary=result["synthesis_summary"],
            synthesis=result.get("synthesis"),
            next_step=result.get("next_step", "playbooks"),
            next_step_payload=result.get("next_step_payload", {}),
            enterprise_id=result.get("enterprise_id"),
            trace_id=trace_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("diagnostic/run failed: %s", e)
        raise HTTPException(status_code=500, detail="Diagnostic run failed. Please try again.")


@router.post("/human-review")
def human_review_request(
    body: HumanReviewRequestSchema,
    db: Session = Depends(get_db),
):
    """Capture lead when user requests human review for a decision."""
    try:
        decision_uuid = UUID(body.decision_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid decision_id")
    rec = HumanReviewRequest(
        decision_id=decision_uuid,
        name=body.name,
        email=body.email,
        whatsapp=body.whatsapp,
        country=body.country,
        company=body.company,
        role=body.role,
        consent=body.consent,
        status="pending",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "decision_id": body.decision_id, "status": "pending", "message": "Request received. We will be in touch."}


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
    activation_mode: Optional[str] = Query(None, description="Filter by activation_mode, e.g. 'cohort'"),
    db: Session = Depends(get_db),
):
    """List enterprises. Optionally filter by activation_mode."""
    q = db.query(Enterprise)
    if activation_mode is not None and activation_mode.strip():
        q = q.filter(Enterprise.activation_mode == activation_mode.strip())
    rows = q.offset(skip).limit(limit).all()
    return rows


@router.get("/enterprises/{enterprise_id}", response_model=EnterpriseOut)
def get_enterprise(enterprise_id: int, db: Session = Depends(get_db)):
    """Get enterprise by id."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return ent


@router.get("/enterprises/{enterprise_id}/activation")
def get_enterprise_activation(enterprise_id: int, db: Session = Depends(get_db)):
    """Activation progress for first CLEAR cycle (workspace_created_at, completed_steps, next_step, days_since_start)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return compute_activation_for_enterprise(db, enterprise_id)


@router.post("/internal/activation-reminders")
async def trigger_activation_reminders(
    db: Session = Depends(get_db),
    x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret"),
):
    """Run activation reminder job (Day 2,4,7,10,12 emails). Requires X-Cron-Secret header when ACTIVATION_CRON_SECRET is set."""
    if not settings.ACTIVATION_CRON_SECRET:
        raise HTTPException(status_code=503, detail="Activation reminders not configured (ACTIVATION_CRON_SECRET).")
    if (x_cron_secret or "") != settings.ACTIVATION_CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Cron-Secret.")
    result = await run_activation_reminders(db)
    return result


@router.get("/cohorts/enterprises")
def list_cohort_mode_enterprises(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List enterprises with activation_mode=cohort and their activation progress (for cohort manager view)."""
    rows = (
        db.query(Enterprise)
        .filter(Enterprise.activation_mode == "cohort")
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {"enterprise": ent, "activation": compute_activation_for_enterprise(db, ent.id)}
        for ent in rows
    ]


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


@router.get("/enterprises/{enterprise_id}/health-score")
def get_enterprise_health_score(enterprise_id: int, db: Session = Depends(get_db)):
    """Enterprise Health Score: execution discipline, governance, learning (0-100). Read-only."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return compute_health_score(db, enterprise_id)


@router.post("/enterprises/{enterprise_id}/health-score/snapshot")
def create_health_score_snapshot(enterprise_id: int, db: Session = Depends(get_db)):
    """Store current health score as monthly snapshot (for trend). Idempotent per month."""
    from app.db.models import EnterpriseHealthSnapshot
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    result = compute_health_score(db, enterprise_id)
    today = date.today()
    snapshot_date = today.replace(day=1)
    existing = (
        db.query(EnterpriseHealthSnapshot)
        .filter(
            EnterpriseHealthSnapshot.enterprise_id == enterprise_id,
            EnterpriseHealthSnapshot.snapshot_date == snapshot_date,
        )
        .first()
    )
    if existing:
        existing.score = result["total_score"]
        existing.execution_score = result["execution_score"]
        existing.governance_score = result["governance_score"]
        existing.learning_score = result["learning_score"]
        db.commit()
        return {"snapshot_date": snapshot_date.isoformat(), "score": result["total_score"], "updated": True}
    snap = EnterpriseHealthSnapshot(
        enterprise_id=enterprise_id,
        score=result["total_score"],
        execution_score=result["execution_score"],
        governance_score=result["governance_score"],
        learning_score=result["learning_score"],
        snapshot_date=snapshot_date,
    )
    db.add(snap)
    db.commit()
    return {"snapshot_date": snapshot_date.isoformat(), "score": result["total_score"], "updated": False}


@router.get("/enterprises/{enterprise_id}/readiness-index")
def get_enterprise_readiness_index(enterprise_id: int, db: Session = Depends(get_db)):
    """Execution Capital Readiness Index (ECRI): 0-100 with components and trend. Single signal for capital partners."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    from app.governance.readiness_index import compute_readiness_index_for_enterprise
    return compute_readiness_index_for_enterprise(db, enterprise_id)


@router.post("/enterprises/{enterprise_id}/readiness-index/snapshot")
def create_readiness_index_snapshot(enterprise_id: int, db: Session = Depends(get_db)):
    """Store current ECRI as snapshot (for trend). Call after key events or on schedule."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    from app.governance.readiness_index import compute_readiness_index_for_enterprise, save_readiness_snapshot
    result = compute_readiness_index_for_enterprise(db, enterprise_id)
    save_readiness_snapshot(
        db,
        enterprise_id=enterprise_id,
        readiness_index=result["readiness_index"],
        activation_component=result.get("activation_component"),
        health_component=result.get("health_component"),
        velocity_component=result.get("velocity_component"),
        governance_component=result.get("governance_component"),
        readiness_band=result.get("readiness_band"),
    )
    return {"snapshot_date": date.today().isoformat(), "readiness_index": result["readiness_index"], "readiness_band": result.get("readiness_band")}


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
        responsible_owner=getattr(d, "responsible_owner", None),
        expected_outcome=getattr(d, "expected_outcome", None),
        outcome_review_reminder=bool(getattr(d, "outcome_review_reminder", False)),
        outcome_review_notes=getattr(d, "outcome_review_notes", None),
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


@router.get("/decision-velocity")
def get_decision_velocity(
    enterprise_id: Optional[int] = Query(None, description="Filter by enterprise; omit for all decisions"),
    db: Session = Depends(get_db),
):
    """Decision velocity: avg cycle days, band, trend. For dashboard and portfolio."""
    result = compute_decision_velocity(db, enterprise_id=enterprise_id)
    return result


@router.get("/enterprises/{enterprise_id}/decision-velocity")
def get_enterprise_decision_velocity(enterprise_id: int, db: Session = Depends(get_db)):
    """Decision velocity for a single enterprise (portfolio view)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    result = compute_decision_velocity(db, enterprise_id=enterprise_id)
    return result


# ----- Portfolio (org = portfolio), timeline, members, comments, feedback -----

@router.get("/orgs/{portfolio_id}/portfolio", response_model=List[PortfolioEnrichedItem])
def get_org_portfolio(
    request: Request,
    portfolio_id: int,
    readiness_band: Optional[str] = Query(None),
    primary_domain: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    no_review_days: Optional[int] = Query(None, description="Filter: no outcome review in last N days"),
    health_score_min: Optional[int] = Query(None, ge=0, le=100, description="Filter: health score >= value"),
    health_score_max: Optional[int] = Query(None, ge=0, le=100, description="Filter: health score <= value"),
    velocity_band: Optional[str] = Query(None, description="Filter by velocity band: fast, healthy, slow, at_risk"),
    ecri_readiness_band: Optional[str] = Query(None, description="Filter by ECRI band: Capital-ready, Developing, Early"),
    api_key: Optional[str] = Query(None, alias="api_key"),
    db: Session = Depends(get_db),
):
    """Enriched portfolio view for org (portfolio_id). Optional: set CLEAR_PORTFOLIO_API_KEY and pass api_key (query) or X-API-Key header for partner access."""
    expected = os.environ.get("CLEAR_PORTFOLIO_API_KEY")
    if expected:
        key = api_key or (request.headers.get("X-API-Key") if request else None)
        if key != expected:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
    items = list_portfolio_enriched(
        db, portfolio_id,
        readiness_band=readiness_band,
        primary_domain=primary_domain,
        country=country,
        industry=industry,
        no_review_days=no_review_days,
        health_score_min=health_score_min,
        health_score_max=health_score_max,
        velocity_band=velocity_band,
        ecri_readiness_band=ecri_readiness_band,
    )
    return items


@router.get("/enterprises/{enterprise_id}/timeline", response_model=List[TimelineItem])
def get_enterprise_timeline_route(enterprise_id: int, db: Session = Depends(get_db)):
    """Timeline of decisions for this enterprise (ordered by created_at desc)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return get_enterprise_timeline(db, enterprise_id)


@router.post("/enterprises/{enterprise_id}/members", response_model=InviteOut)
def invite_enterprise_member(
    enterprise_id: int,
    body: EnterpriseMemberCreate,
    base_url: Optional[str] = Query(None, description="Frontend base URL for invite link"),
    db: Session = Depends(get_db),
):
    """Invite a member (email + role). Returns invite_url with magic-link token."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    url = (base_url or os.environ.get("CLEAR_FRONTEND_URL", "http://localhost:3000")).rstrip("/")
    result = invite_member(db, enterprise_id, body.email, body.role, base_url=url)
    return InviteOut(**result)


@router.get("/enterprises/{enterprise_id}/members", response_model=List[EnterpriseMemberOut])
def list_enterprise_members(enterprise_id: int, db: Session = Depends(get_db)):
    """List members for an enterprise (no token in response)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    members = list_members(db, enterprise_id)
    return [
        EnterpriseMemberOut(
            id=m.id,
            enterprise_id=m.enterprise_id,
            email=m.email,
            role=m.role,
            created_at=m.created_at.isoformat() if m.created_at else None,
        )
        for m in members
    ]


@router.get("/decisions/{decision_id}/viewing-role")
def get_viewing_role(decision_id: UUID, token: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Resolve viewing role from magic-link token. Returns { role, email } or empty when token invalid."""
    if not token:
        return {"role": None, "email": None}
    info = get_member_role_for_decision(db, decision_id, token)
    if not info:
        return {"role": None, "email": None}
    return {"role": info["role"], "email": info["email"]}


@router.post("/decisions/{decision_id}/advisor-invite", response_model=InviteOut)
def invite_advisor_to_decision(
    decision_id: UUID,
    body: dict,  # { name?, email, role? } e.g. { "name": "Jane", "email": "j@example.com", "role": "CFO" }
    base_url: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Invite an advisor to this decision: add as enterprise member (advisor) and create a review request."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if not d.enterprise_id:
        raise HTTPException(status_code=400, detail="Decision has no enterprise; link to an enterprise first.")
    email = (body.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    name = (body.get("name") or "").strip() or None
    role_label = (body.get("role") or "Advisor").strip() or "Advisor"
    url = (base_url or os.environ.get("CLEAR_FRONTEND_URL", "http://localhost:3000")).rstrip("/")
    result = invite_member(db, d.enterprise_id, email, "advisor", base_url=url)
    # Create advisor review request for this decision
    req = AdvisorReviewRequest(
        decision_id=decision_id,
        enterprise_id=d.enterprise_id,
        advisor_email=email.lower(),
        advisor_name=name,
        role_label=role_label,
        status="pending",
    )
    db.add(req)
    db.commit()
    # Return invite URL that lands on advisor workspace so they see "Reviews waiting for you"
    mem = db.query(EnterpriseMember).filter(
        EnterpriseMember.enterprise_id == d.enterprise_id,
        EnterpriseMember.email == email.lower(),
    ).first()
    advisor_invite_url = f"{url}/advisor?token={mem.invite_token}" if mem and mem.invite_token else result["invite_url"]
    return InviteOut(
        invite_url=advisor_invite_url,
        email=result["email"],
        role=result["role"],
        expires_at=result.get("expires_at"),
    )


@router.post("/decisions/{decision_id}/comments", response_model=DecisionCommentOut)
def create_decision_comment(decision_id: UUID, body: DecisionCommentCreate, db: Session = Depends(get_db)):
    """Add a comment (advisor or founder)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    c = DecisionComment(
        decision_id=decision_id,
        author_email=body.author_email.strip(),
        author_role=body.author_role,
        content=body.content.strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return DecisionCommentOut(
        id=c.id,
        decision_id=str(c.decision_id),
        author_email=c.author_email,
        author_role=c.author_role,
        content=c.content,
        created_at=c.created_at.isoformat() if c.created_at else None,
    )


@router.get("/decisions/{decision_id}/comments", response_model=List[DecisionCommentOut])
def list_decision_comments(decision_id: UUID, db: Session = Depends(get_db)):
    """List comments for a decision (oldest first)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    from sqlalchemy import asc
    comments = db.query(DecisionComment).filter(DecisionComment.decision_id == decision_id).order_by(asc(DecisionComment.created_at)).all()
    return [
        DecisionCommentOut(
            id=c.id,
            decision_id=str(c.decision_id),
            author_email=c.author_email,
            author_role=c.author_role,
            content=c.content,
            created_at=c.created_at.isoformat() if c.created_at else None,
        )
        for c in comments
    ]


@router.get("/decisions/{decision_id}/suggested-resources")
def get_suggested_resources(decision_id: UUID, db: Session = Depends(get_db)):
    """Suggested resources (knowledge snippets) for this decision by primary_domain and onboarding."""
    from app.diagnostic.decision_chat import _build_decision_chat_context
    from app.knowledge.retrieval import retrieve_knowledge_snippets

    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    ctx = _build_decision_chat_context(db, decision_id)
    if not ctx:
        return {"resources": []}
    snapshot = ctx.get("decision_snapshot") or {}
    synthesis = ctx.get("synthesis_summary") or {}
    onboarding = ctx.get("onboarding_context") or {}
    primary_domain = synthesis.get("primary_domain") or "coo"
    industry = onboarding.get("industry")
    country = onboarding.get("country")
    keywords = []
    st = (snapshot.get("decision_statement") or "").lower()
    for term in ("runway", "cash", "on-time", "delivery", "sop", "working capital", "collection"):
        if term in st:
            keywords.append(term)
    snippets = retrieve_knowledge_snippets(
        primary_domain=primary_domain,
        industry=industry,
        country=country,
        topic_keywords=keywords if keywords else None,
        db=db,
        top_k=5,
    )
    return {"resources": [{"title": s.get("title"), "content": s.get("content"), "source_type": s.get("source_type")} for s in snippets]}


@router.post("/impact-feedback")
def create_impact_feedback(body: ImpactFeedbackCreate, db: Session = Depends(get_db)):
    """Record in-product feedback (framing help or cycle impact)."""
    try:
        dec_id = UUID(body.decision_id) if body.decision_id else None
    except (ValueError, TypeError):
        dec_id = None
    fid = ImpactFeedback(
        enterprise_id=body.enterprise_id,
        decision_id=dec_id,
        cycle_number=body.cycle_number,
        question=body.question[:120],
        score=body.score,
        comment=body.comment,
    )
    db.add(fid)
    db.commit()
    db.refresh(fid)
    return {"id": fid.id, "message": "Thank you for your feedback."}


@router.patch("/decisions/{decision_id}/execution", response_model=DecisionOut)
def update_decision_execution(decision_id: UUID, body: ExecutionUpdateRequest, db: Session = Depends(get_db)):
    """Update execution metadata: responsible_owner, expected_outcome, outcome_review_reminder, outcome_review_notes."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    payload = body.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    latest = get_latest_artifact_for_decision(db, d.decision_id)
    return _decision_to_out(d, latest, db)


@router.get("/decisions/{decision_id}/milestones", response_model=List[MilestoneOut])
def list_milestones(decision_id: UUID, db: Session = Depends(get_db)):
    """List execution milestones for a decision (ordered by due_date)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    rows = db.query(DecisionExecutionMilestone).filter(DecisionExecutionMilestone.decision_id == decision_id).order_by(DecisionExecutionMilestone.due_date.asc(), DecisionExecutionMilestone.created_at.asc()).all()
    return rows


@router.post("/decisions/{decision_id}/milestones", response_model=MilestoneOut)
def create_milestone(decision_id: UUID, body: MilestoneCreate, db: Session = Depends(get_db)):
    """Create an execution milestone."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    m = DecisionExecutionMilestone(
        decision_id=decision_id,
        milestone_name=body.milestone_name,
        responsible_person=body.responsible_person,
        due_date=body.due_date,
        status=body.status,
        notes=body.notes,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/decisions/{decision_id}/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(decision_id: UUID, milestone_id: int, body: MilestoneUpdate, db: Session = Depends(get_db)):
    """Update a milestone (e.g. mark completed, edit due_date, notes)."""
    m = db.query(DecisionExecutionMilestone).filter(
        DecisionExecutionMilestone.decision_id == decision_id,
        DecisionExecutionMilestone.id == milestone_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Milestone not found")
    payload = body.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/decisions/{decision_id}/milestones/{milestone_id}")
def delete_milestone(decision_id: UUID, milestone_id: int, db: Session = Depends(get_db)):
    """Delete an execution milestone."""
    m = db.query(DecisionExecutionMilestone).filter(
        DecisionExecutionMilestone.decision_id == decision_id,
        DecisionExecutionMilestone.id == milestone_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(m)
    db.commit()
    return {"ok": True}


@router.post("/decisions/{decision_id}/execution/commit", response_model=DecisionOut)
def commit_execution_plan(
    decision_id: UUID,
    body: ExecutionCommitRequest,
    actor_id: Optional[str] = Query(None),
    actor_role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Commit execution plan: set plan_committed, must_do_milestone_ids, commit_note; set governance.approval_status=approved."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    latest = get_latest_artifact_for_decision(db, decision_id)
    if not latest or not latest.canonical_json:
        raise HTTPException(status_code=400, detail="No artifact to update")
    merged = dict(latest.canonical_json)
    merged["plan_committed"] = True
    merged["must_do_milestone_ids"] = list(body.must_do_milestone_ids)[:3]
    merged["commit_note"] = body.commit_note
    gov = dict(merged.get("governance") or {})
    gov["approval_status"] = "approved"
    merged["governance"] = gov
    try:
        append_artifact_created(
            db,
            decision_id=decision_id,
            artifact=merged,
            reason_code="execution_plan_committed",
            actor_id=actor_id or "guest",
            actor_role=actor_role or "msme",
        )
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        record_event(db, EVENT_PLAN_COMMITTED, enterprise_id=d.enterprise_id, decision_id=decision_id)
    except Exception:
        pass
    latest = get_latest_artifact_for_decision(db, decision_id)
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


@router.patch("/decisions/{decision_id}/artifact", response_model=DecisionOut)
def patch_artifact_partial(
    decision_id: UUID,
    body: ArtifactPartialUpdate,
    actor_id: Optional[str] = Query(None),
    actor_role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Merge governance and/or emr into latest artifact and append a new version (draft only)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    latest = get_latest_artifact_for_decision(db, decision_id)
    if not latest or not latest.canonical_json:
        raise HTTPException(status_code=400, detail="No artifact to update")
    merged = dict(latest.canonical_json)
    if body.governance is not None:
        merged["governance"] = body.governance
    if body.emr is not None:
        merged["emr"] = body.emr
    try:
        append_artifact_created(
            db,
            decision_id=decision_id,
            artifact=merged,
            reason_code="governance_or_emr_update",
            actor_id=actor_id or "guest",
            actor_role=actor_role or "msme",
        )
    except LedgerServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
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


def _ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/decisions/{decision_id}/evidence/upload", response_model=EvidenceLinkOut)
def upload_evidence_file(
    decision_id: UUID,
    file: UploadFile = File(...),
    evidence_type: str = Form("document"),
    db: Session = Depends(get_db),
):
    """Upload a file as evidence (documents, images, md, excel, etc.) and link it to the decision."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if evidence_type not in ("analysis", "rag_snippet", "document", "metric_snapshot"):
        evidence_type = "document"
    # Validate extension
    raw = file.filename or ""
    ext = (raw.rsplit(".", 1)[-1].lower()) if "." in raw else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    # Read and size-check
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB",
        )
    _ensure_upload_dir()
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / safe_name
    path.write_bytes(content)
    uri = f"/api/clear/uploads/evidence/{safe_name}"
    source_ref = {"system": "object_store", "uri": uri}
    link = DecisionEvidenceLink(
        decision_id=decision_id,
        evidence_type=evidence_type,
        source_ref=source_ref,
        source_table="upload",
        source_id=safe_name,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/uploads/evidence/{filename}")
def serve_evidence_file(filename: str):
    """Serve an uploaded evidence file by filename (no path traversal)."""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename)


# ----- Outcome reviews -----

def _build_last_cycle_summary(
    db: Session,
    decision_id: UUID,
    latest_artifact: dict,
    readiness_before: str,
    review_rec: OutcomeReview,
) -> dict:
    """Build last_cycle_summary for storage in artifact canonical_json."""
    from app.governance.readiness import compute_readiness
    emr = latest_artifact.get("emr") or {}
    milestones = emr.get("milestones") or []
    total = len(milestones)
    completed = sum(1 for m in milestones if (m.get("status") or "").lower() in ("done", "completed"))
    readiness_after_data = compute_readiness(db, decision_id)
    readiness_after = readiness_after_data.get("band") or "-"
    keep_raise = getattr(review_rec, "keep_raise_reduce_stop", None) or ""
    key_learnings = (review_rec.key_learnings or "").strip()[:200]
    next_cycle_focus = f"{keep_raise}".strip()
    if key_learnings:
        next_cycle_focus = (next_cycle_focus + " " + key_learnings).strip() or "Focus from review."
    if not next_cycle_focus:
        next_cycle_focus = "Focus from review."
    review_count = db.query(OutcomeReview).filter(OutcomeReview.decision_id == decision_id).count()
    return {
        "cycle_number": review_count,
        "milestones_completed": completed,
        "milestones_total": total,
        "readiness_before": readiness_before,
        "readiness_after": readiness_after,
        "next_cycle_focus": next_cycle_focus[:500],
    }


@router.post("/decisions/{decision_id}/outcome-review", response_model=OutcomeReviewOut)
def create_outcome_review(decision_id: UUID, body: OutcomeReviewCreate, db: Session = Depends(get_db)):
    """Create an outcome review for this decision."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    latest = get_latest_artifact_for_decision(db, decision_id)
    readiness_before = "-"
    if latest and latest.canonical_json:
        from app.governance.readiness import compute_readiness
        r = compute_readiness(db, decision_id)
        readiness_before = r.get("band") or "-"
    rec = OutcomeReview(
        decision_id=decision_id,
        summary=body.summary,
        what_worked=body.what_worked,
        what_did_not_work=body.what_did_not_work,
        key_learnings=body.key_learnings,
        assumptions_validated=body.assumptions_validated,
        assumptions_broken=body.assumptions_broken,
        readiness_impact=body.readiness_impact,
        main_constraint=getattr(body, "main_constraint", None),
        keep_raise_reduce_stop=getattr(body, "keep_raise_reduce_stop", None),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    try:
        record_event(db, EVENT_OUTCOME_REVIEW_CREATED, enterprise_id=d.enterprise_id, decision_id=decision_id)
    except Exception:
        pass
    # Advance EMR next_review_date and store last_cycle_summary when decision is draft (Execution v2)
    cycle_summary = None
    try:
        current = _derive_status_from_ledger(db, decision_id)
        if current == DerivedDecisionStatus.DRAFT.value:
            latest = get_latest_artifact_for_decision(db, decision_id)
            if latest and latest.canonical_json:
                from datetime import datetime, timedelta
                merged = dict(latest.canonical_json)
                emr = merged.get("emr") or {}
                config = dict(emr.get("config") or {})
                cadence = (config.get("cadence") or "monthly").lower()
                next_review = config.get("next_review_date")
                if next_review:
                    try:
                        base = datetime.fromisoformat(next_review.replace("Z", "+00:00"))
                    except Exception:
                        base = datetime.utcnow()
                else:
                    base = datetime.utcnow()
                if "week" in cadence:
                    next_date = base + timedelta(days=7)
                elif "biweek" in cadence or "fortnight" in cadence:
                    next_date = base + timedelta(days=14)
                else:
                    next_date = base + timedelta(days=30)
                config["next_review_date"] = next_date.strftime("%Y-%m-%d")
                emr["config"] = config
                merged["emr"] = emr
                last_cycle = _build_last_cycle_summary(db, decision_id, merged, readiness_before, rec)
                merged["last_cycle_summary"] = last_cycle
                cycle_summaries = list(merged.get("cycle_summaries") or [])
                cycle_summaries.append(last_cycle)
                merged["cycle_summaries"] = cycle_summaries[-10:]
                append_artifact_created(
                    db,
                    decision_id=decision_id,
                    artifact=merged,
                    reason_code="outcome_review_next_date_advance",
                    actor_id="system",
                    actor_role="outcome_review",
                )
                cycle_summary = OutcomeReviewCycleSummary(
                    next_review_date=config.get("next_review_date"),
                    readiness_after=last_cycle.get("readiness_after"),
                    next_cycle_focus=last_cycle.get("next_cycle_focus"),
                    milestones_completed=last_cycle.get("milestones_completed"),
                    milestones_total=last_cycle.get("milestones_total"),
                )
    except LedgerServiceError:
        pass
    return OutcomeReviewOut(
        id=str(rec.id),
        created_at=rec.created_at.isoformat(),
        decision_id=str(rec.decision_id),
        summary=rec.summary,
        what_worked=rec.what_worked,
        what_did_not_work=rec.what_did_not_work,
        key_learnings=rec.key_learnings,
        assumptions_validated=rec.assumptions_validated,
        assumptions_broken=rec.assumptions_broken,
        readiness_impact=rec.readiness_impact,
        main_constraint=getattr(rec, "main_constraint", None),
        keep_raise_reduce_stop=getattr(rec, "keep_raise_reduce_stop", None),
        cycle_summary=cycle_summary,
    )


@router.get("/decisions/{decision_id}/outcome-reviews", response_model=List[OutcomeReviewOut])
def list_outcome_reviews(decision_id: UUID, db: Session = Depends(get_db)):
    """List outcome reviews for this decision (most recent first)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    rows = db.query(OutcomeReview).filter(OutcomeReview.decision_id == decision_id).order_by(OutcomeReview.created_at.desc()).all()
    return [
        OutcomeReviewOut(
            id=str(r.id),
            created_at=r.created_at.isoformat(),
            decision_id=str(r.decision_id),
            summary=r.summary,
            what_worked=r.what_worked,
            what_did_not_work=r.what_did_not_work,
            key_learnings=r.key_learnings,
            assumptions_validated=r.assumptions_validated,
            assumptions_broken=r.assumptions_broken,
            main_constraint=getattr(r, "main_constraint", None),
            keep_raise_reduce_stop=getattr(r, "keep_raise_reduce_stop", None),
            readiness_impact=r.readiness_impact,
        )
        for r in rows
    ]


@router.get("/decisions/{decision_id}/readiness")
def get_readiness(decision_id: UUID, db: Session = Depends(get_db)):
    """Capital readiness band for this decision (Nascent | Emerging | Institutionalizing)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return compute_readiness(db, decision_id)


# ----- Chat (seed for diagnostic flow) -----

@router.post("/decisions/{decision_id}/chat/seed")
def decision_chat_seed(decision_id: UUID, db: Session = Depends(get_db)):
    """Return initial assistant message for decision context (e.g. when from_diagnostic=1). Call once; UI stores in state and sets seeded flag."""
    from app.diagnostic.decision_chat import generate_first_assistant_message

    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    initial_message = generate_first_assistant_message(db, decision_id)
    return {"initial_message": initial_message}


# ----- Chat session tagging -----

@router.get("/decisions/{decision_id}/chat-context")
def get_decision_chat_context(decision_id: UUID, db: Session = Depends(get_db)):
    """Return chat_context for the decision (for UI context chip: decision, must-do milestones, constraints)."""
    from app.diagnostic.decision_chat import build_chat_context_for_advisor

    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    chat_context = build_chat_context_for_advisor(db, decision_id)
    return {"chat_context": chat_context}


@router.post("/decisions/{decision_id}/chat/start")
def decision_chat_start(decision_id: UUID, db: Session = Depends(get_db)):
    """Start or resume decision-scoped chat. Returns session_id, initial assistant message, and chat_context (for context chip)."""
    from uuid import uuid4
    from app.diagnostic.decision_chat import generate_first_assistant_message, build_chat_context_for_advisor

    trace_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    rec = db.query(DecisionChatSession).filter(
        DecisionChatSession.decision_id == decision_id,
        DecisionChatSession.agent_domain == "unified",
    ).first()
    if rec:
        session_id = rec.session_id
    else:
        session_id = str(uuid4())
        rec = DecisionChatSession(decision_id=decision_id, session_id=session_id, agent_domain="unified")
        db.add(rec)
        db.commit()
    initial_message = generate_first_assistant_message(db, decision_id)
    chat_context = build_chat_context_for_advisor(db, decision_id)
    latency_sec = time.perf_counter() - t0
    logger.info("chat_start trace_id=%s decision_id=%s latency_sec=%.2f", trace_id, decision_id, latency_sec)
    if latency_sec > getattr(settings, "SLO_CHAT_MESSAGE_P95_SEC", 15):
        logger.warning("chat_start above SLO trace_id=%s latency_sec=%.2f", trace_id, latency_sec)
    return {"session_id": session_id, "initial_assistant_message": initial_message, "chat_context": chat_context, "trace_id": trace_id}


@router.post("/decisions/{decision_id}/chat/message")
def decision_chat_message(decision_id: UUID, body: ChatMessageRequest, db: Session = Depends(get_db)):
    """Send a message in decision-scoped chat; returns assistant reply (stateless, context from artifact)."""
    from app.diagnostic.decision_chat import generate_assistant_reply

    trace_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    assistant_message = generate_assistant_reply(db, decision_id, body.message)
    try:
        record_event(db, EVENT_ADVISOR_CHAT_SENT, enterprise_id=d.enterprise_id, decision_id=decision_id)
        record_event(db, EVENT_ADVISOR_CHAT_REPLY, enterprise_id=d.enterprise_id, decision_id=decision_id)
    except Exception:
        pass
    latency_sec = time.perf_counter() - t0
    logger.info("chat_message trace_id=%s decision_id=%s latency_sec=%.2f", trace_id, decision_id, latency_sec)
    if latency_sec > getattr(settings, "SLO_CHAT_MESSAGE_P95_SEC", 15):
        logger.warning("chat_message above SLO trace_id=%s latency_sec=%.2f", trace_id, latency_sec)
    return {"assistant_message": assistant_message, "trace_id": trace_id}


@router.put("/decisions/{decision_id}/chat-session")
def tag_chat_session(
    decision_id: UUID,
    session_id: str = Query(...),
    agent_domain: str = Query(..., pattern="^(cfo|cmo|coo|cto|unified)$"),
    db: Session = Depends(get_db),
):
    """Tag a chat session to this decision (when user is in Decision Workspace)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    if agent_domain not in ("cfo", "cmo", "coo", "cto", "unified"):
        raise HTTPException(status_code=400, detail="agent_domain must be cfo, cmo, coo, cto, or unified")
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


# ----- Phase 2: Event-sourced execution (write events only; read derived state) -----

def _parse_date(v: Any):
    if v is None:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        return date.fromisoformat(v[:10])
    return None


@router.post("/decisions/{decision_id}/tasks/events", response_model=dict)
def create_task_event(
    decision_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
):
    """Emit TASK_CREATED; returns task_key (uuid) for later TASK_UPDATED / MILESTONE_LOGGED. No mutable task row."""
    try:
        task_key = append_task_created(
            db,
            decision_id,
            title=body.get("title", ""),
            owner=body.get("owner"),
            due_date=_parse_date(body.get("due_date")),
            status=body.get("status", "planned"),
            action_plan_ref=body.get("action_plan_ref"),
            meta_json=body.get("meta_json"),
            actor_id=body.get("actor_id"),
            actor_role=body.get("actor_role"),
        )
        db.commit()
        return {"task_key": str(task_key)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/decisions/{decision_id}/tasks/derived")
def list_tasks_derived(decision_id: UUID, db: Session = Depends(get_db)):
    """Task list derived from TASK_CREATED + TASK_UPDATED events (no mutable task table)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return derived_tasks(db, decision_id)


@router.post("/decisions/{decision_id}/tasks/{task_key}/events")
def post_task_update_event(
    decision_id: UUID,
    task_key: UUID,
    body: dict,
    db: Session = Depends(get_db),
):
    """Emit TASK_UPDATED (status/due_date/owner etc.). No mutable row update."""
    try:
        append_task_updated(
            db,
            decision_id,
            task_key,
            body.get("changes", body),
            actor_id=body.get("actor_id"),
            actor_role=body.get("actor_role"),
        )
        db.commit()
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/decisions/{decision_id}/tasks/{task_key}/milestones")
def post_milestone_event(
    decision_id: UUID,
    task_key: UUID,
    body: dict,
    db: Session = Depends(get_db),
):
    """Emit MILESTONE_LOGGED. No mutable milestone row."""
    try:
        append_milestone_logged(
            db,
            decision_id,
            task_key,
            body.get("milestone_type", "milestone"),
            evidence_text=body.get("evidence_text"),
            evidence_url=body.get("evidence_url"),
            metrics_json=body.get("metrics_json"),
            actor_id=body.get("actor_id"),
            actor_role=body.get("actor_role"),
        )
        db.commit()
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/decisions/{decision_id}/outcomes/events")
def post_outcome_event(
    decision_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
):
    """Emit OUTCOME_RECORDED. No mutable outcome row."""
    try:
        append_outcome_recorded(
            db,
            decision_id,
            body.get("outcome_type", "outcome"),
            body.get("metrics_json", {}),
            notes=body.get("notes"),
            actor_id=body.get("actor_id"),
            actor_role=body.get("actor_role"),
        )
        db.commit()
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/decisions/{decision_id}/timeline")
def get_decision_timeline(decision_id: UUID, limit: int = 200, db: Session = Depends(get_db)):
    """Ordered execution/outcome events for a decision (derived from ledger)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return derived_timeline(db, decision_id, limit=limit)


@router.get("/decisions/{decision_id}/outcomes/derived")
def list_outcomes_derived(decision_id: UUID, db: Session = Depends(get_db)):
    """Outcomes derived from OUTCOME_RECORDED events (no mutable outcome table)."""
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return derived_outcomes(db, decision_id)
