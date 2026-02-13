"""
Decision-scoped chat: build context from DiagnosticRun + Decision artifact, generate first assistant message.
"""
import json
import logging
from typing import Any
from uuid import UUID

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import DiagnosticRun, DecisionArtifact, Decision
from app.governance.ledger_service import get_latest_artifact_for_decision
from app.diagnostic.prompts import get_advisor_role_line, get_first_message_system_prompt, get_reply_system_prompt

logger = logging.getLogger(__name__)


def _build_decision_chat_context(
    db: Session,
    decision_id: UUID,
) -> dict[str, Any]:
    """Build context dict: onboarding, diagnostic_data (compact), synthesis summary, decision_snapshot, governance, emr config."""
    run = db.query(DiagnosticRun).filter(DiagnosticRun.decision_id == decision_id).order_by(DiagnosticRun.id.desc()).first()
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        return {}
    latest = get_latest_artifact_for_decision(db, decision_id)
    artifact = (latest.canonical_json or {}) if latest else {}

    onboarding = artifact.get("onboarding_context") or (run.onboarding_context if run else None)
    diagnostic_data = run.diagnostic_data if run else {}
    synthesis_summary = artifact.get("synthesis_summary") or {}
    decision_snapshot = artifact.get("decision_snapshot") or {}
    governance = artifact.get("governance") or {}
    emr = artifact.get("emr") or {}
    emr_config = emr.get("config") or {}

    return {
        "onboarding_context": onboarding,
        "diagnostic_data": {k: v for k, v in list(diagnostic_data.items())[:20]} if diagnostic_data else {},
        "synthesis_summary": synthesis_summary,
        "decision_snapshot": decision_snapshot,
        "governance": governance,
        "emr_config": emr_config,
        "emr": emr,
    }


def build_chat_context_for_advisor(
    db: Session,
    decision_id: UUID,
) -> dict[str, Any]:
    """
    Build the structured chat_context passed to the advisor LLM and exposed for UI (context chip).
    Includes: primary_domain, decision_statement, key_constraints, success_metric, first_actions, emr_summary.
    """
    ctx = _build_decision_chat_context(db, decision_id)
    if not ctx:
        return {}
    snapshot = ctx.get("decision_snapshot") or {}
    synthesis = ctx.get("synthesis_summary") or {}
    emr = ctx.get("emr") or {}

    primary_domain = synthesis.get("primary_domain") or "coo"
    decision_statement = snapshot.get("decision_statement") or "Address the key capability gap identified."
    key_constraints = snapshot.get("key_constraints") or []
    success_metric = snapshot.get("success_metric") or ""
    first_actions = snapshot.get("first_actions") or []
    emerging_decision = synthesis.get("emerging_decision") or ""

    must_do_ids = set(emr.get("must_do_milestone_ids") or emr.get("must_do_recommended_ids") or [])
    milestones_raw = emr.get("milestones") or []
    must_do_milestones = [{"id": m.get("id"), "title": m.get("title") or m.get("name")} for m in milestones_raw if m.get("id") in must_do_ids]
    if not must_do_milestones and milestones_raw:
        must_do_milestones = [{"id": m.get("id"), "title": m.get("title") or m.get("name")} for m in milestones_raw[:3]]

    all_milestones = [
        {"id": m.get("id"), "title": m.get("title") or m.get("name"), "status": (m.get("status") or "").lower() or "planned"}
        for m in milestones_raw
    ]
    metrics_raw = emr.get("metrics") or []
    metrics = [
        {"name": m.get("name"), "target": m.get("default_target_hint") or m.get("target_value"), "current": m.get("actual_value")}
        for m in metrics_raw
    ]

    return {
        "primary_domain": primary_domain,
        "decision_statement": decision_statement,
        "key_constraints": key_constraints,
        "success_metric": success_metric,
        "first_actions": first_actions[:5] if isinstance(first_actions, list) else [],
        "emerging_decision": emerging_decision,
        "emr_summary": {
            "must_do_milestones": must_do_milestones,
            "all_milestones": all_milestones,
            "metrics": metrics,
        },
    }


