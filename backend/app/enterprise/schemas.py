"""Phase 2: Enterprise + decision context schemas."""
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class EnterpriseCreate(BaseModel):
    """Create enterprise (Phase 2)."""
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None
    settings_json: Optional[dict[str, Any]] = None


class EnterpriseUpdate(BaseModel):
    """Update enterprise (partial)."""
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None
    settings_json: Optional[dict[str, Any]] = None


class EnterpriseOut(BaseModel):
    """Enterprise response."""
    id: int
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None
    settings_json: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnterpriseListItem(BaseModel):
    """Enterprise list item."""
    id: int
    name: Optional[str] = None
    sector: Optional[str] = None
    size_band: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DecisionContextCreate(BaseModel):
    """Store context at decision initiation."""
    context_json: dict[str, Any]
    enterprise_id: Optional[int] = None


class DecisionContextOut(BaseModel):
    """Decision context response."""
    id: int
    decision_id: str
    enterprise_id: Optional[int] = None
    context_json: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
