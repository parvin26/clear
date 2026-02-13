"""
EMR plan generation by company profile and primary domain.
Rule-based now; structured so we can swap to LLM later.
"""
from datetime import datetime, timedelta
from typing import Any


# Profile -> (min_milestones, max_milestones, min_metrics, max_metrics, weeks_min, weeks_max, horizon_label)
EMR_PROFILE_MATRIX = {
    "A": (2, 3, 1, 2, 2, 4, "2–4 weeks"),
    "B": (3, 5, 2, 3, 4, 8, "4–8 weeks"),
    "C": (5, 7, 3, 5, 8, 12, "8–12 weeks"),
}


def _infer_primary_domain(agent_outputs: dict[str, dict], synthesis_primary: str) -> str:
    """Use synthesis primary if present; else infer from strongest agent output (risk/summary)."""
    if synthesis_primary and synthesis_primary in ("cfo", "cmo", "coo", "cto"):
        return synthesis_primary
    best = "coo"
    best_score = 0
    risk_order = {"red": 3, "yellow": 2, "green": 1}
    for domain in ("cfo", "cmo", "coo", "cto"):
        out = agent_outputs.get(domain)
        if not out:
            continue
        r = (out.get("risk_level") or "yellow").lower()
        score = risk_order.get(r, 0)
        if score > best_score:
            best_score = score
            best = domain
    return best


def generate_emr_plan(
    agent_outputs: dict[str, Any],
    decision_snapshot: dict[str, Any],
    onboarding_context: dict[str, Any] | None,
    profile: str,
    primary_domain: str,
    recommended_first_milestones: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Rule-based EMR plan. Returns dict with milestones, metrics, config, must_do_recommended_ids.
    Milestone: id, title, description, owner_role, due_hint, status.
    Metric: id, name, target_value, unit, actual_value, source.
    Config: cadence, next_review_date, horizon_label.
    """
    profile = profile.upper() if profile else "B"
    if profile not in EMR_PROFILE_MATRIX:
        profile = "B"
    min_m, max_m, min_met, max_met, weeks_lo, weeks_hi, horizon_label = EMR_PROFILE_MATRIX[profile]

    primary_domain = _infer_primary_domain(agent_outputs, primary_domain)
    rec = recommended_first_milestones or []
    snapshot = decision_snapshot or {}

    # Build milestones from recommended_first_milestones, capped by profile
    milestones: list[dict[str, Any]] = []
    for i, m in enumerate(rec[:max_m]):
        owner = m.get("owner") or "Founder"
        milestones.append({
            "id": f"m{i + 1}",
            "title": (m.get("title") or f"Milestone {i + 1}")[:200],
            "description": (m.get("description") or "")[:500],
            "owner_role": owner,
            "owner": owner,
            "due_hint": None,
            "due_date": None,
            "status": "pending",
        })
    # Pad to min if needed
    while len(milestones) < min_m:
        i = len(milestones) + 1
        milestones.append({
            "id": f"m{i}",
            "title": f"Key step {i}",
            "description": "To be defined.",
            "owner_role": "Founder",
            "owner": "Founder",
            "due_hint": None,
            "due_date": None,
            "status": "pending",
        })

    success_metric = (snapshot.get("success_metric") or "Improved clarity and first steps completed.")[:200]
    timeframe = snapshot.get("timeframe") or ("90 days" if profile == "C" else "30 days")
    metrics: list[dict[str, Any]] = [
        {"id": "met1", "name": "Primary outcome", "target_value": success_metric, "unit": "text", "actual_value": None, "source": "manual"},
        {"id": "met2", "name": "Timeframe", "target_value": timeframe, "unit": "text", "actual_value": None, "source": "manual"},
    ]
    if profile in ("B", "C") and max_met >= 3:
        metrics.append({"id": "met3", "name": "Progress", "target_value": "On track", "unit": "text", "actual_value": None, "source": "manual"})
    if profile == "C" and max_met >= 4:
        metrics.append({"id": "met4", "name": "Owner accountability", "target_value": "Assigned", "unit": "text", "actual_value": None, "source": "manual"})

    days_ahead = (weeks_lo + weeks_hi) // 2 * 7
    next_review = (datetime.utcnow() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    cadence = "weekly" if profile == "A" else "biweekly" if profile == "B" else "monthly"
    config = {
        "cadence": cadence,
        "next_review_date": next_review,
        "horizon_label": horizon_label,
    }

    # Must-do: first 2–3 milestone ids
    must_do_count = min(3, max(2, len(milestones)))
    must_do_recommended_ids = [m["id"] for m in milestones[:must_do_count]]

    return {
        "milestones": milestones,
        "metrics": metrics,
        "config": config,
        "must_do_recommended_ids": must_do_recommended_ids,
    }
