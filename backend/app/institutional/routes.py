"""Phase 4: Institutional APIs (portfolios, enterprise snapshot, exports, cohorts)."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Institution, Portfolio, PortfolioEnterprise, Enterprise, Cohort
from app.institutional.service import (
    list_portfolios,
    list_enterprises_in_portfolio,
    list_enterprises_in_portfolio_with_velocity,
    get_enterprise_snapshot,
)
from app.institutional.cohort_service import (
    create_cohort,
    add_enterprise_to_cohort,
    list_cohort_enterprises,
    cohort_activation_summary,
    list_cohorts,
)
from app.institutional.exports import export_decision, export_enterprise
from app.institutional.schemas import InstitutionOut, PortfolioOut, CohortCreate, CohortOut, CohortEnterpriseAdd

router = APIRouter(prefix="/api/institutional", tags=["Institutional (Phase 4)"])


@router.get("/portfolios", response_model=list)
def get_portfolios(
    institution_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List portfolios, optionally filtered by institution_id."""
    return list_portfolios(db, institution_id=institution_id, skip=skip, limit=limit)


@router.get("/portfolios/{portfolio_id}/enterprises")
def get_portfolio_enterprises(portfolio_id: int, db: Session = Depends(get_db)):
    """List enterprises in a portfolio."""
    port = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return list_enterprises_in_portfolio(db, portfolio_id)


@router.get("/portfolios/{portfolio_id}/enterprises-with-velocity")
def get_portfolio_enterprises_with_velocity(
    portfolio_id: int,
    velocity_band: str | None = Query(None, description="Filter by band: fast, healthy, slow, at_risk"),
    db: Session = Depends(get_db),
):
    """List enterprises in a portfolio with decision velocity; optional filter by velocity_band. Returns portfolio_avg_cycle_days."""
    port = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return list_enterprises_in_portfolio_with_velocity(db, portfolio_id, velocity_band=velocity_band)


@router.get("/enterprises/{enterprise_id}/snapshot")
def get_enterprise_snapshot_route(enterprise_id: int, db: Session = Depends(get_db)):
    """Enterprise snapshot: decisions by domain, execution status, outcomes, capability trend, financing readiness."""
    try:
        return get_enterprise_snapshot(db, enterprise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/decisions/{decision_id}/export")
def export_decision_route(
    decision_id: UUID,
    format: str = Query("json", pattern="^(json|csv|pdf)$"),
    scope: str = Query("full", pattern="^(full|governance|execution|outcomes)$"),
    db: Session = Depends(get_db),
):
    """Export decision: versions chain, artifact JSON, tasks, outcomes, capability, financing readiness."""
    content, media = export_decision(db, decision_id, format=format, scope=scope)
    if format == "json":
        return Response(content=content, media_type=media)
    if format == "csv":
        return Response(content=content, media_type=media, headers={"Content-Disposition": "attachment; filename=decision_export.csv"})
    return Response(content=content, media_type="text/plain")


@router.get("/enterprises/{enterprise_id}/export")
def export_enterprise_route(
    enterprise_id: int,
    format: str = Query("json", pattern="^(json|csv)$"),
    scope: str = Query("full", pattern="^(full|governance|execution|outcomes)$"),
    db: Session = Depends(get_db),
):
    """Export enterprise: snapshot (governance, execution, outcomes, capability, financing)."""
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    content, media = export_enterprise(db, enterprise_id, format=format, scope=scope)
    return Response(content=content, media_type=media)


# Optional: CRUD for institutions and portfolios (minimal)
@router.post("/institutions", response_model=InstitutionOut)
def create_institution(body: dict, db: Session = Depends(get_db)):
    """Create institution (name, type, settings_json)."""
    inst = Institution(name=body.get("name", ""), type=body.get("type"), settings_json=body.get("settings_json"))
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/portfolios", response_model=PortfolioOut)
def create_portfolio(body: dict, db: Session = Depends(get_db)):
    """Create portfolio (institution_id, name)."""
    p = Portfolio(institution_id=body["institution_id"], name=body.get("name", ""))
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.post("/portfolios/{portfolio_id}/enterprises")
def add_enterprise_to_portfolio(portfolio_id: int, enterprise_id: int = Query(...), db: Session = Depends(get_db)):
    """Add enterprise to portfolio."""
    port = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    existing = db.query(PortfolioEnterprise).filter(PortfolioEnterprise.portfolio_id == portfolio_id, PortfolioEnterprise.enterprise_id == enterprise_id).first()
    if existing:
        return {"portfolio_id": portfolio_id, "enterprise_id": enterprise_id, "already_member": True}
    pe = PortfolioEnterprise(portfolio_id=portfolio_id, enterprise_id=enterprise_id)
    db.add(pe)
    db.commit()
    db.refresh(pe)
    return {"portfolio_id": portfolio_id, "enterprise_id": enterprise_id, "id": pe.id}


# ----- Cohorts (institutional rollout) -----

@router.get("/cohorts", response_model=list[CohortOut])
def get_cohorts(
    partner_org_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List cohorts, optionally filtered by partner_org_id."""
    return list_cohorts(db, partner_org_id=partner_org_id, skip=skip, limit=limit)


@router.post("/cohorts", response_model=CohortOut)
def post_cohort(body: CohortCreate, db: Session = Depends(get_db)):
    """Create a new cohort."""
    c = create_cohort(
        db,
        name=body.name,
        partner_org_id=body.partner_org_id,
        start_date=body.start_date,
        activation_window_days=body.activation_window_days,
    )
    return c


@router.get("/cohorts/{cohort_id}")
def get_cohort(cohort_id: int, db: Session = Depends(get_db)):
    """Get a single cohort by id."""
    c = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cohort not found")
    return c


@router.get("/cohorts/{cohort_id}/enterprises")
def get_cohort_enterprises(
    cohort_id: int,
    activation_incomplete: bool | None = Query(None, description="If true, only enterprises not fully activated"),
    health_score_below: int | None = Query(None, description="Only enterprises with health score below this"),
    velocity_band: str | None = Query(None, description="Filter by band: fast, healthy, slow, at_risk"),
    db: Session = Depends(get_db),
):
    """List enterprises in a cohort with activation_progress, health_score, decision_velocity."""
    try:
        return list_cohort_enterprises(
            db,
            cohort_id,
            activation_incomplete=activation_incomplete,
            health_score_below=health_score_below,
            velocity_band=velocity_band,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cohorts/{cohort_id}/summary")
def get_cohort_summary(cohort_id: int, db: Session = Depends(get_db)):
    """Cohort activation summary: enrolled count, averages, at-risk count."""
    try:
        return cohort_activation_summary(db, cohort_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/cohorts/{cohort_id}/enterprises")
def post_cohort_enterprise(cohort_id: int, body: CohortEnterpriseAdd, db: Session = Depends(get_db)):
    """Add an enterprise to a cohort."""
    try:
        ce = add_enterprise_to_cohort(
            db,
            cohort_id=cohort_id,
            enterprise_id=body.enterprise_id,
            activation_progress=body.activation_progress,
        )
        return {
            "cohort_id": cohort_id,
            "enterprise_id": ce.enterprise_id,
            "cohort_enterprise_id": ce.id,
            "joined_at": ce.joined_at.isoformat() if ce.joined_at else None,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
