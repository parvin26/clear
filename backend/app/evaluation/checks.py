"""
Rule-based evaluation checks for CLEAR.
(1) primary_domain in allowed set per persona
(2) advisor reply non-empty and contains at least one EMR-related term
(3) idea-stage returns no decision_id
No LLM-as-judge; used by stress test or standalone evaluation run.
"""
from typing import Any

# Persona name -> allowed primary_domain set (operating personas only; idea-stage has no decision).
ALLOWED_PRIMARY_BY_PERSONA: dict[str, set[str]] = {
    "A1 – Cash‑strained Hawker Stall Owner": {"cfo", "coo"},
    "A2 – Family Manufacturing SME Owner": {"cfo", "coo"},
    "A3 – Bootstrapped Services Agency Founder": {"cfo", "cmo", "coo"},
    "B1 – VC-backed SaaS Startup Founder": {"cfo", "cmo", "coo"},
    "B2 – E‑commerce Brand Founder": {"cfo", "cmo", "coo"},
    "B3 – Multi-outlet Restaurant Group Owner": {"cfo", "coo"},
    "C1 – Logistics SME Owner": {"coo", "cfo"},
    "C2 – Clinic Network Founder": {"coo", "cfo"},
    "D2 – Newly Registered Sole Proprietor": {"cfo", "coo"},
}

EMR_REFERENCE_TERMS = (
    "milestone", "metric", "first", "step", "plan", "week", "cash", "runway",
    "target", "action", "focus", "board", "review", "commit",
)


def check_primary_domain_in_allowed(persona_name: str, primary_domain: str | None) -> tuple[bool, str]:
    """
    Return (pass, message). Pass if persona is not in allowed map (skip) or primary_domain is in allowed set.
    """
    if not primary_domain:
        return True, "no primary (e.g. idea-stage)"
    allowed = ALLOWED_PRIMARY_BY_PERSONA.get(persona_name)
    if allowed is None:
        return True, "persona not in allowed set (skip)"
    primary = (primary_domain or "").lower()
    if primary in allowed:
        return True, f"primary_domain={primary} in allowed {allowed}"
    return False, f"primary_domain={primary} not in allowed {allowed}"


def check_advisor_reply_non_empty_and_emr(reply: str | None) -> tuple[bool, str]:
    """
    Return (pass, message). Pass if reply is non-empty and not a chat error, and contains at least one EMR-related term.
    """
    if not reply or not reply.strip():
        return False, "advisor reply missing"
    reply_lower = reply.lower().strip()
    if reply_lower.startswith("[chat error") or reply_lower.startswith("[error"):
        return False, "advisor reply is error"
    for term in EMR_REFERENCE_TERMS:
        if term in reply_lower:
            return True, f"reply contains EMR term '{term}'"
    return False, f"advisor reply does not reference EMR (reply snippet: {reply_lower[:80]}...)"


def check_idea_stage_off_ramp(idea_stage: bool, decision_id: str | None) -> tuple[bool, str]:
    """
    Return (pass, message). Pass if idea_stage=True implies decision_id is null/empty.
    """
    if not idea_stage:
        return True, "operating run"
    if decision_id and str(decision_id).strip():
        return False, "idea_stage=True but decision_id present"
    return True, "idea_stage=True and no decision_id"


def run_rule_checks(
    persona_name: str,
    primary_domain: str | None,
    advisor_reply: str | None,
    idea_stage: bool,
    decision_id: str | None,
) -> dict[str, Any]:
    """
    Run all three rule-based checks. Returns dict with keys: passed, failures, details.
    """
    details: list[dict[str, Any]] = []
    failures: list[str] = []

    ok1, msg1 = check_primary_domain_in_allowed(persona_name, primary_domain)
    details.append({"check": "primary_domain_allowed", "passed": ok1, "message": msg1})
    if not ok1:
        failures.append(f"primary_domain: {msg1}")

    if idea_stage:
        ok3, msg3 = check_idea_stage_off_ramp(idea_stage, decision_id)
        details.append({"check": "idea_stage_off_ramp", "passed": ok3, "message": msg3})
        if not ok3:
            failures.append(f"idea_stage: {msg3}")
    else:
        ok2, msg2 = check_advisor_reply_non_empty_and_emr(advisor_reply)
        details.append({"check": "advisor_reply_emr", "passed": ok2, "message": msg2})
        if not ok2:
            failures.append(f"advisor_reply: {msg2}")

    return {
        "passed": len(failures) == 0,
        "failures": failures,
        "details": details,
    }
