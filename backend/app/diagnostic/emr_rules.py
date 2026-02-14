"""
EMR rule matrix: choose_primary_domain, build_emr_plan, get_company_profile.
Domain- and profile-aware execution plan generation.
"""
from typing import Any

from app.diagnostic.emr_plan import EMR_PROFILE_MATRIX, generate_emr_plan
from app.diagnostic.profile import get_company_profile

# Profile -> (min_milestones, max_milestones, min_metrics, max_metrics, weeks_min, weeks_max, horizon_label)
PROFILE_BOUNDS = EMR_PROFILE_MATRIX


def choose_primary_domain(
    synthesis: dict[str, Any],
    agent_outputs: dict[str, Any],
    diagnostic_data: dict[str, Any] | None = None,
) -> str:
    """
    1. Finance critical (CFO red or runway-critical summary) -> cfo
    2. Else domain with highest severity in capability_gaps
    3. Else if B1/GTM persona and no survival -> cmo (growth preferred)
    4. Else fallback cfo
    """
    cfo_out = agent_outputs.get("cfo") or {}
    cfo_risk = (cfo_out.get("risk_level") or "").lower()
    cfo_summary = (cfo_out.get("summary") or "").lower()

    # Finance critical
    if cfo_risk == "red":
        return "cfo"
    if "runway" in cfo_summary and ("< 2" in cfo_summary or "under 2" in cfo_summary or "critical" in cfo_summary):
        return "cfo"
    if cfo_out.get("runway_critical"):
        return "cfo"

    gaps = synthesis.get("capability_gaps") or []
    if gaps:
        best = max(gaps, key=lambda g: g.get("severity") or 0)
        domain = best.get("domain")
        if domain in ("cfo", "cmo", "coo", "cto"):
            # B1 GTM: prefer growth when no survival
            if diagnostic_data and domain == "cmo":
                situation = (diagnostic_data.get("situationDescription") or "") + " " + " ".join(diagnostic_data.get("situationClarifiers") or [])
                if "go-to-market" in situation.lower() or "gtm" in situation.lower() or "pipeline" in situation.lower():
                    if cfo_risk != "red" and "runway critical" not in cfo_summary:
                        return "cmo"
            return domain

    return "cfo"


def build_emr_plan(
    primary_domain: str,
    profile: str,
    decision_snapshot: dict[str, Any] | None,
    onboarding_context: dict[str, Any] | None,
    agent_outputs: dict[str, Any],
) -> dict[str, Any]:
    """Build EMR plan (milestones, metrics, config, must_do_recommended_ids) for run_service."""
    snapshot = decision_snapshot or {}
    rec = snapshot.get("recommended_first_milestones") or _default_milestones(primary_domain, profile)
    profile = (profile or "B").upper()
    if profile not in EMR_PROFILE_MATRIX:
        profile = "B"
    min_m, max_m, min_met, max_met, _, _, _ = EMR_PROFILE_MATRIX[profile]

    out = generate_emr_plan(
        agent_outputs=agent_outputs,
        decision_snapshot=snapshot,
        onboarding_context=onboarding_context,
        profile=profile,
        primary_domain=primary_domain,
        recommended_first_milestones=rec[:max_m],
    )

    # Ensure metrics have input_type for UI; add domain-specific metric if missing
    metrics = out.get("metrics") or []
    if primary_domain == "cfo" and not any("runway" in (m.get("name") or "").lower() or "net cash" in (m.get("name") or "").lower() for m in metrics):
        metrics.append({"id": "met_runway", "name": "Runway / net cash", "target_value": "Track", "unit": "text", "actual_value": None, "source": "manual", "input_type": "text"})
    if primary_domain == "cto" and not any("uptime" in (m.get("name") or "").lower() or "incident" in (m.get("name") or "").lower() for m in metrics):
        metrics.append({"id": "met_ops", "name": "Uptime / incident", "target_value": "Stable", "unit": "text", "actual_value": None, "source": "manual", "input_type": "text"})
    out["metrics"] = metrics
    for m in metrics:
        if "input_type" not in m:
            m["input_type"] = "number" if (m.get("unit") or "").lower() in ("number", "currency", "percent", "days") else "text"

    return out


def _default_milestones(primary_domain: str, profile: str) -> list[dict[str, Any]]:
    """Domain-specific placeholder milestones when snapshot has none."""
    if primary_domain == "cfo":
        return [
            {"title": "Improve cash position", "description": "Extend runway and track burn.", "owner": "Founder"},
            {"title": "Runway and net cash visibility", "description": "Weekly cash review.", "owner": "Founder"},
        ]
    if primary_domain == "cto":
        return [
            {"title": "Tooling and backup", "description": "Core systems and recovery.", "owner": "Founder"},
            {"title": "Uptime and incident process", "description": "Monitor and respond.", "owner": "Founder"},
        ]
    if primary_domain == "cmo":
        return [
            {"title": "Pipeline and conversion", "description": "GTM metrics.", "owner": "Founder"},
            {"title": "CAC and LTV", "description": "Growth efficiency.", "owner": "Founder"},
        ]
    return [
        {"title": "Key operational step 1", "description": "To be defined.", "owner": "Founder"},
        {"title": "Key operational step 2", "description": "To be defined.", "owner": "Founder"},
    ]
