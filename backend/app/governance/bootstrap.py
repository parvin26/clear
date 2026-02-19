"""Draft artifact bootstrap from agent analysis (evidence -> draft only)."""
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import (
    CFOAnalysis,
    CMOAnalysis,
    COOAnalysis,
    CTOAnalysis,
    DecisionEvidenceLink,
    DecisionExecutionMilestone,
)
from app.governance.ledger_service import create_decision

ANALYSIS_TABLES = {
    "cfo": ("cfo_analyses", CFOAnalysis),
    "cmo": ("cmo_analyses", CMOAnalysis),
    "coo": ("coo_analyses", COOAnalysis),
    "cto": ("cto_analyses", CTOAnalysis),
}

DOMAIN_LABELS = {"cfo": "CFO", "cmo": "CMO", "coo": "COO", "cto": "CTO"}


def _analysis_to_draft_artifact(analysis_json: dict, domain: str, enterprise_id: str | None) -> dict:
    """
    Map agent analysis JSON to minimal draft artifact (governance fields may be placeholders).
    Includes decision_snapshot and synthesis_summary so the decision Overview tab shows this analysis.
    Caller must enrich before finalize (problem_statement, constraints, options_considered, etc.).
    """
    ap = analysis_json.get("action_plan") or {}
    risk = (analysis_json.get("risk_level") or "yellow").lower()
    if risk in ("green", "yellow", "red") and risk not in ("low", "medium", "high"):
        pass  # keep as-is per schema
    summary = analysis_json.get("summary") or "Draft from agent analysis; enrich before finalize."
    primary_issue = analysis_json.get("primary_issue") or "From analysis."
    recommendations = analysis_json.get("recommendations") or []
    first_recommendation = recommendations[0] if isinstance(recommendations, list) and recommendations else None
    rec_str = first_recommendation if isinstance(first_recommendation, str) else None

    # decision_snapshot: drives Overview tab Snapshot card and avoids "No overview data yet"
    decision_snapshot = {
        "decision_statement": primary_issue[:500] if primary_issue else summary[:500],
        "success_metric": rec_str or summary[:300] if summary else "To be defined.",
        "timeframe": "90 days",
    }

    # synthesis_summary: drives Overview tab "Synthesis summary" (primary_domain, recommended_next_step)
    synthesis_summary = {
        "primary_domain": DOMAIN_LABELS.get(domain, domain.upper()),
        "recommended_next_step": primary_issue or rec_str or "Review and finalize decision.",
    }

    return {
        "problem_statement": summary,
        "decision_context": {"domain": domain, "enterprise_id": enterprise_id, "primary_domain": DOMAIN_LABELS.get(domain, domain.upper())},
        "decision_snapshot": decision_snapshot,
        "synthesis_summary": synthesis_summary,
        "constraints": [{"id": "c1", "type": "placeholder", "description": "To be completed before finalize."}],
        "options_considered": [
            {"id": "opt1", "title": "Primary path", "summary": primary_issue},
            {"id": "opt2", "title": "Alternative", "summary": "To be completed before finalize."},
        ],
        "chosen_option_id": "opt1",
        "rationale": summary,
        "risk_level": risk if risk in ("low", "medium", "high", "green", "yellow", "red") else "yellow",
        "primary_issue": analysis_json.get("primary_issue"),
        "recommendations": recommendations,
        "risks": analysis_json.get("risks"),
        "action_plan": {"week": ap.get("week", []), "month": ap.get("month", []), "quarter": ap.get("quarter", [])},
    }


def create_draft_from_analysis(
    db: Session,
    domain: str,
    analysis_id: int,
    enterprise_id: int | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
):
    """
    Create a new decision with draft artifact bootstrapped from an agent analysis.
    Links analysis as evidence. Decision is draft only; user must enrich and then finalize.
    """
    if domain not in ANALYSIS_TABLES:
        raise ValueError(f"Unknown domain: {domain}")
    table_name, model = ANALYSIS_TABLES[domain]
    analysis = db.query(model).filter(model.id == analysis_id).first()
    if not analysis:
        raise ValueError(f"Analysis not found: {table_name} id={analysis_id}")
    analysis_json = analysis.analysis_json if hasattr(analysis, "analysis_json") else {}
    ent_id_str = str(enterprise_id) if enterprise_id else None
    draft = _analysis_to_draft_artifact(analysis_json, domain, ent_id_str)
    decision = create_decision(
        db,
        enterprise_id=enterprise_id,
        initial_artifact=draft,
        actor_id=actor_id or "bootstrap_from_analysis",
        actor_role=actor_role,
    )
    evidence = DecisionEvidenceLink(
        decision_id=decision.decision_id,
        evidence_type="analysis",
        source_ref={"system": "db", "table": table_name, "id": str(analysis_id), "uri": None},
        source_table=table_name,
        source_id=str(analysis_id),
        retrieval_metadata={"timestamp": None},
    )
    db.add(evidence)

    # Create execution milestones from action_plan so the new workspace has pre-filled milestones/KPIs
    _create_milestones_from_action_plan(db, decision.decision_id, draft.get("action_plan") or {})

    db.commit()
    db.refresh(decision)
    return decision


def _create_milestones_from_action_plan(db: Session, decision_id: UUID, action_plan: dict) -> None:
    """Create decision_execution_milestones from action_plan week/month/quarter items."""
    base = date.today()
    for bucket, days_delta in [("week", 7), ("month", 30), ("quarter", 90)]:
        items = action_plan.get(bucket) or []
        if not isinstance(items, list):
            continue
        due = base + timedelta(days=days_delta)
        for i, item in enumerate(items):
            if not item:
                continue
            label = item if isinstance(item, str) else str(item)[:500]
            name = label[:500] if len(label) > 500 else label
            m = DecisionExecutionMilestone(
                decision_id=decision_id,
                milestone_name=name,
                responsible_person=None,
                due_date=due,
                status="pending",
                notes=f"From diagnostic action plan ({bucket}).",
            )
            db.add(m)
