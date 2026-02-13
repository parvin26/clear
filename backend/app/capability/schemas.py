"""Phase 3: Capability and financing readiness schemas."""
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CapabilityOut(BaseModel):
    id: int
    code: str
    domain: str
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CapabilityScoreOut(BaseModel):
    id: int
    enterprise_id: int
    decision_id: Optional[UUID] = None
    capability_id: int
    score: Decimal
    confidence: Optional[Decimal] = None
    evidence_json: Optional[dict[str, Any]] = None
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinancingReadinessOut(BaseModel):
    id: int
    enterprise_id: int
    decision_id: Optional[UUID] = None
    readiness_score: Decimal
    flags_json: Optional[list[str]] = None
    rationale_json: Optional[dict[str, Any]] = None
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)
