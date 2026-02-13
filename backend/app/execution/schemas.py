"""Phase 2: Task + milestone schemas."""
from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    """Create implementation task."""
    action_plan_ref: Optional[str] = None
    title: str
    owner: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "planned"
    meta_json: Optional[dict[str, Any]] = None


class TaskUpdate(BaseModel):
    """Update task (partial)."""
    title: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    meta_json: Optional[dict[str, Any]] = None


class TaskOut(BaseModel):
    """Task response."""
    id: int
    decision_id: str
    enterprise_id: Optional[int] = None
    action_plan_ref: Optional[str] = None
    title: str
    owner: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    meta_json: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MilestoneCreate(BaseModel):
    """Add milestone to task."""
    milestone_type: str
    evidence_text: Optional[str] = None
    evidence_url: Optional[str] = None
    metrics_json: Optional[dict[str, Any]] = None


class MilestoneOut(BaseModel):
    """Milestone response."""
    id: int
    task_id: int
    milestone_type: str
    logged_at: datetime
    evidence_text: Optional[str] = None
    evidence_url: Optional[str] = None
    metrics_json: Optional[dict[str, Any]] = None

    class Config:
        from_attributes = True
