"""Phase 4: Institutional schemas."""
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InstitutionOut(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    settings_json: Optional[dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class PortfolioOut(BaseModel):
    id: int
    institution_id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortfolioEnterpriseOut(BaseModel):
    id: int
    portfolio_id: int
    enterprise_id: int
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnterpriseSnapshotOut(BaseModel):
    """Enterprise snapshot: decisions by domain, execution summary, outcomes, capability trend, financing readiness."""
    enterprise_id: int
    enterprise_name: Optional[str] = None
    decisions_by_domain: dict[str, list[dict[str, Any]]]
    execution_summary: dict[str, Any]
    outcomes_summary: list[dict[str, Any]]
    capability_trend: list[dict[str, Any]]
    financing_readiness_latest: Optional[dict[str, Any]] = None


class CohortCreate(BaseModel):
    """Body for creating a cohort."""
    name: str
    partner_org_id: Optional[int] = None
    start_date: Optional[date] = None
    activation_window_days: int = 14


class CohortOut(BaseModel):
    """Cohort response."""
    id: int
    name: str
    partner_org_id: Optional[int] = None
    start_date: Optional[date] = None
    activation_window_days: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CohortEnterpriseAdd(BaseModel):
    """Body for adding enterprise to cohort (optional activation_progress)."""
    enterprise_id: int
    activation_progress: Optional[dict[str, Any]] = None
