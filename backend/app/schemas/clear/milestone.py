"""Execution milestone schemas for decision workspace."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class MilestoneCreate(BaseModel):
    """Create an execution milestone."""
    milestone_name: str = Field(..., min_length=1, max_length=500)
    responsible_person: Optional[str] = Field(None, max_length=255)
    due_date: Optional[date] = None
    status: str = Field(default="pending", pattern="^(pending|completed)$")
    notes: Optional[str] = None


class MilestoneUpdate(BaseModel):
    """Update milestone (partial)."""
    milestone_name: Optional[str] = Field(None, min_length=1, max_length=500)
    responsible_person: Optional[str] = Field(None, max_length=255)
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    notes: Optional[str] = None


class MilestoneOut(BaseModel):
    """Milestone response."""
    id: int
    decision_id: UUID
    milestone_name: str
    responsible_person: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
