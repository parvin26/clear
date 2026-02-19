"""Phase 3: Impact profile and indicators. Phase 4: Report PDF and email."""
from typing import Any, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    DiagnosticRun,
    ImpactProfile,
    OrgImpactIndicator,
    IndicatorMeasurement,
    DecisionExecutionMilestone,
    ImpactProduct,
)
from app.impact.report_pdf import build_impact_report_pdf, INDICATOR_NAMES

router = APIRouter(prefix="/api/clear/impact", tags=["Impact"])


# ----- Schemas -----


class ImpactProfileSeedOut(BaseModel):
    """Impact profile seed from diagnostic run (for setup wizard pre-fill)."""
    categories: list[str] = []
    metric_focus_areas: list[str] = []
    tracking_existing: bool = False
    tracking_notes: Optional[str] = None
    seeking_impact_capital: bool = False


class IndicatorItemOut(BaseModel):
    id: int
    indicator_template_id: str
    target_value: Optional[float] = None
    target_year: Optional[int] = None
    latest_value: Optional[float] = None
    latest_period: Optional[str] = None


class ImpactProfileOut(BaseModel):
    decision_id: str
    impact_categories: list[str]
    primary_sdg_tags: list[str]
    theory_of_change: Optional[dict[str, Any]] = None
    indicators: list[IndicatorItemOut] = []


class IndicatorInput(BaseModel):
    indicator_template_id: str
    target_value: Optional[float] = None
    target_year: Optional[int] = None


class ImpactProfileUpdateIn(BaseModel):
    decision_id: str
    impact_categories: list[str] = []
    primary_sdg_tags: list[str] = []
    theory_of_change: Optional[dict[str, Any]] = None
    indicators: list[IndicatorInput] = []


class MeasurementIn(BaseModel):
    org_impact_indicator_id: int
    period_start: str
    period_end: str
    value: float
    data_source: str = "self_reported"
    notes: Optional[str] = None


# ----- Endpoints -----


@router.get("/seed", response_model=ImpactProfileSeedOut)
def get_impact_seed(
    decision_id: UUID = Query(..., description="Decision ID from social enterprise diagnostic run"),
    db: Session = Depends(get_db),
) -> ImpactProfileSeedOut:
    """Return impact_profile seed from the diagnostic run that created this decision."""
    run = (
        db.query(DiagnosticRun)
        .filter(DiagnosticRun.decision_id == decision_id)
        .order_by(DiagnosticRun.created_at.desc())
        .first()
    )
    if not run or not run.diagnostic_data:
        raise HTTPException(status_code=404, detail="No diagnostic run found for this decision.")
    impact = run.diagnostic_data.get("impact_profile")
    if not impact:
        raise HTTPException(
            status_code=404,
            detail="This decision was not from a social enterprise run (no impact_profile).",
        )
    return ImpactProfileSeedOut(
        categories=impact.get("categories") or [],
        metric_focus_areas=impact.get("metric_focus_areas") or [],
        tracking_existing=bool(impact.get("tracking_existing")),
        tracking_notes=impact.get("tracking_notes"),
        seeking_impact_capital=bool(impact.get("seeking_impact_capital")),
    )


