"""Minimal enterprise profile schema (CLEAR_CONTRACTS D)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EnterpriseCreate(BaseModel):
    """Create enterprise (minimal)."""
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None


class EnterpriseUpdate(BaseModel):
    """Update enterprise (partial)."""
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None


class EnterpriseOut(BaseModel):
    """Enterprise response."""
    id: int
    name: Optional[str] = None
    sector: Optional[str] = None
    geography: Optional[str] = None
    operating_model: Optional[str] = None
    size_band: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
