"""Evidence link schema (CLEAR_CONTRACTS C)."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class EvidenceTypeEnum:
    ANALYSIS = "analysis"
    RAG_SNIPPET = "rag_snippet"
    DOCUMENT = "document"
    METRIC_SNAPSHOT = "metric_snapshot"


class SourceRefSchema(BaseModel):
    """Unified source reference: system (db|object_store|rag|llm), table?, id?, uri?"""
    system: str = Field(..., pattern="^(db|object_store|rag|llm)$")
    table: Optional[str] = None
    id: Optional[str] = None
    uri: Optional[str] = None


class EvidenceLinkCreate(BaseModel):
    """Create evidence link. source_ref is required."""
    decision_id: UUID
    evidence_type: str = Field(..., pattern="^(analysis|rag_snippet|document|metric_snapshot)$")
    source_ref: dict = Field(..., description='{"system":"db|object_store|rag|llm","table":null,"id":null,"uri":null}')
    source_table: Optional[str] = None
    source_id: Optional[str] = None
    retrieval_metadata: Optional[dict[str, Any]] = None
    integrity_hash: Optional[str] = None


class EvidenceLinkOut(BaseModel):
    """Evidence link response."""
    id: int
    decision_id: UUID
    evidence_type: str
    source_ref: dict
    source_table: Optional[str] = None
    source_id: Optional[str] = None
    retrieval_metadata: Optional[dict[str, Any]] = None
    integrity_hash: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