@router.get("/profile", response_model=ImpactProfileOut)
def get_impact_profile(
    decision_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> ImpactProfileOut:
    """Return full impact profile and indicators for a decision."""
    profile = (
        db.query(ImpactProfile)
        .filter(ImpactProfile.decision_id == decision_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No impact profile found. Complete setup first.")

    categories = profile.impact_categories if isinstance(profile.impact_categories, list) else []
    sdg = profile.primary_sdg_tags if isinstance(profile.primary_sdg_tags, list) else []

    indicators_out: list[IndicatorItemOut] = []
    for oii in profile.org_impact_indicators or []:
        latest = (
            db.query(IndicatorMeasurement)
            .filter(IndicatorMeasurement.org_impact_indicator_id == oii.id)
            .order_by(IndicatorMeasurement.period_end.desc())
            .first()
        )
        indicators_out.append(
            IndicatorItemOut(
                id=oii.id,
                indicator_template_id=oii.indicator_template_id,
                target_value=float(oii.target_value) if oii.target_value is not None else None,
                target_year=oii.target_year,
                latest_value=float(latest.value) if latest else None,
                latest_period=f"{latest.period_start}–{latest.period_end}" if latest else None,
            )
        )

    return ImpactProfileOut(
        decision_id=str(profile.decision_id),
        impact_categories=categories,
        primary_sdg_tags=sdg,
        theory_of_change=profile.theory_of_change,
        indicators=indicators_out,
    )


@router.put("/profile", response_model=ImpactProfileOut)
def put_impact_profile(
    payload: ImpactProfileUpdateIn,
    db: Session = Depends(get_db),
) -> ImpactProfileOut:
    """Create or update impact profile and selected indicators (from setup wizard)."""
    try:
        decision_uuid = UUID(payload.decision_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid decision_id.")

    profile = (
        db.query(ImpactProfile)
        .filter(ImpactProfile.decision_id == decision_uuid)
        .first()
    )
    if not profile:
        profile = ImpactProfile(
            decision_id=decision_uuid,
            impact_categories=payload.impact_categories,
            primary_sdg_tags=payload.primary_sdg_tags,
            theory_of_change=payload.theory_of_change,
        )
        db.add(profile)
        db.flush()
    else:
        profile.impact_categories = payload.impact_categories
        profile.primary_sdg_tags = payload.primary_sdg_tags
        profile.theory_of_change = payload.theory_of_change

    # Sync org_impact_indicators with payload (by indicator_template_id)
    for ind in payload.indicators:
        existing = next(
            (o for o in (profile.org_impact_indicators or []) if o.indicator_template_id == ind.indicator_template_id),
            None,
        )
        if existing:
            existing.target_value = ind.target_value
            existing.target_year = ind.target_year
        else:
            oii = OrgImpactIndicator(
                impact_profile_id=profile.id,
                indicator_template_id=ind.indicator_template_id,
                target_value=ind.target_value,
                target_year=ind.target_year,
            )
            db.add(oii)
    db.flush()
    to_keep = {ind.indicator_template_id for ind in payload.indicators}
    for oii in list(profile.org_impact_indicators or []):
        if oii.indicator_template_id not in to_keep:
            db.delete(oii)
    db.commit()
    db.refresh(profile)
    return get_impact_profile(decision_id=decision_uuid, db=db)


@router.post("/measurement")
def post_measurement(
    payload: MeasurementIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Record a measurement for an org impact indicator."""
    oii = db.query(OrgImpactIndicator).filter(OrgImpactIndicator.id == payload.org_impact_indicator_id).first()
    if not oii:
        raise HTTPException(status_code=404, detail="Org impact indicator not found.")
    m = IndicatorMeasurement(
        org_impact_indicator_id=payload.org_impact_indicator_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        value=payload.value,
        data_source=payload.data_source,
        notes=payload.notes,
    )
    db.add(m)
    db.commit()
    return {"ok": True, "id": m.id}


# ----- Report PDF and email (Phase 4) -----


class ReportRequest(BaseModel):
    """Request body for POST /api/clear/impact/report."""
    decision_id: str
    period: str = "year_to_date"  # for now only year_to_date


class ReportEmailRequest(BaseModel):
    """Request body for POST /api/clear/impact/report/email."""
    decision_id: str
    recipient_email: str


def _gather_report_data(decision_uuid: UUID, db: Session) -> tuple[dict, list[dict], Optional[float], list[str]]:
    """Return (onboarding_context dict, indicators for PDF, total_beneficiaries, primary_sdg_tags)."""
    run = (
        db.query(DiagnosticRun)
        .filter(DiagnosticRun.decision_id == decision_uuid)
        .order_by(DiagnosticRun.created_at.desc())
        .first()
    )
    ctx = (run.onboarding_context or {}) if run else {}
    profile = (
        db.query(ImpactProfile)
        .filter(ImpactProfile.decision_id == decision_uuid)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No impact profile found. Complete setup first.")
    sdg = profile.primary_sdg_tags if isinstance(profile.primary_sdg_tags, list) else []
    indicators_for_pdf: list[dict[str, Any]] = []
    total_beneficiaries: Optional[float] = None
    for oii in profile.org_impact_indicators or []:
        latest = (
            db.query(IndicatorMeasurement)
            .filter(IndicatorMeasurement.org_impact_indicator_id == oii.id)
            .order_by(IndicatorMeasurement.period_end.desc())
            .first()
        )
        name, unit = INDICATOR_NAMES.get(oii.indicator_template_id, (oii.indicator_template_id, ""))
        target = float(oii.target_value) if oii.target_value is not None else None
        latest_val = float(latest.value) if latest else None
        pct = (100 * latest_val / target) if (target and target > 0 and latest_val is not None) else None
        status = "On track" if pct is not None and pct >= 80 else "At risk" if pct is not None and pct >= 50 else "Off track" if pct is not None else "—"
        indicators_for_pdf.append({
            "name": name,
            "unit": unit,
            "latest_value": latest_val,
            "target_value": target,
            "target_year": oii.target_year,
            "status": status,
        })
        if oii.indicator_template_id == "total_beneficiaries" and latest_val is not None:
            total_beneficiaries = latest_val
    return ctx, indicators_for_pdf, total_beneficiaries, sdg


@router.post("/report")
def post_impact_report(
    body: ReportRequest = Body(...),
    db: Session = Depends(get_db),
) -> Response:
    """Generate impact report PDF for the given decision. Returns application/pdf."""
    try:
        decision_uuid = UUID(body.decision_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid decision_id.")
    ctx, indicators_for_pdf, total_beneficiaries, sdg = _gather_report_data(decision_uuid, db)
    org_name = ctx.get("company_name") or ""
    country = ctx.get("country") or ""
    sector = ctx.get("industry") or ""
    now = datetime.now(timezone.utc)
    period_label = f"Year to date ({now.year})" if body.period == "year_to_date" else "Last 12 months"
    pdf_bytes = build_impact_report_pdf(
        org_name=org_name,
        country=country,
        sector=sector,
        period_label=period_label,
        primary_sdg_tags=sdg,
        indicators=indicators_for_pdf,
        total_beneficiaries=total_beneficiaries,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=clear-impact-report.pdf"},
    )


@router.post("/report/email")
async def post_impact_report_email(
    body: ReportEmailRequest = Body(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Generate impact report PDF and email it to the given recipient."""
    from app.auth.zepto_client import send_email_with_attachment

    try:
        decision_uuid = UUID(body.decision_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid decision_id.")
    ctx, indicators_for_pdf, total_beneficiaries, sdg = _gather_report_data(decision_uuid, db)
    org_name = ctx.get("company_name") or ""
    country = ctx.get("country") or ""
    sector = ctx.get("industry") or ""
    now = datetime.now(timezone.utc)
    period_label = f"Year to date ({now.year})"
    pdf_bytes = build_impact_report_pdf(
        org_name=org_name,
        country=country,
        sector=sector,
        period_label=period_label,
        primary_sdg_tags=sdg,
        indicators=indicators_for_pdf,
        total_beneficiaries=total_beneficiaries,
    )
    sent, err = await send_email_with_attachment(
        to_email=body.recipient_email,
        subject="Your CLEAR Impact Report",
        html_body="<p>Please find your CLEAR impact report attached.</p><p>- CLEAR</p>",
        attachment_bytes=pdf_bytes,
        filename="clear-impact-report.pdf",
    )
    if sent:
        return {"ok": True, "message": "Report sent."}
    return {"ok": False, "message": err or "Failed to send email."}


# ----- Completed milestones reminder (Phase 4) -----


@router.get("/completed-milestones-reminder")
def get_completed_milestones_reminder(
    decision_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return count of completed milestones that have linked impact indicators (for dashboard reminder)."""
    rows = (
        db.query(DecisionExecutionMilestone)
        .filter(
            DecisionExecutionMilestone.decision_id == decision_id,
            DecisionExecutionMilestone.status == "completed",
        )
        .all()
    )
    milestone_ids = [
        m.id for m in rows
        if m.linked_org_indicator_ids and len(m.linked_org_indicator_ids) > 0
    ]
    return {"count": len(milestone_ids), "milestone_ids": milestone_ids}


# ----- Impact products (Phase 4 accounting hooks) -----


class ImpactProductCreate(BaseModel):
    """Create impact product."""
    decision_id: str
    name: str
    sku: Optional[str] = None
    linked_indicator_ids: list[int] = []
    beneficiaries_per_unit: Optional[float] = None


class ImpactProductUpdate(BaseModel):
    """Update impact product (partial)."""
    name: Optional[str] = None
    sku: Optional[str] = None
    linked_indicator_ids: Optional[list[int]] = None
    beneficiaries_per_unit: Optional[float] = None


class ImpactProductOut(BaseModel):
    """Impact product response."""
    id: int
    decision_id: Optional[UUID] = None
    name: str
    sku: Optional[str] = None
    linked_indicator_ids: list
    impact_coefficients: dict

    class Config:
        from_attributes = True


class TransactionPreviewItem(BaseModel):
    """Single transaction for preview."""
    sku: str
    quantity: float = 1
    date: Optional[str] = None
    amount: Optional[float] = None


@router.get("/products", response_model=list[ImpactProductOut])
def list_impact_products(
    decision_id: UUID = Query(...),
    db: Session = Depends(get_db),
):
    """List impact products for a decision."""
    rows = (
        db.query(ImpactProduct)
        .filter(ImpactProduct.decision_id == decision_id)
        .order_by(ImpactProduct.created_at.asc())
        .all()
    )
    return rows


@router.post("/products", response_model=ImpactProductOut)
def create_impact_product(
    body: ImpactProductCreate = Body(...),
    db: Session = Depends(get_db),
):
    """Create an impact product."""
    try:
        did = UUID(body.decision_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid decision_id.")
    coeffs = {}
    if body.beneficiaries_per_unit is not None:
        coeffs["beneficiaries_per_unit"] = body.beneficiaries_per_unit
    product = ImpactProduct(
        decision_id=did,
        name=body.name,
        sku=body.sku,
        linked_indicator_ids=body.linked_indicator_ids,
        impact_coefficients=coeffs,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ImpactProductOut)
def update_impact_product(
    product_id: int,
    body: ImpactProductUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """Update an impact product."""
    product = db.query(ImpactProduct).filter(ImpactProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    payload = body.model_dump(exclude_unset=True)
    if "beneficiaries_per_unit" in payload:
        coeffs = dict(product.impact_coefficients or {})
        coeffs["beneficiaries_per_unit"] = payload.pop("beneficiaries_per_unit")
        payload["impact_coefficients"] = coeffs
    for k, v in payload.items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


@router.post("/transactions-preview")
def post_transactions_preview(
    body: list[TransactionPreviewItem] = Body(...),
    decision_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Preview estimated beneficiaries from sample transactions (no persistence)."""
    products = (
        db.query(ImpactProduct)
        .filter(ImpactProduct.decision_id == decision_id)
        .all()
    )
    by_sku: dict[str, ImpactProduct] = {p.sku: p for p in products if p.sku}
    total_beneficiaries = 0.0
    by_indicator: dict[int, float] = {}
    by_period: dict[str, float] = {}
    for item in body:
        product = by_sku.get(item.sku)
        if not product:
            continue
        coeffs = product.impact_coefficients or {}
        bpu = coeffs.get("beneficiaries_per_unit") or 0
        if bpu <= 0:
            continue
        est = item.quantity * bpu
        total_beneficiaries += est
        period = (item.date or "")[:7] if item.date else "unknown"
        by_period[period] = by_period.get(period, 0) + est
        for iid in product.linked_indicator_ids or []:
            by_indicator[iid] = by_indicator.get(iid, 0) + est
    return {
        "total_estimated_beneficiaries": total_beneficiaries,
        "by_indicator": by_indicator,
        "by_period": by_period,
    }
