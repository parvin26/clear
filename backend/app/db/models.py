"""
Unified SQLAlchemy database models for Exec-Connect.
Combines models from all four AI agents (CFO, CMO, COO, CTO) and CLEAR governance.
"""
import uuid
from sqlalchemy import Boolean, Column, Integer, BigInteger, String, DateTime, Date, ForeignKey, JSON, Text, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class User(Base):
    """User model for storing user information. Auth: password_hash and email_verified_at for CLEAR sign-up."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cfo_analyses = relationship("CFOAnalysis", back_populates="user", cascade="all, delete-orphan")
    cmo_analyses = relationship("CMOAnalysis", back_populates="user", cascade="all, delete-orphan")
    coo_analyses = relationship("COOAnalysis", back_populates="user", cascade="all, delete-orphan")
    cto_analyses = relationship("CTOAnalysis", back_populates="user", cascade="all, delete-orphan")
    cfo_chat_messages = relationship("CFOChatMessage", back_populates="user", cascade="all, delete-orphan")
    cmo_chat_messages = relationship("CMOChatMessage", back_populates="user", cascade="all, delete-orphan")
    coo_chat_messages = relationship("COOChatMessage", back_populates="user", cascade="all, delete-orphan")
    cto_chat_messages = relationship("CTOChatMessage", back_populates="user", cascade="all, delete-orphan")


class PendingVerification(Base):
    """OTP or magic-link tokens for sign-up and sign-in. Single table for both; token_hash stores hashed OTP or link token."""
    __tablename__ = "pending_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False, index=True)  # signup_otp, magic_link
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# CFO Models
class CFOAnalysis(Base):
    """Stores AI-CFO diagnostic analyses."""
    __tablename__ = "cfo_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    input_payload = Column(JSON, nullable=False)
    analysis_json = Column(JSON, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)  # "green", "yellow", "red"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="cfo_analyses")


class FinanceDocument(Base):
    """Documents for RAG (vector embeddings) - Finance domain."""
    __tablename__ = "finance_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embedding dimension
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CFOChatMessage(Base):
    """Chat conversations with AI-CFO."""
    __tablename__ = "cfo_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="cfo_chat_messages")


# CMO Models
class CMOAnalysis(Base):
    """CMO Analysis model for storing diagnostic analyses."""
    __tablename__ = "cmo_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    input_payload = Column(JSON, nullable=False)
    analysis_json = Column(JSON, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)  # green, yellow, red
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="cmo_analyses")


class MarketingDocument(Base):
    """Marketing document model for RAG vector storage."""
    __tablename__ = "marketing_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embeddings are 1536 dimensions
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CMOChatMessage(Base):
    """Chat conversations with AI-CMO."""
    __tablename__ = "cmo_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # Optional list of source document titles
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="cmo_chat_messages")


# COO Models
class COOAnalysis(Base):
    """Stores AI-COO diagnostic analyses."""
    __tablename__ = "coo_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    input_payload = Column(JSON, nullable=False)
    analysis_json = Column(JSON, nullable=False)
    priority_area = Column(String(100), nullable=False)
    risk_level = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="coo_analyses")
    chat_messages = relationship("COOChatMessage", back_populates="analysis", cascade="all, delete-orphan")


class OpsDocument(Base):
    """Operational document model for RAG vector storage."""
    __tablename__ = "ops_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class COOChatMessage(Base):
    """Chat conversations with AI-COO."""
    __tablename__ = "coo_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    analysis_id = Column(Integer, ForeignKey("coo_analyses.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    session_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="coo_chat_messages")
    analysis = relationship("COOAnalysis", back_populates="chat_messages")


# CTO Models
class CTOAnalysis(Base):
    """CTO diagnostic analysis model."""
    __tablename__ = "cto_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    input_payload = Column(JSON, nullable=False)
    analysis_json = Column(JSON, nullable=False)
    risk_level = Column(String(50), nullable=False, index=True)  # low, medium, high
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="cto_analyses")


class TechDocument(Base):
    """Technical document for RAG."""
    __tablename__ = "tech_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embedding dimension
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CTOChatMessage(Base):
    """Chat message model for AI-CTO conversations."""
    __tablename__ = "cto_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="cto_chat_messages")


# ----- CLEAR governance (Phase 1) -----

class Enterprise(Base):
    """Minimal enterprise profile for capital governance anchoring (CLEAR + Phase 2)."""
    __tablename__ = "enterprises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    sector = Column(String(100), nullable=True)
    geography = Column(String(100), nullable=True)
    operating_model = Column(String(100), nullable=True)
    size_band = Column(String(50), nullable=True)
    settings_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # Layer 5: activation_mode = "enterprise" | "cohort" for institutional rollout
    activation_mode = Column(String(50), nullable=True, server_default="enterprise")

    decisions = relationship("Decision", back_populates="enterprise")


class EnterpriseUser(Base):
    """Phase 2: optional mapping enterprise <-> user (supports future auth)."""
    __tablename__ = "enterprise_users"
    
    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Decision(Base):
    """Decision head record. State derived from ledger; no mutable authority (current_status/current_artifact_version deprecated)."""
    __tablename__ = "decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), unique=True, nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # Execution layer: owner, expected outcome, outcome review
    responsible_owner = Column(String(255), nullable=True)
    expected_outcome = Column(Text, nullable=True)
    outcome_review_reminder = Column(Boolean, nullable=False, server_default="false")
    outcome_review_notes = Column(Text, nullable=True)
    
    enterprise = relationship("Enterprise", back_populates="decisions")
    artifacts = relationship(
        "DecisionArtifact",
        back_populates="decision",
        foreign_keys="DecisionArtifact.decision_id",
    )
    ledger_events = relationship(
        "DecisionLedgerEvent",
        back_populates="decision",
        foreign_keys="DecisionLedgerEvent.decision_id",
    )
    evidence_links = relationship("DecisionEvidenceLink", back_populates="decision", cascade="all, delete-orphan")
    chat_sessions = relationship("DecisionChatSession", back_populates="decision", cascade="all, delete-orphan")
    execution_milestones = relationship(
        "DecisionExecutionMilestone",
        back_populates="decision",
        cascade="all, delete-orphan",
    )


class DecisionArtifact(Base):
    """Governed artifact versions (insert-only). Ledger events reference version_id."""
    __tablename__ = "decision_artifacts"
    
    artifact_id = Column(PG_UUID(as_uuid=True), primary_key=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)
    version_id = Column(PG_UUID(as_uuid=True), unique=True, nullable=False, index=True)
    supersedes_version_id = Column(PG_UUID(as_uuid=True), ForeignKey("decision_artifacts.version_id", ondelete="SET NULL"), nullable=True)
    canonical_hash = Column(Text, nullable=False)
    canonical_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_actor_id = Column(String(255), nullable=True)
    created_by_actor_role = Column(String(100), nullable=True)
    
    decision = relationship("Decision", back_populates="artifacts", foreign_keys=[decision_id])


class DecisionLedgerEvent(Base):
    """Append-only source of truth. Event types explicit; version_id references decision_artifacts."""
    __tablename__ = "decision_ledger_events"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(PG_UUID(as_uuid=True), unique=True, nullable=False, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    version_id = Column(PG_UUID(as_uuid=True), ForeignKey("decision_artifacts.version_id", ondelete="SET NULL"), nullable=True, index=True)
    reason_code = Column(String(100), nullable=True)
    actor_id = Column(String(255), nullable=True)
    actor_role = Column(String(100), nullable=True)
    changed_fields_summary = Column(JSONB, nullable=True)
    payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # Deprecated (legacy): artifact stored in decision_artifacts; new flow uses version_id only
    artifact_version = Column(Integer, nullable=True)
    artifact_snapshot = Column(JSONB, nullable=True)
    artifact_hash = Column(String(64), nullable=True)
    supersedes_event_id = Column(PG_UUID(as_uuid=True), ForeignKey("decision_ledger_events.event_id", ondelete="SET NULL"), nullable=True)
    
    decision = relationship("Decision", back_populates="ledger_events", foreign_keys=[decision_id])


class DecisionEvidenceLink(Base):
    """First-class evidence with provenance. source_ref (system, table, id, uri) is required."""
    __tablename__ = "decision_evidence_links"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False)  # analysis | rag_snippet | document | metric_snapshot
    source_ref = Column(JSONB, nullable=False)  # { system: "db"|"object_store"|"rag"|"llm", table?, id?, uri? }
    source_table = Column(String(100), nullable=True)  # optional convenience
    source_id = Column(String(255), nullable=True)  # optional convenience
    retrieval_metadata = Column(JSONB, nullable=True)
    integrity_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    decision = relationship("Decision", back_populates="evidence_links")


class DecisionChatSession(Base):
    """Links chat sessions to decisions; when in Decision Workspace, chat is auto-tagged."""
    __tablename__ = "decision_chat_sessions"
    
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), primary_key=True)
    session_id = Column(String(255), primary_key=True)
    agent_domain = Column(String(20), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    decision = relationship("Decision", back_populates="chat_sessions")


class DecisionExecutionMilestone(Base):
    """Execution milestone per decision: name, owner, due date, status (pending/completed), notes."""
    __tablename__ = "decision_execution_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_name = Column(String(500), nullable=False)
    responsible_person = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, server_default="pending")  # pending | completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    decision = relationship("Decision", back_populates="execution_milestones")


class DecisionRecord(Base):
    """RTCO Phase 1: append-only decision memory from agent analyses. One row per decision version."""
    __tablename__ = "decision_records"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    agent_domain = Column(String(20), nullable=False)
    analysis_table = Column(String(100), nullable=False)
    analysis_id = Column(Integer, nullable=False)
    artifact_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    supersedes_id = Column(Integer, ForeignKey("decision_records.id", ondelete="SET NULL"), nullable=True)
    # Phase 1B: canonicalization and hash (set at write time)
    canonicalization_version = Column(String(20), nullable=True)
    artifact_hash = Column(String(64), nullable=True)
    artifact_canonical_json = Column(Text, nullable=True)


class RtcoDecisionLedgerEvent(Base):
    """Phase 1B: append-only ledger events for RTCO decisions. Finalize = DECISION_FINALIZED event."""
    __tablename__ = "rtco_decision_ledger_events"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    event_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RtcoDecisionEvidenceLink(Base):
    """Phase 1B: append-only evidence links for RTCO decisions (analysis, tool_calc, rag_doc, chat)."""
    __tablename__ = "rtco_decision_evidence_links"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)
    source_ref = Column(String(500), nullable=False)
    meta_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DiagnosticRun(Base):
    """Multi-agent diagnostic run: onboarding + diagnostic_data -> agent_outputs -> synthesis -> decision."""
    __tablename__ = "diagnostic_runs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    onboarding_context = Column(JSONB, nullable=True)
    diagnostic_data = Column(JSONB, nullable=False)
    agent_outputs = Column(JSONB, nullable=True)  # { "cfo": {...}, "cmo": {...}, ... }
    synthesis = Column(JSONB, nullable=True)  # primary_domain, emerging_decision, decision_snapshot, etc.
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)


class HumanReviewRequest(Base):
    """Lead capture when user requests human review for a decision."""
    __tablename__ = "human_review_requests"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    whatsapp = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    company = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    consent = Column(Boolean, nullable=False, server_default="true")
    status = Column(String(50), nullable=False, server_default="pending")  # pending | contacted | closed


class OutcomeReview(Base):
    """Learning capture per decision: what worked, what didn't, readiness impact. Execution v2: main_constraint, keep_raise_reduce_stop."""
    __tablename__ = "outcome_reviews"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    what_worked = Column(Text, nullable=True)
    what_did_not_work = Column(Text, nullable=True)
    key_learnings = Column(Text, nullable=True)
    assumptions_validated = Column(Text, nullable=True)
    assumptions_broken = Column(Text, nullable=True)
    readiness_impact = Column(String(20), nullable=True)  # minus_one | zero | plus_one
    main_constraint = Column(Text, nullable=True)
    keep_raise_reduce_stop = Column(String(20), nullable=True)  # keep | raise | reduce | stop


