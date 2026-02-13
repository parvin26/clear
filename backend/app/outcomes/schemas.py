"""Phase 2: Outcome schemas."""
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class OutcomeCreate(BaseModel):
    """Create outcome."""
    outcome_type: str
    metrics_json: dict[str, Any]
    notes: Optional[str] = None


class OutcomeOut(BaseModel):
    """Outcome response."""
    id: int
    decision_id: str
    enterprise_id: Optional[int] = None
    outcome_type: str
    measured_at: datetime
    metrics_json: dict[str, Any]
    notes: Optional[str] = None

    class Config:
        from_attributes = True