def generate_first_assistant_message(db: Session, decision_id: UUID) -> str:
    """
    Build decision chat context, call LLM to generate first message: greet by name if available,
    restate decision_statement, ask one sharp next question.
    """
    ctx = _build_decision_chat_context(db, decision_id)
    snapshot = ctx.get("decision_snapshot") or {}
    onboarding = ctx.get("onboarding_context") or {}
    decision_statement = snapshot.get("decision_statement") or "Your decision has been captured; we're here to help you move forward."

    name = (onboarding.get("name") or "").strip() or None
    primary = (ctx.get("synthesis_summary") or {}).get("primary_domain") or "coo"
    role_line = get_advisor_role_line(primary)
    system_prompt = get_first_message_system_prompt(role_line)

    user_content = f"""Decision context:
- decision_statement: {decision_statement}
- name (if any): {name or 'Not provided'}
- primary_domain: {ctx.get('synthesis_summary', {}).get('primary_domain', 'N/A')}

Generate your first message to the user now."""

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        logger.exception("Decision chat first message failed: %s", e)
        if name:
            fallback = f"Hi {name}, your decision is: {decision_statement[:200]}. What would you like to tackle first?"
        else:
            fallback = f"Your decision: {decision_statement[:200]}. What would you like to tackle first?"
        return fallback


def _format_context_summary(chat_context: dict[str, Any]) -> str:
    """Build short server-side summary for the advisor system prompt. Includes first_actions so advisor aligns with plan."""
    parts = []
    ds = (chat_context.get("decision_statement") or "").strip()
    if ds:
        parts.append(f"The main decision is: {ds}")
    primary = chat_context.get("primary_domain") or ""
    if primary:
        domain_label = {"cfo": "Finance", "cmo": "Growth", "coo": "Operations", "cto": "Technology"}.get(primary, primary)
        parts.append(f"Primary domain: {domain_label}.")
    must_do = (chat_context.get("emr_summary") or {}).get("must_do_milestones") or []
    if must_do:
        titles = [m.get("title") or m.get("id") for m in must_do if m.get("title") or m.get("id")]
        if titles:
            parts.append(f"Must-do milestones: {', '.join(titles)}.")
    first_actions = chat_context.get("first_actions") or []
    if first_actions:
        actions = [a if isinstance(a, str) else a.get("title") or a.get("description") or str(a) for a in first_actions[:5]]
        if actions:
            parts.append(f"First actions: {', '.join(actions)}.")
    constraints = chat_context.get("key_constraints") or []
    if constraints:
        parts.append(f"Key constraints: {', '.join(str(c) for c in constraints[:3])}.")
    success = (chat_context.get("success_metric") or "").strip()
    if success:
        parts.append(f"Success metric: {success}.")
    return " ".join(parts)


def generate_assistant_reply(db: Session, decision_id: UUID, user_message: str) -> str:
    """
    Build context, send user message + full chat_context to LLM, return assistant reply.
    Session is not persisted; this is a stateless reply for the decision-scoped chat.
    """
    chat_context = build_chat_context_for_advisor(db, decision_id)
    context_summary = _format_context_summary(chat_context) if chat_context else "Decision context not available."
    emr_summary = chat_context.get("emr_summary") or {}

    primary = chat_context.get("primary_domain") or "coo"
    role_line = get_advisor_role_line(primary)
    system_prompt = get_reply_system_prompt(role_line, context_summary)

    must_do_list = json.dumps(emr_summary.get("must_do_milestones") or [], indent=0)
    all_milestones_list = json.dumps(
        [{"id": m.get("id"), "title": m.get("title"), "status": m.get("status")} for m in (emr_summary.get("all_milestones") or [])],
        indent=0,
    )
    metrics_list = json.dumps(emr_summary.get("metrics") or [], indent=0)

    reference_snippets = ""
    try:
        from app.knowledge.retrieval import retrieve_knowledge_snippets
        ctx = _build_decision_chat_context(db, decision_id)
        onboarding = ctx.get("onboarding_context") or {}
        snippets = retrieve_knowledge_snippets(
            primary_domain=chat_context.get("primary_domain") or "coo",
            industry=onboarding.get("industry"),
            country=onboarding.get("country"),
            topic_keywords=[chat_context.get("decision_statement", "")[:100]] if chat_context.get("decision_statement") else None,
            db=db,
            top_k=3,
        )
        if snippets:
            reference_snippets = "\n\nReference material (adapt to this company):\n" + "\n".join(f"- [{s.get('title', '')}] {s.get('content', '')}" for s in snippets)
    except Exception as e:
        logger.debug("Knowledge retrieval skipped: %s", e)

    user_content = f"""Context summary (above). Full EMR reference:
Must-do milestones: {must_do_list}
All milestones (with status): {all_milestones_list}
Metrics: {metrics_list}

{reference_snippets}

User message: {user_message}

Respond as the advisor."""

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        logger.exception("Decision chat message failed: %s", e)
        return "I couldn't process that right now. Try rephrasing or check back in a moment."