class DecisionVelocitySnapshot(Base):
    """Monthly (or periodic) snapshot of decision velocity for trend and portfolio signals."""
    __tablename__ = "decision_velocity_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True, index=True)
    avg_cycle_days = Column(Numeric(10, 2), nullable=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    avg_time_to_decision = Column(Numeric(10, 2), nullable=True)
    avg_time_to_execution = Column(Numeric(10, 2), nullable=True)
    avg_time_to_review = Column(Numeric(10, 2), nullable=True)
    velocity_band = Column(String(20), nullable=True)  # fast | healthy | slow | at_risk
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class IdeaStageLead(Base):
    """Lightweight signup when user selects idea/validation stage in diagnostic (no decision created)."""
    __tablename__ = "idea_stage_leads"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    email = Column(String(255), nullable=True)
    short_text = Column(Text, nullable=True)


class KnowledgeChunk(Base):
    """Curated knowledge for RAG: frameworks, case studies, articles. No autonomous ingestion."""
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_type = Column(String(50), nullable=False)  # framework | case_study | article
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSONB, nullable=True)  # e.g. ["finance", "ops", "Malaysia", "COSO"]
    embedding = Column(Vector(1536), nullable=True)


class DecisionContext(Base):
    """Phase 2: context payload captured at decision initiation."""
    __tablename__ = "decision_context"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)
    context_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ImplementationTask(Base):
    """Phase 2: execution tasks linked to a decision."""
    __tablename__ = "implementation_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)
    action_plan_ref = Column(String(255), nullable=True)
    title = Column(String(500), nullable=False)
    owner = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, server_default="planned")
    meta_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    milestones = relationship("Milestone", back_populates="task", cascade="all, delete-orphan")


