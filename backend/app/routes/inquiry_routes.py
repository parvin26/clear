"""Partner, guided-start, and contact inquiry endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import PartnerInquiry, GuidedStartRequest, ContactInquiry

router = APIRouter(prefix="/api/inquiries", tags=["Inquiries"])


# --- Partner inquiry ---
class PartnerInquiryIn(BaseModel):
    organization_name: str
    organization_type: Optional[str] = None
    portfolio_size: Optional[str] = None
    primary_use_case: Optional[str] = None
    contact_email: str
    notes: Optional[str] = None


class PartnerInquiryOut(BaseModel):
    ok: bool = True
    id: int

    class Config:
        from_attributes = True


@router.post("/partner", response_model=PartnerInquiryOut)
def post_partner_inquiry(payload: PartnerInquiryIn, db: Session = Depends(get_db)):
    """Submit capital partner intake from /for-partners."""
    row = PartnerInquiry(
        organization_name=payload.organization_name,
        organization_type=payload.organization_type,
        portfolio_size=payload.portfolio_size,
        primary_use_case=payload.primary_use_case,
        contact_email=payload.contact_email,
        notes=payload.notes,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PartnerInquiryOut(ok=True, id=row.id)


# --- Guided start request ---
class GuidedStartRequestIn(BaseModel):
    organization: Optional[str] = None
    team_size: Optional[str] = None
    primary_challenge: Optional[str] = None
    email: str
    preferred_onboarding_type: Optional[str] = None


class GuidedStartRequestOut(BaseModel):
    ok: bool = True
    id: int

    class Config:
        from_attributes = True


@router.post("/guided-start", response_model=GuidedStartRequestOut)
def post_guided_start_request(payload: GuidedStartRequestIn, db: Session = Depends(get_db)):
    """Submit guided onboarding intake from /guided-start."""
    row = GuidedStartRequest(
        organization=payload.organization,
        team_size=payload.team_size,
        primary_challenge=payload.primary_challenge,
        email=payload.email,
        preferred_onboarding_type=payload.preferred_onboarding_type,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return GuidedStartRequestOut(ok=True, id=row.id)


# --- Contact / book-call ---
class ContactInquiryIn(BaseModel):
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    reason: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None


class ContactInquiryOut(BaseModel):
    ok: bool = True
    id: int

    class Config:
        from_attributes = True


@router.post("/contact", response_model=ContactInquiryOut)
def post_contact_inquiry(payload: ContactInquiryIn, db: Session = Depends(get_db)):
    """Submit contact / book-call form."""
    row = ContactInquiry(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        reason=payload.reason,
        preferred_date=payload.preferred_date,
        preferred_time=payload.preferred_time,
        message=payload.message,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ContactInquiryOut(ok=True, id=row.id)
