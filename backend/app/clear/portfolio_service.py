"""Enriched portfolio view for org (portfolio): enterprises with last decision, readiness, review date, health score."""
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import (
    Portfolio,
    PortfolioEnterprise,
    Enterprise,
    Decision,
    DecisionArtifact,
    OutcomeReview,
)
from app.governance.ledger_service import get_latest_artifact_for_decision
from app.governance.readiness import compute_readiness
from app.governance.health_score import compute_health_score
from app.governance.readiness_index import compute_readiness_index_for_enterprise
from app.clear.decision_velocity import compute_decision_velocity


def list_portfolio_enriched(
    db: Session,
    portfolio_id: int,
    readiness_band: str | None = None,
    primary_domain: str | None = None,
    country: str | None = None,
    industry: str | None = None,
    no_review_days: int | None = None,
    health_score_min: int | None = None,
    health_score_max: int | None = None,
    velocity_band: str | None = None,
    ecri_readiness_band: str | None = None,
) -> list[dict[str, Any]]:
    """
    For each enterprise in the portfolio, return enriched row: enterprise_id, name, country, industry,
    size_band, last decision_id, last primary_domain, current readiness band, last review date,
    has_committed_plan. Optional filters: readiness_band, primary_domain, country, industry,
    no_review_days (e.g. 60 = only enterprises with no outcome review in > 60 days).
    """
    port = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not port:
        return []
    pe_list = db.query(PortfolioEnterprise).filter(PortfolioEnterprise.portfolio_id == portfolio_id).all()
    out = []
    for pe in pe_list:
        ent = db.query(Enterprise).filter(Enterprise.id == pe.enterprise_id).first()
        if not ent:
            continue
        last_decision = (
            db.query(Decision)
            .filter(Decision.enterprise_id == pe.enterprise_id)
            .order_by(desc(Decision.created_at))
            .limit(1)
            .first()
        )
        if not last_decision:
            health = compute_health_score(db, pe.enterprise_id)
            vel = compute_decision_velocity(db, enterprise_id=pe.enterprise_id)
            ecri = compute_readiness_index_for_enterprise(db, pe.enterprise_id)
            row = {
                "enterprise_id": pe.enterprise_id,
                "enterprise_name": ent.name,
                "country": ent.geography,
                "industry": ent.sector,
                "company_size_band": ent.size_band,
                "last_decision_id": None,
                "last_primary_domain": None,
                "readiness_band": None,
                "last_review_date": None,
                "has_committed_plan": False,
                "health_score": health["total_score"],
                "health_status_label": health["status_label"],
                "health_trend_direction": health.get("trend_direction"),
                "avg_cycle_days": vel.get("avg_cycle_days"),
                "velocity_band": vel.get("velocity_band"),
                "trend_direction": vel.get("trend_direction"),
                "readiness_index": ecri.get("readiness_index"),
                "ecri_readiness_band": ecri.get("readiness_band"),
                "ecri_trend_direction": ecri.get("trend_direction"),
            }
        else:
            art = get_latest_artifact_for_decision(db, last_decision.decision_id)
            artifact_json = (art.canonical_json or {}) if art else {}
            synthesis = artifact_json.get("synthesis_summary") or {}
            emr = artifact_json.get("emr") or {}
            primary_dom = synthesis.get("primary_domain")
            plan_committed = emr.get("plan_committed") is True
            readiness = compute_readiness(db, last_decision.decision_id)
            last_review = (
                db.query(OutcomeReview)
                .filter(OutcomeReview.decision_id == last_decision.decision_id)
                .order_by(desc(OutcomeReview.created_at))
                .limit(1)
                .first()
            )
            last_review_date = last_review.created_at.date().isoformat() if last_review and last_review.created_at else None
            health = compute_health_score(db, pe.enterprise_id)
            vel = compute_decision_velocity(db, enterprise_id=pe.enterprise_id)
            ecri = compute_readiness_index_for_enterprise(db, pe.enterprise_id)
            row = {
                "enterprise_id": pe.enterprise_id,
                "enterprise_name": ent.name,
                "country": ent.geography,
                "industry": ent.sector,
                "company_size_band": ent.size_band,
                "last_decision_id": str(last_decision.decision_id),
                "last_primary_domain": primary_dom,
                "readiness_band": readiness.get("band"),
                "last_review_date": last_review_date,
                "has_committed_plan": plan_committed,
                "health_score": health["total_score"],
                "health_status_label": health["status_label"],
                "health_trend_direction": health.get("trend_direction"),
                "avg_cycle_days": vel.get("avg_cycle_days"),
                "velocity_band": vel.get("velocity_band"),
                "trend_direction": vel.get("trend_direction"),
                "readiness_index": ecri.get("readiness_index"),
                "ecri_readiness_band": ecri.get("readiness_band"),
                "ecri_trend_direction": ecri.get("trend_direction"),
            }
        if ecri_readiness_band and row.get("ecri_readiness_band") != ecri_readiness_band:
            continue
        if readiness_band and row.get("readiness_band") != readiness_band:
            continue
        if primary_domain and row.get("last_primary_domain") != primary_domain:
            continue
        if country and (row.get("country") or "").lower() != country.lower():
            continue
        if industry and (row.get("industry") or "").lower() != industry.lower():
            continue
        if no_review_days is not None and no_review_days > 0 and row.get("last_review_date"):
            from datetime import date, timedelta
            try:
                last = datetime.strptime(row["last_review_date"], "%Y-%m-%d").date()
                if (date.today() - last).days <= no_review_days:
                    continue
            except Exception:
                pass
        if no_review_days is not None and no_review_days > 0 and not row.get("last_review_date") and row.get("last_decision_id"):
            pass
        if health_score_min is not None and (row.get("health_score") or 0) < health_score_min:
            continue
        if health_score_max is not None and (row.get("health_score") or 100) > health_score_max:
            continue
        if velocity_band and row.get("velocity_band") != velocity_band:
            continue
        out.append(row)
    return out
