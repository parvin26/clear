"""Draft artifact bootstrap from agent analysis (evidence -> draft only)."""
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import CFOAnalysis, CMOAnalysis, COOAnalysis, CTOAnalysis, DecisionEvidenceLink
from app.governance.ledger_service import create_decision

ANALYSIS_TABLES = {
    "cfo": ("cfo_analyses", CFOAnalysis),
    "cmo": ("cmo_analyses", CMOAnalysis),
    "coo": ("coo_analyses", COOAnalysis),
    "cto": ("cto_analyses", CTOAnalysis),
}


def _analysis_to_draft_artifact(analysis_json: dict, domain: str, enterprise_id: str | None) -> dict:
    """
    Map agent analysis JSON to minimal draft artifact (governance fields may be placeholders).
    Caller must enrich before finalize (problem_statement, constraints, options_considered, etc.).
    """
    ap = analysis_json.get("action_plan") or {}
    risk = (analysis_json.get("risk_level") or "yellow").lower()
    if risk in ("green", "yellow", "red") and risk not in ("low", "medium", "high"):
        pass  # keep as-is per schema
    return {
        "problem_statement": analysis_json.get("summary") or "Draft from agent analysis; enrich before finalize.",
        "decision_context": {"domain": domain, "enterprise_id": enterprise_id},
        "constraints": [{"id": "c1", "type": "placeholder", "description": "To be completed before finalize."}],
        "options_considered": [
            {"id": "opt1", "title": "Primary path", "summary": analysis_json.get("primary_issue") or "From analysis."},
            {"id": "opt2", "title": "Alternative", "summary": "To be completed before finalize."},
        ],
        "chosen_option_id": "opt1",
        "rationale": analysis_json.get("summary") or "Draft bootstrap.",
        "risk_level": risk if risk in ("low", "medium", "high", "green", "yellow", "red") else "yellow",
        "primary_issue": analysis_json.get("primary_issue"),
        "recommendations": analysis_json.get("recommendations"),
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
    db.commit()
    db.refresh(decision)
    return decision