class Milestone(Base):
    """Phase 2: milestone/evidence on a task."""
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("implementation_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_type = Column(String(50), nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    evidence_text = Column(Text, nullable=True)
    evidence_url = Column(String(1000), nullable=True)
    metrics_json = Column(JSONB, nullable=True)
    
    task = relationship("ImplementationTask", back_populates="milestones")


class Outcome(Base):
    """Phase 2: outcomes linked to a decision (revenue, margin, CAC, etc.)."""
    __tablename__ = "outcomes"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)
    outcome_type = Column(String(100), nullable=False)
    measured_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metrics_json = Column(JSONB, nullable=False)
    notes = Column(Text, nullable=True)


class DocumentLink(Base):
    """Phase 2: traceability of RAG docs to enterprise/decision."""
    __tablename__ = "document_links"

    id = Column(Integer, primary_key=True, index=True)
    doc_table = Column(String(100), nullable=False)
    doc_id = Column(Integer, nullable=False)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ----- Phase 3: Capability intelligence -----

class Capability(Base):
    """Phase 3: capability definition (code, domain, name, description)."""
    __tablename__ = "capabilities"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(80), unique=True, nullable=False, index=True)
    domain = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)


class CapabilityScore(Base):
    """Phase 3: capability score per enterprise/decision."""
    __tablename__ = "capability_scores"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    capability_id = Column(Integer, ForeignKey("capabilities.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Numeric(10, 4), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=True)
    evidence_json = Column(JSONB, nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class FinancingReadiness(Base):
    """Phase 3: financing readiness per enterprise/decision."""
    __tablename__ = "financing_readiness"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    readiness_score = Column(Numeric(10, 4), nullable=False)
    flags_json = Column(JSONB, nullable=True)
    rationale_json = Column(JSONB, nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ----- Phase 4: Institutional interface -----

class Institution(Base):
    """Phase 4: institution (lender, fund, etc.)."""
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(80), nullable=True, index=True)
    settings_json = Column(JSONB, nullable=True)


class Portfolio(Base):
    """Phase 4: portfolio belonging to an institution."""
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PortfolioEnterprise(Base):
    """Phase 4: enterprise membership in a portfolio."""
    __tablename__ = "portfolio_enterprises"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Cohort(Base):
    """Institutional rollout: a program grouping multiple enterprises (accelerator, bank, agency)."""
    __tablename__ = "cohorts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    partner_org_id = Column(Integer, nullable=True, index=True)  # optional FK to institution or future partner_org
    start_date = Column(Date, nullable=True)
    activation_window_days = Column(Integer, nullable=False, server_default="14")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    enterprises = relationship("CohortEnterprise", back_populates="cohort", cascade="all, delete-orphan")


class CohortEnterprise(Base):
    """Enterprise enrolled in a cohort; stores activation progress for cohort dashboard."""
    __tablename__ = "cohort_enterprises"
    __table_args__ = (UniqueConstraint("cohort_id", "enterprise_id", name="uq_cohort_enterprise"),)

    id = Column(Integer, primary_key=True, index=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    activation_progress = Column(JSONB, nullable=True)  # { completed_steps: [], completed_count: 0, ... }
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    cohort = relationship("Cohort", back_populates="enterprises")
    enterprise = relationship("Enterprise", backref="cohort_memberships")


class EnterpriseHealthSnapshot(Base):
    """Monthly snapshot of enterprise health score for trend and portfolio display."""
    __tablename__ = "enterprise_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=True)  # 0-100 total
    execution_score = Column(Integer, nullable=True)
    governance_score = Column(Integer, nullable=True)
    learning_score = Column(Integer, nullable=True)
    snapshot_date = Column(Date, nullable=False, index=True)  # first day of month
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EnterpriseReadinessSnapshot(Base):
    """Execution Capital Readiness Index (ECRI) snapshots for trend and history."""
    __tablename__ = "enterprise_readiness_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    readiness_index = Column(Integer, nullable=False)  # 0-100
    snapshot_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    activation_component = Column(Numeric(5, 2), nullable=True)
    health_component = Column(Numeric(5, 2), nullable=True)
    velocity_component = Column(Numeric(5, 2), nullable=True)
    governance_component = Column(Numeric(5, 2), nullable=True)
    readiness_band = Column(String(50), nullable=True)


# ----- CLEAR v0: usage, feedback, comments, members -----

class UsageEvent(Base):
    """Minimal usage telemetry (no PII beyond enterprise/decision IDs)."""
    __tablename__ = "usage_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    event_metadata = Column("metadata", JSONB, nullable=True)  # Python name avoids SQLAlchemy reserved 'metadata'


class ImpactFeedback(Base):
    """In-product feedback: framing help, cycle impact (1-5 + optional comment)."""
    __tablename__ = "impact_feedback"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    cycle_number = Column(Integer, nullable=True)
    question = Column(String(120), nullable=False)
    score = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DecisionComment(Base):
    """Comments on a decision (advisor/founder); for EMR discussion."""
    __tablename__ = "decision_comments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    author_email = Column(String(255), nullable=False)
    author_role = Column(String(50), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EnterpriseMember(Base):
    """Workspace member by email (founder, advisor, capital_partner). Magic link via invite_token."""
    __tablename__ = "enterprise_members"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    invite_token = Column(String(255), nullable=True, index=True)
    invite_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ActivationReminderSent(Base):
    """Track activation nudge emails sent per enterprise per day to avoid duplicates."""
    __tablename__ = "activation_reminder_sent"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    nudge_day = Column(Integer, nullable=False)  # 2, 4, 7, 10, or 12
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdvisorReviewRequest(Base):
    """Request for an advisor to review a specific decision. Created when founder invites advisor from decision workspace."""
    __tablename__ = "advisor_review_requests"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    advisor_email = Column(String(255), nullable=False, index=True)
    advisor_name = Column(String(255), nullable=True)
    role_label = Column(String(100), nullable=True)  # e.g. CFO, board member
    requested_by = Column(String(255), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, server_default="pending")  # pending | completed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdvisorReview(Base):
    """Structured review from an advisor: headline, what's strong, worries, next 4–6 weeks, confidence."""
    __tablename__ = "advisor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True)
    advisor_email = Column(String(255), nullable=False, index=True)
    headline_assessment = Column(String(500), nullable=True)
    what_looks_strong = Column(Text, nullable=True)
    what_worries_most = Column(Text, nullable=True)
    next_4_6_weeks = Column(Text, nullable=True)
    confidence = Column(String(20), nullable=True)  # low | medium | high
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PartnerInquiry(Base):
    """Capital partner intake from /for-partners."""
    __tablename__ = "partner_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    organization_name = Column(String(500), nullable=False)
    organization_type = Column(String(100), nullable=True)
    portfolio_size = Column(String(100), nullable=True)
    primary_use_case = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=False, index=True)
    notes = Column(Text, nullable=True)


class GuidedStartRequest(Base):
    """Guided onboarding intake from /guided-start."""
    __tablename__ = "guided_start_requests"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    organization = Column(String(500), nullable=True)
    team_size = Column(String(100), nullable=True)
    primary_challenge = Column(String(500), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    preferred_onboarding_type = Column(String(255), nullable=True)


class ContactInquiry(Base):
    """Contact / book-call form submissions."""
    __tablename__ = "contact_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(100), nullable=True)
    company = Column(String(255), nullable=True)
    reason = Column(String(255), nullable=True)
    preferred_date = Column(String(50), nullable=True)
    preferred_time = Column(String(50), nullable=True)
    message = Column(Text, nullable=True)


# ----- Launch instrumentation: telemetry events and errors -----

class TelemetryEvent(Base):
    """Analytics/conversion events (marketing, diagnostic, decision, milestone, review, inquiry)."""
    __tablename__ = "telemetry_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_name = Column(String(120), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    properties = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TelemetryError(Base):
    """Frontend/backend errors for monitoring (no external tool required at launch)."""
    __tablename__ = "telemetry_errors"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    source = Column(String(20), nullable=False, index=True)  # frontend | backend
    message = Column(Text, nullable=True)
    stack = Column(Text, nullable=True)
    path = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

