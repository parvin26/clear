"""Phase 4: Institutional service — portfolios, enterprise snapshots."""
from uuid import UUID
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import (
    Portfolio,
    PortfolioEnterprise,
    Enterprise,
    ImplementationTask,
    Outcome,
    CapabilityScore,
    FinancingReadiness,
)
from app.clear.decision_velocity import compute_decision_velocity


def list_portfolios(db: Session, institution_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    """List portfolios, optionally by institution."""
    q = db.query(Portfolio)
    if institution_id is not None:
        q = q.filter(Portfolio.institution_id == institution_id)
    return q.order_by(desc(Portfolio.created_at)).offset(skip).limit(limit).all()


def list_enterprises_in_portfolio(db: Session, portfolio_id: int):
    """List enterprises in a portfolio (portfolio_enterprises + enterprise details)."""
    pe = db.query(PortfolioEnterprise).filter(PortfolioEnterprise.portfolio_id == portfolio_id).all()
    out = []
    for p in pe:
        ent = db.query(Enterprise).filter(Enterprise.id == p.enterprise_id).first()
        out.append({"portfolio_enterprise_id": p.id, "enterprise_id": p.enterprise_id, "added_at": p.added_at, "enterprise_name": ent.name if ent else None})
    return out


def list_enterprises_in_portfolio_with_velocity(
    db: Session,
    portfolio_id: int,
    velocity_band: Optional[str] = None,
) -> dict[str, Any]:
    """List enterprises in portfolio with decision velocity; optional filter by velocity_band. Returns portfolio_avg_cycle_days."""
    pe = db.query(PortfolioEnterprise).filter(PortfolioEnterprise.portfolio_id == portfolio_id).all()
    enterprises_with_velocity = []
    total_avg = 0.0
    count_with_velocity = 0
    for p in pe:
        ent = db.query(Enterprise).filter(Enterprise.id == p.enterprise_id).first()
        vel = compute_decision_velocity(db, enterprise_id=p.enterprise_id)
        avg_days = vel.get("avg_cycle_days")
        band = vel.get("velocity_band")
        if velocity_band is not None and band != velocity_band:
            continue
        item = {
            "portfolio_enterprise_id": p.id,
            "enterprise_id": p.enterprise_id,
            "added_at": p.added_at.isoformat() if getattr(p.added_at, "isoformat", None) else str(p.added_at),
            "enterprise_name": ent.name if ent else None,
            "avg_cycle_days": avg_days,
            "velocity_band": band,
            "trend_direction": vel.get("trend_direction"),
            "cycle_count": vel.get("cycle_count", 0),
        }
        enterprises_with_velocity.append(item)
        if avg_days is not None:
            total_avg += avg_days
            count_with_velocity += 1
    portfolio_avg = round(total_avg / count_with_velocity, 1) if count_with_velocity else None
    return {
        "enterprises": enterprises_with_velocity,
        "portfolio_avg_cycle_days": portfolio_avg,
    }


def get_enterprise_snapshot(db: Session, enterprise_id: int) -> dict[str, Any]:
    """
    Snapshot: decisions by domain, execution status, outcomes summary, capability trend, financing readiness.
    Uses decision_records (RTCO) for decisions by domain; CLEAR decisions if present; implementation_tasks/outcomes; capability_scores; financing_readiness.
    """
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise ValueError("Enterprise not found")

    decisions_by_domain: dict[str, list[dict]] = {"cfo": [], "cmo": [], "coo": [], "cto": []}
    for rec in db.query(DecisionRecord).filter(DecisionRecord.decision_id.isnot(None)).all():
        # DecisionRecord has no enterprise_id; we use analyses. So we get decisions from analyses linked to this enterprise.
        pass
    # Get analyses for this enterprise and group by domain -> decision_id
    from app.db.models import CFOAnalysis, CMOAnalysis, COOAnalysis, CTOAnalysis
    for model, domain in [(CFOAnalysis, "cfo"), (CMOAnalysis, "cmo"), (COOAnalysis, "coo"), (CTOAnalysis, "cto")]:
        rows = db.query(model).filter(model.enterprise_id == enterprise_id).order_by(desc(model.created_at)).limit(50).all()
        for r in rows:
            did = getattr(r, "decision_id", None)
            if did:
                decisions_by_domain.setdefault(domain, []).append({
                    "decision_id": str(did),
                    "analysis_id": r.id,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })

    # Execution: count tasks (from mutable table) and optionally from event-sourced
    tasks = db.query(ImplementationTask).filter(ImplementationTask.enterprise_id == enterprise_id).all()
    execution_summary = {
        "task_count": len(tasks),
        "by_status": {},
    }
    for t in tasks:
        execution_summary["by_status"][t.status] = execution_summary["by_status"].get(t.status, 0) + 1

    outcomes = db.query(Outcome).filter(Outcome.enterprise_id == enterprise_id).order_by(desc(Outcome.measured_at)).limit(20).all()
    outcomes_summary = [
        {"outcome_type": o.outcome_type, "measured_at": o.measured_at.isoformat() if o.measured_at else None, "metrics_json": o.metrics_json}
        for o in outcomes
    ]

    capability_trend = []
    for cs in db.query(CapabilityScore).filter(CapabilityScore.enterprise_id == enterprise_id).order_by(desc(CapabilityScore.computed_at)).limit(20).all():
        capability_trend.append({
            "capability_id": cs.capability_id,
            "score": float(cs.score),
            "computed_at": cs.computed_at.isoformat() if cs.computed_at else None,
        })

    fr = db.query(FinancingReadiness).filter(FinancingReadiness.enterprise_id == enterprise_id).order_by(desc(FinancingReadiness.computed_at)).first()
    financing_readiness_latest = None
    if fr:
        financing_readiness_latest = {
            "readiness_score": float(fr.readiness_score),
            "flags_json": fr.flags_json,
            "rationale_json": fr.rationale_json,
            "computed_at": fr.computed_at.isoformat() if fr.computed_at else None,
        }

    velocity = compute_decision_velocity(db, enterprise_id=enterprise_id)

    return {
        "enterprise_id": enterprise_id,
        "enterprise_name": ent.name,
        "decisions_by_domain": decisions_by_domain,
        "execution_summary": execution_summary,
        "outcomes_summary": outcomes_summary,
        "capability_trend": capability_trend,
        "financing_readiness_latest": financing_readiness_latest,
        "decision_velocity": {
            "avg_cycle_days": velocity.get("avg_cycle_days"),
            "velocity_band": velocity.get("velocity_band"),
            "trend_direction": velocity.get("trend_direction"),
            "avg_time_to_decision": velocity.get("avg_time_to_decision"),
            "avg_time_to_execution": velocity.get("avg_time_to_execution"),
            "avg_time_to_review": velocity.get("avg_time_to_review"),
            "cycle_count": velocity.get("cycle_count", 0),
        },
    }
