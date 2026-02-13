"""Ledger event types (explicit) and decision state derived from ledger (CLEAR_CONTRACTS B)."""
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DecisionStatus(str, Enum):
    """Decision status labels (draft → finalized → signed → in_progress → implemented → outcome_tracked → archived)."""
    DRAFT = "draft"
    FINALIZED = "finalized"
    SIGNED = "signed"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    OUTCOME_TRACKED = "outcome_tracked"
    ARCHIVED = "archived"


class LedgerEventType(str, Enum):
    """Explicit event types. Lifecycle derived from ledger; no status_transition."""
    # Phase 1
    DECISION_INITIATED = "DECISION_INITIATED"
    EVIDENCE_LINKED = "EVIDENCE_LINKED"
    ARTIFACT_DRAFT_CREATED = "ARTIFACT_DRAFT_CREATED"
    ARTIFACT_DRAFT_UPDATED = "ARTIFACT_DRAFT_UPDATED"
    VALIDATION_RUN = "VALIDATION_RUN"
    FINALIZATION_ACKNOWLEDGED = "FINALIZATION_ACKNOWLEDGED"
    ARTIFACT_FINALIZED = "ARTIFACT_FINALIZED"
    DECISION_SUPERSEDED = "DECISION_SUPERSEDED"
    # Phase 2 execution/outcomes (event-sourced)
    TASK_CREATED = "TASK_CREATED"
    TASK_UPDATED = "TASK_UPDATED"
    MILESTONE_LOGGED = "MILESTONE_LOGGED"
    OUTCOME_RECORDED = "OUTCOME_RECORDED"
    # Reserved (future)
    IMPLEMENTATION_STARTED = "IMPLEMENTATION_STARTED"
    IMPLEMENTATION_COMPLETED = "IMPLEMENTATION_COMPLETED"
    OUTCOME_CAPTURED = "OUTCOME_CAPTURED"
    DECISION_ARCHIVED = "DECISION_ARCHIVED"


# Derived lifecycle (computed from ledger event sequence)
class DerivedDecisionStatus(str, Enum):
    DRAFT = "draft"
    FINALIZED = "finalized"
    SIGNED = "signed"
    IN_PROGRESS = "in_progress"  # IMPLEMENTATION_STARTED
    IMPLEMENTED = "implemented"  # IMPLEMENTATION_COMPLETED
    OUTCOME_TRACKED = "outcome_tracked"
    ARCHIVED = "archived"


class DecisionListItem(BaseModel):
    """Decision list item (state derived from ledger)."""
    decision_id: UUID
    enterprise_id: Optional[int] = None
    current_status: str
    current_artifact_version: int
    created_at: datetime


class DecisionOut(BaseModel):
    """Decision detail (latest artifact from decision_artifacts; state from ledger)."""
    decision_id: UUID
    enterprise_id: Optional[int] = None
    current_status: str
    current_artifact_version: int
    created_at: datetime
    updated_at: datetime
    latest_artifact: Optional[dict[str, Any]] = None
    latest_artifact_hash: Optional[str] = None
    latest_version_id: Optional[UUID] = None
    # Execution layer
    responsible_owner: Optional[str] = None
    expected_outcome: Optional[str] = None
    outcome_review_reminder: bool = False
    outcome_review_notes: Optional[str] = None


class LedgerEventOut(BaseModel):
    """Read-only ledger event."""
    event_id: UUID
    decision_id: UUID
    event_type: str
    version_id: Optional[UUID] = None
    reason_code: Optional[str] = None
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    changed_fields_summary: Optional[dict[str, Any]] = None
    payload: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FinalizeRequest(BaseModel):
    """Request to finalize (validator must pass; writes ARTIFACT_FINALIZED)."""
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None


class SignOffRequest(BaseModel):
    """Mandatory acknowledgement (writes FINALIZATION_ACKNOWLEDGED then derived state becomes signed)."""
    actor_id: str = Field(..., min_length=1)
    actor_role: Optional[str] = None
    comment: Optional[str] = None


class StatusTransitionRequest(BaseModel):
    """Compatibility: implemented by writing ledger events, not mutating status."""
    to_status: DerivedDecisionStatus
    reason_code: Optional[str] = None
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None


class CreateDecisionRequest(BaseModel):
    """Create decision (optional draft artifact)."""
    enterprise_id: Optional[int] = None
    initial_artifact: Optional[dict] = None
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None


class ExecutionUpdateRequest(BaseModel):
    """Update decision execution metadata (owner, expected outcome, outcome review)."""
    responsible_owner: Optional[str] = None
    expected_outcome: Optional[str] = None
    outcome_review_reminder: Optional[bool] = None
    outcome_review_notes: Optional[str] = None
