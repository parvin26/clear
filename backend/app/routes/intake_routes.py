"""Intake endpoints: investor profile (no diagnostic run)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import InvestorProfileSubmission as InvestorProfileSubmissionModel

router = APIRouter(prefix="/api/intake", tags=["Intake"])


class InvestorProfileIn(BaseModel):
    """Payload from conversational intake when role = impact_investor."""
    regions: list[str] | None = None  # e.g. Africa, Asia, MENA, Latin America, Europe, North America, Global
    sectors: list[str] = []
    geographies: list[str] = []
    themes: list[str] = []  # ImpactCategoryId[] for aggregation; derived from sdg_themes when present
    sdg_themes: list[str] | None = None  # SDG 1-17 ids (sdg_1 .. sdg_17)
    portfolio_stage: str = ""
    primary_needs: list[str] = []
    other_sector_notes: str | None = None  # when sectors includes "other"


class InvestorProfileSubmissionIn(BaseModel):
    """Full submission: optional onboarding context + investor profile."""
    onboarding_context: Optional[dict[str, Any]] = None
    investor_profile: InvestorProfileIn


@router.post("/investor-profile")
def post_investor_profile(
    payload: InvestorProfileSubmissionIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Store impact investor / capital partner profile from intake.
    No decision is created; used for early-access and portfolio dashboards later.
    """
    profile_json = payload.investor_profile.model_dump()
    ctx_json = payload.onboarding_context
    row = InvestorProfileSubmissionModel(
        onboarding_context=ctx_json,
        investor_profile=profile_json,
    )
    db.add(row)
    db.commit()
    return {"ok": True, "message": "Profile received."}
