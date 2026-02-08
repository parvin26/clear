"""
Unified SQLAlchemy database models for Exec-Connect.
Combines models from all four AI agents (CFO, CMO, COO, CTO) and CLEAR governance.
"""
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class User(Base):
    """User model for storing user information."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
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


# CFO Models
class CFOAnalysis(Base):
    """Stores AI-CFO diagnostic analyses."""
    __tablename__ = "cfo_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
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
    """Minimal enterprise profile for capital governance anchoring."""
    __tablename__ = "enterprises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    sector = Column(String(100), nullable=True)
    geography = Column(String(100), nullable=True)
    operating_model = Column(String(100), nullable=True)
    size_band = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    decisions = relationship("Decision", back_populates="enterprise")


class Decision(Base):
    """Decision head record. State derived from ledger; no mutable authority (current_status/current_artifact_version deprecated)."""
    __tablename__ = "decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(PG_UUID(as_uuid=True), unique=True, nullable=False, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
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

