"""
Unified SQLAlchemy database models for Exec-Connect.
Combines models from all four AI agents (CFO, CMO, COO, CTO).
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

