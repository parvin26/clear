"""Execution milestone schemas for decision workspace."""
from datetime import date, datetime
from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class MilestoneCreate(BaseModel):
    """Create an execution milestone."""
    milestone_name: str = Field(..., min_length=1, max_length=500)
    responsible_person: Optional[str] = Field(None, max_length=255)
    due_date: Optional[date] = None
    status: str = Field(default="pending", pattern="^(pending|completed)$")
    notes: Optional[str] = None
    linked_org_indicator_ids: Optional[List[int]] = None
    impact_expected_output_note: Optional[str] = None


class MilestoneUpdate(BaseModel):
    """Update milestone (partial)."""
    milestone_name: Optional[str] = Field(None, min_length=1, max_length=500)
    responsible_person: Optional[str] = Field(None, max_length=255)
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    notes: Optional[str] = None
    linked_org_indicator_ids: Optional[List[int]] = None
    impact_expected_output_note: Optional[str] = None


class MilestoneOut(BaseModel):
    """Milestone response."""
    id: int
    decision_id: UUID
    milestone_name: str
    responsible_person: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    notes: Optional[str] = None
    linked_org_indicator_ids: Optional[List[int]] = None
    impact_expected_output_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def milestone_orm_to_out(m: Any) -> MilestoneOut:
    """
    Build MilestoneOut from DecisionExecutionMilestone ORM.
    Coerces linked_org_indicator_ids JSONB so malformed DB values cannot break response validation (500).
    """
    raw = getattr(m, "linked_org_indicator_ids", None)
    linked: list[int] = []
    if isinstance(raw, list):
        for x in raw:
            try:
                linked.append(int(x))
            except (TypeError, ValueError):
                continue
    elif raw is not None and not isinstance(raw, list):
        # Legacy or bad JSON: avoid Pydantic validation error on response
        linked = []

    st = getattr(m, "status", None) or "pending"
    if not isinstance(st, str):
        st = "pending"

    return MilestoneOut(
        id=m.id,
        decision_id=m.decision_id,
        milestone_name=m.milestone_name or "",
        responsible_person=m.responsible_person,
        due_date=m.due_date,
        status=st,
        notes=m.notes,
        linked_org_indicator_ids=linked,
        impact_expected_output_note=m.impact_expected_output_note,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )
