"""Request/response for POST /api/clear/diagnostic/run (multi-agent orchestration)."""
from typing import Any, Optional
from pydantic import BaseModel, Field


class IdeaStageLeadRequest(BaseModel):
    """Body for idea-stage signup (no diagnostic run)."""
    email: Optional[str] = Field(None, max_length=255)
    short_text: Optional[str] = Field(None, max_length=2000)


class DiagnosticRunRequest(BaseModel):
    """Body for diagnostic run: optional onboarding, required diagnostic_data (wizard answers). Phase 2: enterprise_id, decision_context."""
    onboarding_context: Optional[dict[str, Any]] = None
    diagnostic_data: dict[str, Any] = Field(..., description="Wizard answers (businessStage, situationDescription, etc.)")
    enterprise_id: Optional[int] = None
    decision_context: Optional[dict[str, Any]] = None


class DiagnosticRunResponse(BaseModel):
    """Response: decision_id (null when idea_stage), synthesis_summary, next_step, payload for routing."""
    decision_id: Optional[str] = None
    idea_stage: bool = Field(False, description="True when user was off-ramped (no full diagnostic).")
    idea_stage_message: Optional[str] = None
    synthesis_summary: dict[str, Any] = Field(default_factory=dict)
    synthesis: Optional[dict[str, Any]] = None
    next_step: str = Field(..., description="playbooks | ai_chat | human_review | idea_stage")
    next_step_payload: dict[str, Any] = Field(default_factory=dict)
    enterprise_id: Optional[int] = None
    trace_id: Optional[str] = Field(None, description="Request correlation id for logging and support.")


class HumanReviewRequestSchema(BaseModel):
    """Request human review: contact + consent."""
    decision_id: str
    name: Optional[str] = None
    email: str = Field(..., min_length=1)
    whatsapp: Optional[str] = None
    country: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    consent: bool = True


class ArtifactPartialUpdate(BaseModel):
    """Partial update for decision artifact (governance, emr). Merged with latest then new version appended."""
    governance: Optional[dict[str, Any]] = None
    emr: Optional[dict[str, Any]] = None


class ExecutionCommitRequest(BaseModel):
    """Commit execution plan: set plan_committed, must_do_milestone_ids, commit_note; set governance.approval_status=approved."""
    must_do_milestone_ids: list[str] = Field(default_factory=list)
    commit_note: Optional[str] = None


class OutcomeReviewCreate(BaseModel):
    """Create an outcome review for a decision (Execution v2: main_constraint, keep_raise_reduce_stop)."""
    summary: Optional[str] = None
    what_worked: Optional[str] = None
    what_did_not_work: Optional[str] = None
    key_learnings: Optional[str] = None
    assumptions_validated: Optional[str] = None
    assumptions_broken: Optional[str] = None
    readiness_impact: Optional[str] = None  # minus_one | zero | plus_one
    main_constraint: Optional[str] = None
    keep_raise_reduce_stop: Optional[str] = None  # keep | raise | reduce | stop


class OutcomeReviewCycleSummary(BaseModel):
    """What changed after this outcome review (next_review_date advanced, readiness, next cycle focus)."""
    next_review_date: Optional[str] = None
    readiness_after: Optional[str] = None
    next_cycle_focus: Optional[str] = None
    milestones_completed: Optional[int] = None
    milestones_total: Optional[int] = None


class OutcomeReviewOut(BaseModel):
    """Outcome review response."""
    id: str
    created_at: str
    decision_id: str
    summary: Optional[str] = None
    what_worked: Optional[str] = None
    what_did_not_work: Optional[str] = None
    key_learnings: Optional[str] = None
    assumptions_validated: Optional[str] = None
    assumptions_broken: Optional[str] = None
    readiness_impact: Optional[str] = None
    main_constraint: Optional[str] = None
    keep_raise_reduce_stop: Optional[str] = None
    cycle_summary: Optional[OutcomeReviewCycleSummary] = None


class ChatMessageRequest(BaseModel):
    """Body for POST /decisions/{id}/chat/message. session_id optional: if omitted, backend creates or reuses a session."""
    session_id: Optional[str] = None
    message: str


# ----- Portfolio, timeline, members, comments, feedback -----

class PortfolioEnrichedItem(BaseModel):
    """One row in GET /api/clear/orgs/{portfolio_id}/portfolio."""
    enterprise_id: int
    enterprise_name: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    company_size_band: Optional[str] = None
    last_decision_id: Optional[str] = None
    last_primary_domain: Optional[str] = None
    readiness_band: Optional[str] = None
    last_review_date: Optional[str] = None
    has_committed_plan: bool = False
    health_score: Optional[int] = None
    health_status_label: Optional[str] = None
    health_trend_direction: Optional[str] = None
    avg_cycle_days: Optional[float] = None
    velocity_band: Optional[str] = None
    trend_direction: Optional[str] = None
    readiness_index: Optional[int] = None
    ecri_readiness_band: Optional[str] = None
    ecri_trend_direction: Optional[str] = None


class TimelineItem(BaseModel):
    """One item in GET /api/clear/enterprises/{id}/timeline."""
    decision_id: str
    created_at: Optional[str] = None
    primary_domain: Optional[str] = None
    readiness_band: Optional[str] = None
    decision_statement: Optional[str] = None
    has_outcome_review: bool = False


class EnterpriseMemberCreate(BaseModel):
    """Invite a member (email + role). Returns invite URL with token."""
    email: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., description="founder | advisor | capital_partner")


class EnterpriseMemberOut(BaseModel):
    """Member row (no token)."""
    id: int
    enterprise_id: int
    email: str
    role: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class InviteOut(BaseModel):
    """Response after inviting: invite_url for founder to share."""
    invite_url: str
    email: str
    role: str
    expires_at: Optional[str] = None


class DecisionCommentCreate(BaseModel):
    """Add a comment to a decision (advisor/founder)."""
    content: str = Field(..., min_length=1)
    author_email: str = Field(..., min_length=1)
    author_role: Optional[str] = None


class DecisionCommentOut(BaseModel):
    """Comment in list."""
    id: int
    decision_id: str
    author_email: str
    author_role: Optional[str] = None
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ImpactFeedbackCreate(BaseModel):
    """In-product feedback (framing help or cycle impact)."""
    decision_id: Optional[str] = None
    enterprise_id: Optional[int] = None
    cycle_number: Optional[int] = None
    question: str = Field(..., max_length=120)
    score: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
