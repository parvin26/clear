"""
Run multi-agent diagnostic: map payloads -> call agents (with timeout) -> synthesis -> create decision.
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.agents.cfo_agent import run_ai_cfo_agent
from app.agents.cmo_agent import run_ai_cmo_agent
from app.agents.coo_agent import run_ai_coo_agent
from app.agents.cto_agent import run_ai_cto_agent
from app.db.models import DiagnosticRun
from app.diagnostic.emr_rules import choose_primary_domain, build_emr_plan
from app.diagnostic.mapping import build_all_payloads
from app.diagnostic.synthesis import run_synthesis, _decision_snapshot
from app.governance.ledger_service import create_decision
from app.enterprise.service import get_or_create_enterprise_from_onboarding
from app.schemas.cfo.cfo_input import CFOInput
from app.schemas.cmo.cmo_input import CMOInputSchema
from app.schemas.coo.coo_input import COOInput
from app.schemas.cto.cto_input import CTOInputSchema
from app.tools.financial_tools import compute_financial_summary
from app.tools.tech_tools import calculate_all_tools
from app.rag.vectorstore import search_finance_docs, search_ops_docs, search_tech_docs

logger = logging.getLogger(__name__)

AGENT_TIMEOUT = 55.0  # seconds per agent
EXECUTOR = ThreadPoolExecutor(max_workers=4)


def _run_cfo(payload: dict, db: Session, onboarding_context: dict | None = None) -> dict:
    """Sync CFO agent call (run in thread)."""
    input_data = CFOInput(**payload)
    tools_results = compute_financial_summary(
        revenue=input_data.monthly_revenue,
        expenses=input_data.monthly_expenses,
        cash_on_hand=input_data.cash_on_hand,
        upcoming_payments=input_data.upcoming_payments,
    )
    docs = None
    try:
        finance_docs = search_finance_docs(db, query="SME cash flow best practices", top_k=4)
        docs = [doc.content[:500] for doc in finance_docs]
    except Exception as e:
        logger.warning("CFO RAG failed: %s", e)
    return run_ai_cfo_agent(input_data=input_data, docs=docs, tools_results=tools_results, onboarding_context=onboarding_context)


def _run_cmo(payload: dict, db: Session, onboarding_context: dict | None = None) -> dict:
    """Sync CMO agent call (run in thread)."""
    input_dict = CMOInputSchema(**payload).model_dump(exclude={"enterprise_id", "decision_context"})
    return run_ai_cmo_agent(input_dict, db, onboarding_context=onboarding_context)


def _run_cto(payload: dict, db: Session, onboarding_context: dict | None = None) -> dict:
    """Sync CTO agent call (run in thread)."""
    input_dict = CTOInputSchema(**payload).model_dump(exclude={"enterprise_id", "decision_context"})
    tools_results = calculate_all_tools(input_dict)
    rag_context = []
    try:
        q = f"{input_dict.get('biggest_challenge')} {input_dict.get('tech_stack_maturity', '')}"
        rag_context = search_tech_docs(db, q, top_k=4)
    except Exception as e:
        logger.warning("CTO RAG failed: %s", e)
    return run_ai_cto_agent(input_dict, tools_results, rag_context, onboarding_context=onboarding_context)


async def _run_coo(payload: dict, db: Session, onboarding_context: dict | None = None) -> dict:
    """Async COO agent call."""
    from app.config import settings
    coo_input = COOInput(**payload)
    docs = None
    if settings.RAG_ENABLED:
        try:
            rag_results = search_ops_docs(
                db, "SME operations best practices for inventory and throughput", top_k=settings.RAG_TOP_K
            )
            if rag_results:
                docs = [f"{doc.title}: {doc.content[:400]}" for doc in rag_results]
        except Exception as exc:
            logger.warning("COO RAG failed: %s", exc)
    response = await run_ai_coo_agent(coo_input, docs=docs, onboarding_context=onboarding_context)
    return response


def _synthesis_to_draft_artifact(
    synthesis: dict,
    primary_domain: str,
    onboarding_context: dict | None = None,
    agent_outputs: dict | None = None,
) -> dict:
    """Build governance draft artifact from synthesis (for create_decision). Includes governance, capability_gaps, emr (domain+profile rule matrix), onboarding_context, plan_committed."""
    snapshot = synthesis.get("decision_snapshot") or {}
    problem_statement = synthesis.get("emerging_decision") or snapshot.get("decision_statement") or "Draft from multi-agent synthesis."
    constraints = [{"id": "c1", "type": "context", "description": d} for d in (snapshot.get("key_constraints") or ["To be completed before finalize."])[:3]]
    options = snapshot.get("options") or [{"id": "opt1", "title": "Primary path", "summary": problem_statement[:200], "pros_cons": {}}]
    options_considered = [{"id": o.get("id", "opt1"), "title": o.get("title", "Option"), "summary": o.get("summary", "")[:300]} for o in options[:4]]
    if not options_considered:
        options_considered = [{"id": "opt1", "title": "Primary path", "summary": problem_statement[:200]}]
    first_actions = snapshot.get("first_actions") or []
    action_plan = {"week": first_actions[:2], "month": first_actions[2:4], "quarter": first_actions[4:5]}

    governance = synthesis.get("governance") or {
        "decision_type": "ops",
        "risk_tier": "medium",
        "required_approvers": ["founder"],
        "approval_status": "draft",
    }

    capability_gaps = synthesis.get("capability_gaps") or []
    if not capability_gaps:
        capability_gaps = [{"id": "gap_synthesis_1", "domain": primary_domain, "capability": "general", "severity": 3, "confidence": 2, "description": "Capability gap identified; refine in workspace."}]

    profile = synthesis.get("profile") or "B"
    emr_payload = build_emr_plan(
        primary_domain=primary_domain,
        profile=profile,
        decision_snapshot=snapshot,
        onboarding_context=onboarding_context,
        agent_outputs=agent_outputs or {},
    )
    emr = {
        "milestones": emr_payload["milestones"],
        "metrics": emr_payload["metrics"],
        "config": emr_payload["config"],
        "must_do_recommended_ids": emr_payload.get("must_do_recommended_ids", []),
    }

    return {
        "problem_statement": problem_statement,
        "decision_context": {"domain": primary_domain, "primary_domain": primary_domain, "synthesis": True, "profile": profile},
        "constraints": constraints,
        "options_considered": options_considered,
        "chosen_option_id": options_considered[0]["id"] if options_considered else "opt1",
        "rationale": problem_statement[:500],
        "risk_level": "yellow",
        "primary_issue": snapshot.get("recommended_path") or problem_statement,
        "recommendations": snapshot.get("first_actions") or [],
        "risks": snapshot.get("risks") or [],
        "action_plan": action_plan,
        "decision_snapshot": snapshot,
        "synthesis_summary": {
            "primary_domain": primary_domain,
            "emerging_decision": synthesis.get("emerging_decision"),
            "secondary_domains": synthesis.get("secondary_domains") or [],
            "recommended_next_step": synthesis.get("recommended_next_step"),
            "recommended_playbooks": synthesis.get("recommended_playbooks") or [],
            "recommended_first_milestones": synthesis.get("recommended_first_milestones") or [],
        },
        "governance": governance,
        "capability_gaps": capability_gaps,
        "emr": emr,
        "onboarding_context": onboarding_context,
        "plan_committed": False,
        "must_do_milestone_ids": [],
        "commit_note": None,
    }


async def run_diagnostic_run(
    db: Session,
    diagnostic_data: dict,
    onboarding_context: dict | None = None,
    enterprise_id: int | None = None,
    actor_id: str | None = "guest",
    actor_role: str | None = "msme",
) -> dict[str, Any]:
    """
    Run all four agents (with timeout), synthesize, create one decision, persist DiagnosticRun.
    Returns dict: decision_id, synthesis_summary, synthesis (full), next_step recommendation, etc.
    Partial results allowed: if an agent fails, synthesis uses remaining agents.
    """
    payloads = build_all_payloads(diagnostic_data, onboarding_context)
    agent_outputs: dict[str, Any] = {}
    loop = asyncio.get_event_loop()

    async def run_with_timeout(domain: str):
        try:
            if domain == "cfo":
                out = await asyncio.wait_for(
                    loop.run_in_executor(EXECUTOR, lambda: _run_cfo(payloads["cfo"], db, onboarding_context)),
                    timeout=AGENT_TIMEOUT,
                )
            elif domain == "cmo":
                out = await asyncio.wait_for(
                    loop.run_in_executor(EXECUTOR, lambda: _run_cmo(payloads["cmo"], db, onboarding_context)),
                    timeout=AGENT_TIMEOUT,
                )
            elif domain == "cto":
                out = await asyncio.wait_for(
                    loop.run_in_executor(EXECUTOR, lambda: _run_cto(payloads["cto"], db, onboarding_context)),
                    timeout=AGENT_TIMEOUT,
                )
            else:
                out = await asyncio.wait_for(_run_coo(payloads["coo"], db, onboarding_context), timeout=AGENT_TIMEOUT)
            return domain, out
        except asyncio.TimeoutError:
            logger.warning("Agent %s timed out", domain)
            return domain, {"_error": "timeout", "summary": "", "risk_level": "yellow"}
        except Exception as e:
            logger.exception("Agent %s failed: %s", domain, e)
            return domain, {"_error": str(e), "summary": "", "risk_level": "yellow"}

    results = await asyncio.gather(
        run_with_timeout("cfo"),
        run_with_timeout("cmo"),
        run_with_timeout("coo"),
        run_with_timeout("cto"),
    )
    for domain, out in results:
        if isinstance(out, dict) and "_error" not in out:
            agent_outputs[domain] = out
        elif isinstance(out, dict):
            agent_outputs[domain] = {"summary": f"Domain {domain} failed.", "risk_level": "yellow", **out}

    if not agent_outputs:
        raise ValueError("All agents failed; cannot create decision.")

    synthesis = run_synthesis(agent_outputs, onboarding_context, diagnostic_data)
    primary = choose_primary_domain(synthesis, agent_outputs, diagnostic_data)
    synthesis["primary_domain"] = primary
    # Rebuild snapshot with chosen primary so success_metric and key_constraints match primary domain
    synthesis["decision_snapshot"] = _decision_snapshot(
        agent_outputs, primary, onboarding_context, diagnostic_data
    )
    # Option B: get-or-create enterprise from onboarding so portfolio has data when enterprises are in a portfolio
    if enterprise_id is None and onboarding_context:
        enterprise_id = get_or_create_enterprise_from_onboarding(db, onboarding_context)
    draft = _synthesis_to_draft_artifact(synthesis, primary, onboarding_context, agent_outputs)
    decision = create_decision(
        db,
        enterprise_id=enterprise_id,
        initial_artifact=draft,
        actor_id=actor_id,
        actor_role=actor_role,
    )

    diagnostic_run = DiagnosticRun(
        onboarding_context=onboarding_context,
        diagnostic_data=diagnostic_data,
        agent_outputs=agent_outputs,
        synthesis=synthesis,
        decision_id=decision.decision_id,
    )
    db.add(diagnostic_run)
    db.commit()

    snapshot = synthesis.get("decision_snapshot") or {}
    synthesis_summary = {
        "primary_domain": primary,
        "emerging_decision": synthesis.get("emerging_decision"),
        "decision_statement": snapshot.get("decision_statement"),
        "recommended_next_step": synthesis.get("recommended_next_step"),
        "recommended_playbooks": synthesis.get("recommended_playbooks"),
        "recommended_first_milestones": synthesis.get("recommended_first_milestones"),
    }

    return {
        "decision_id": str(decision.decision_id),
        "enterprise_id": decision.enterprise_id,
        "synthesis_summary": synthesis_summary,
        "synthesis": synthesis,
        "next_step": synthesis.get("recommended_next_step", "playbooks"),
        "next_step_payload": {
            "primary_domain": primary,
            "playbooks": synthesis.get("recommended_playbooks"),
            "milestones": synthesis.get("recommended_first_milestones"),
        },
    }
