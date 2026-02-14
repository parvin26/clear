"""
Synthesis from multi-agent analyses: single emerging decision, snapshot, next-step recommendation.
Rule-based (no extra LLM) for latency and determinism.
Uses diagnostic_data (situationClarifiers, situationDescription) to bias primary domain and tailor narrative.
"""
import difflib
from typing import Any

RISK_ORDER = {"red": 3, "yellow": 2, "green": 1}


def _recommendation_to_str(r: Any) -> str:
    """Normalise agent recommendation item to string (agents may return str or dict with title/description/text)."""
    if r is None:
        return ""
    if isinstance(r, str):
        return r.strip()
    if isinstance(r, dict):
        for key in ("description", "text", "title", "recommendation", "action", "summary"):
            val = r.get(key)
            if val is not None and isinstance(val, str):
                return val.strip()
        return str(r)[:300]
    return str(r)[:300]

# Domain-specific success metrics (choose 1 per primary_domain; prefer runway when EMR has runway metric)
DOMAIN_SUCCESS_METRICS: dict[str, list[str]] = {
    "cfo": [
        "Cash runway of at least 6 months",
        "Net operating cash flow positive within 6–12 months",
        "Weekly cash board in place and reviewed; no surprise shortfalls for 4 weeks",
    ],
    "coo": [
        "On-time delivery ≥ 95%",
        "Customer complaints reduced by 50% in 6 months",
        "Core process documented and one owner per area within 90 days",
    ],
    "cmo": [
        "MRR +20% in 6 months with CAC payback ≤ 12 months",
        "Lead-to-customer conversion rate improved by 30%",
        "Clear ICP and 3-step sales process in place within 90 days",
    ],
    "cto": [
        "Critical systems uptime ≥ 99.5%",
        "No Sev-1 incidents for a full month",
        "Tech roadmap and ownership aligned to business priorities within 90 days",
    ],
}

# Domain-specific key constraints (pick 1–2 by domain + up to 1 generic)
DOMAIN_KEY_CONSTRAINTS: dict[str, list[str]] = {
    "cfo": ["Working capital access", "Revenue predictability", "Limited finance bandwidth", "Data quality for forecasts"],
    "coo": ["Staff capacity", "Process maturity", "Vendor/supplier dependencies", "Documentation backlog"],
    "cmo": ["Channel and CAC constraints", "ICP clarity", "Pipeline visibility", "Budget and team size"],
    "cto": ["Tech debt and legacy systems", "Team skills", "Security and compliance", "Vendor lock-in"],
}
GENERIC_CONSTRAINTS = ["Limited founder time", "Resource and time constraints typical of SMEs."]
DOMAIN_LABELS = {"cfo": "Finance", "cmo": "Growth", "coo": "Operations", "cto": "Technology"}

# Map primary_domain to decision_type for governance
DOMAIN_TO_DECISION_TYPE = {
    "cfo": "finance",
    "cmo": "gtm",
    "coo": "ops",
    "cto": "product",
}

# situationClarifiers / situationDescription keywords that suggest GTM-heavy (ICP, segment, pipeline) vs org-heavy (focus, cadence, execution)
GTM_SIGNALS = (
    "sales are declining or unstable",
    "icp", "gtm", "segment", "pipeline", "sales cycle", "go-to-market", "customer segment",
    "chasing many", "clear icp", "focus segment", "sales cycles",
)
ORG_SIGNALS = (
    "too many decisions depend on me",
    "operations feel messy or fragile",
    "focus", "cadence", "execution", "okr", "priorities", "roadmap", "rhythm",
    "too many priorities", "execution feels", "review cadence", "big bets",
)


def _risk_level(analysis: dict) -> str:
    r = (analysis.get("risk_level") or "yellow").lower()
    return r if r in RISK_ORDER else "yellow"


def _risk_tier_from_outputs(agent_outputs: dict[str, dict], primary: str) -> str:
    """Compute risk_tier: high if any red or primary is red; medium if any yellow; else low."""
    out_primary = agent_outputs.get(primary) or {}
    r_primary = _risk_level(out_primary)
    if r_primary == "red":
        return "high"
    for domain, out in agent_outputs.items():
        if out and _risk_level(out) == "red":
            return "high"
    if r_primary == "yellow":
        return "medium"
    return "low"


def _context_flags(diagnostic_data: dict | None) -> dict[str, bool]:
    """Detect GTM-heavy vs org-heavy from situationClarifiers and situationDescription."""
    if not diagnostic_data:
        return {"gtm_heavy": False, "org_heavy": False}
    situation = (diagnostic_data.get("situationDescription") or "").lower()
    clarifiers = diagnostic_data.get("situationClarifiers") or []
    clarifiers_lower = " ".join((c or "").lower() for c in clarifiers)
    combined = f"{situation} {clarifiers_lower}"
    gtm_heavy = any(s in combined for s in GTM_SIGNALS)
    org_heavy = any(s in combined for s in ORG_SIGNALS)
    return {"gtm_heavy": gtm_heavy, "org_heavy": org_heavy}


def _primary_domain(agent_outputs: dict[str, dict], diagnostic_data: dict | None = None) -> str:
    """Domain with highest risk; bias to COO for org-heavy, CMO for GTM-heavy when that domain has at least yellow risk."""
    flags = _context_flags(diagnostic_data)
    best = "coo"
    best_score = 0
    for domain in ("cfo", "cmo", "coo", "cto"):
        out = agent_outputs.get(domain)
        if not out:
            continue
        score = RISK_ORDER.get(_risk_level(out), 0)
        if score > best_score:
            best_score = score
            best = domain
    # Override when context strongly suggests a different anchor
    if flags.get("org_heavy") and best_score > 0:
        coo_out = agent_outputs.get("coo")
        if coo_out and RISK_ORDER.get(_risk_level(coo_out), 0) >= 1:
            best = "coo"
            best_score = max(best_score, RISK_ORDER.get(_risk_level(coo_out), 0))
    if flags.get("gtm_heavy") and best_score > 0:
        cmo_out = agent_outputs.get("cmo")
        if cmo_out and RISK_ORDER.get(_risk_level(cmo_out), 0) >= 1:
            best = "cmo"
            best_score = max(best_score, RISK_ORDER.get(_risk_level(cmo_out), 0))
    return best


def _secondary_domains(agent_outputs: dict[str, dict], primary: str) -> list[str]:
    return [d for d in ("cfo", "cmo", "coo", "cto") if d != primary and agent_outputs.get(d)]


def _problem_signals_by_domain(agent_outputs: dict[str, dict]) -> dict[str, list[str]]:
    signals: dict[str, list[str]] = {}
    for domain, out in agent_outputs.items():
        if not out:
            continue
        arr: list[str] = []
        if out.get("primary_issue"):
            arr.append(str(out["primary_issue"]))
        for r in out.get("risks") or []:
            if r and len(arr) < 3:
                arr.append(str(r))
        signals[domain] = arr
    return signals


def _emerging_decision(
    agent_outputs: dict[str, dict],
    primary: str,
    diagnostic_data: dict | None = None,
) -> str:
    """One-sentence decision statement from primary; for GTM-heavy focus on ICP/GTM, for org-heavy on focus/cadence."""
    flags = _context_flags(diagnostic_data)
    out = agent_outputs.get(primary) or {}
    summary = (out.get("summary") or out.get("primary_issue") or "").strip()
    if not summary and out:
        recs = out.get("recommendations") or []
        summary = _recommendation_to_str(recs[0]) if recs else ""
    if flags.get("gtm_heavy"):
        cmo_out = agent_outputs.get("cmo") or {}
        cmo_summary = (cmo_out.get("summary") or cmo_out.get("primary_issue") or "").strip()
        if cmo_summary:
            summary = cmo_summary
        if "no revenue" in (summary or "").lower() or "revenue" not in (summary or "").lower():
            summary = summary or "Define ICP and GTM focus to drive predictable pipeline and revenue."
    if flags.get("org_heavy"):
        coo_out = agent_outputs.get("coo") or {}
        coo_summary = (coo_out.get("summary") or coo_out.get("primary_issue") or "").strip()
        if coo_summary:
            summary = coo_summary
        if "financial statement" in (summary or "").lower() or "cash flow" in (summary or "").lower():
            summary = summary or "Refocus the organisation on a few big bets and a consistent execution cadence."
    if not summary:
        summary = "Address the most critical capability gap identified across finance, growth, operations, and technology."
    if len(summary) > 400:
        summary = summary[:397] + "..."
    return summary


def _decision_snapshot(
    agent_outputs: dict[str, dict],
    primary: str,
    onboarding_context: dict | None = None,
    diagnostic_data: dict | None = None,
) -> dict[str, Any]:
    """Canonical DecisionSnapshot: decision_statement, why_now, key_constraints, options, recommended_path, first_actions, risks, success_metric."""
    flags = _context_flags(diagnostic_data)
    out = agent_outputs.get(primary) or {}
    ap = out.get("action_plan") or {}
    week = ap.get("week") or []
    month = ap.get("month") or []
    quarter = ap.get("quarter") or []
    first_actions_raw = (week[:2] + month[:1] + quarter[:1])[:5]
    first_actions = [_recommendation_to_str(a) for a in first_actions_raw]
    if not first_actions and (out.get("recommendations")):
        first_actions = [_recommendation_to_str(r) for r in list(out["recommendations"])[:3]]

    risks = list(out.get("risks") or [])[:3]
    recs = list(out.get("recommendations") or [])[:3]
    why_now = []
    if out.get("primary_issue"):
        why_now.append(out["primary_issue"])
    for r in (out.get("risks") or [])[:3]:
        if r and len(why_now) < 4:
            why_now.append(str(r))
    if not why_now:
        why_now = ["Capability gap identified from diagnostic."]

    opt1_summary_raw = (out.get("summary") or "")[:200]
    options = []
    if opt1_summary_raw:
        options.append({"id": "opt1", "title": "Primary path", "summary": opt1_summary_raw, "pros_cons": {}})
    if recs:
        opt2_summary = _recommendation_to_str(recs[0])[:200] if recs else "See recommendations."
        options.append({"id": "opt2", "title": "Alternative", "summary": opt2_summary, "pros_cons": {}})
    if len(options) < 2:
        options.append({"id": "opt2", "title": "Alternative", "summary": "Review full analysis in Decision Workspace.", "pros_cons": {}})

    decision_statement = out.get("summary") or "Address the key capability gap identified."
    if flags.get("org_heavy") and primary == "coo":
        if not decision_statement or any(x in (decision_statement or "").lower() for x in ("no financial statement", "financial statement", "cash flow")):
            coo_issue = out.get("primary_issue") or (_recommendation_to_str(recs[0]) if recs else "")
            decision_statement = coo_issue or "Refocus the organisation on a few big bets and a consistent execution cadence."
    if flags.get("gtm_heavy") and primary == "cmo":
        if "no revenue" in (decision_statement or "").lower():
            decision_statement = out.get("primary_issue") or (_recommendation_to_str(recs[0]) if recs else "Define ICP and GTM focus to drive predictable pipeline and revenue.")
    if onboarding_context:
        stage = onboarding_context.get("company_size_band") or onboarding_context.get("business_stage") or "startup"
        industry = onboarding_context.get("industry") or "SME"
        prefix = f"For a {stage} company in {industry}, ".lower()
        if len(prefix) + len(decision_statement) <= 450:
            decision_statement = prefix + decision_statement
        else:
            decision_statement = prefix[: 450 - len(decision_statement) - 3].rstrip() + ". " + decision_statement

    # Domain-specific success metric
    domain_metrics = DOMAIN_SUCCESS_METRICS.get(primary, DOMAIN_SUCCESS_METRICS["coo"])
    success_metric = domain_metrics[0]
    if primary == "cfo" and "runway" in (out.get("summary") or "").lower():
        success_metric = domain_metrics[0] if "runway" in domain_metrics[0].lower() else domain_metrics[0]
    elif primary == "cfo" and len(domain_metrics) > 1:
        success_metric = domain_metrics[1] if "cash flow" in (out.get("summary") or "").lower() else domain_metrics[0]

    # Domain-specific key_constraints (1–2 domain + 1 generic, avoid only generic)
    domain_constraints = DOMAIN_KEY_CONSTRAINTS.get(primary, DOMAIN_KEY_CONSTRAINTS["coo"])
    key_constraints = list(domain_constraints[:2])
    key_constraints.append(GENERIC_CONSTRAINTS[0])

    # Ensure opt1 summary is not near-identical to decision_statement (rephrase to emphasise approach)
    if options and options[0].get("id") == "opt1":
        opt1_summary = options[0]["summary"]
        sim = difflib.SequenceMatcher(None, (decision_statement or "")[:300], (opt1_summary or "")[:300]).ratio()
        if sim > 0.8 and opt1_summary:
            approach_phrases = {
                "cfo": "Focus on cash discipline and visibility first, then growth.",
                "cmo": "Focus on ICP and pipeline before scaling spend.",
                "coo": "Focus on process clarity and one owner per area, then scale.",
                "cto": "Focus on reliability and roadmap alignment, then new build.",
            }
            options[0]["summary"] = (opt1_summary[:120].rstrip() + ". " + approach_phrases.get(primary, "Prioritise first steps then iterate."))[:200]

    # recommended_path: concrete (opt1 + success_metric) or short why-this-path
    opt1 = options[0]["summary"] if options else (out.get("summary") or "")[:200]
    recommended_path = f"{opt1} Success looks like: {success_metric}."
    if len(recommended_path) > 500:
        recommended_path = recommended_path[:497] + "..."

    return {
        "decision_statement": decision_statement,
        "why_now": why_now,
        "key_constraints": key_constraints,
        "options": options,
        "recommended_path": recommended_path,
        "first_actions": first_actions[:5],
        "risks": risks,
        "success_metric": success_metric,
        "timeframe": "90 days",
    }


def _capability_gaps(agent_outputs: dict[str, dict]) -> list[dict[str, Any]]:
    """Build capability_gaps from all domains. At least one per domain that has primary_issue or risks."""
    gaps = []
    for domain in ("cfo", "cmo", "coo", "cto"):
        out = agent_outputs.get(domain)
        if not out:
            continue
        primary_issue = out.get("primary_issue") or out.get("summary")
        if primary_issue:
            gaps.append({
                "id": f"gap_{domain}_1",
                "domain": domain,
                "capability": domain,
                "severity": 4 if _risk_level(out) == "red" else (3 if _risk_level(out) == "yellow" else 2),
                "confidence": 3,
                "description": str(primary_issue)[:300],
            })
        for i, r in enumerate((out.get("risks") or [])[:2]):
            gaps.append({
                "id": f"gap_{domain}_r{i+1}",
                "domain": domain,
                "capability": domain,
                "severity": 3,
                "confidence": 2,
                "description": str(r)[:300],
            })
    if not gaps:
        gaps = [{"id": "gap_synthesis_1", "domain": "coo", "capability": "general", "severity": 3, "confidence": 2, "description": "Capability gap identified from diagnostic; refine in workspace."}]
    return gaps[:15]


def _recommended_next_step(
    agent_outputs: dict[str, dict],
    primary: str,
    snapshot: dict,
) -> str:
    """One of: playbooks | ai_chat | human_review."""
    out = agent_outputs.get(primary) or {}
    risk = _risk_level(out)
    if risk == "red":
        return "human_review"
    if risk == "yellow" and (snapshot.get("first_actions") or []):
        return "ai_chat"
    return "playbooks"


def _recommended_playbooks(primary: str) -> list[str]:
    """Static list by domain; can be expanded later."""
    by_domain = {
        "cfo": ["cash-flow-basics", "financial-controls-sme", "fundraising-readiness"],
        "cmo": ["lead-generation-sme", "brand-and-retention", "marketing-metrics"],
        "coo": ["process-standardization", "ops-kpis", "vendor-management"],
        "cto": ["tech-roadmap-sme", "security-basics", "devops-first-steps"],
    }
    return by_domain.get(primary, ["getting-started"])[:5]


# situationClarifiers -> suggested milestone titles and owner role (used when clarifier appears)
CLARIFIER_MILESTONE_HINTS: dict[str, tuple[str, str]] = {
    "cash feels tight or unpredictable": ("Build 12-month cash forecast", "Founder"),
    "costs are rising faster than revenue": ("Align costs to revenue and runway", "Founder"),
    "customers are paying late or not paying": ("Tighten payment terms and collection process", "Founder"),
    "sales are declining or unstable": ("Define ICP and 3-step sales process", "Founder"),
    "too many decisions depend on me": ("Set execution cadence and top 3 priorities", "Founder"),
    "operations feel messy or fragile": ("Document core processes and one owner per area", "Ops lead"),
    "i'm not sure; it's complicated": ("Clarify the single biggest bottleneck", "Founder"),
}

def _recommended_first_milestones(
    agent_outputs: dict[str, dict],
    primary: str,
    diagnostic_data: dict | None = None,
    onboarding_context: dict | None = None,
) -> list[dict[str, Any]]:
    """2-5 milestone-like items: use situationClarifiers for specific labels and owner, else action_plan."""
    out = agent_outputs.get(primary) or {}
    ap = out.get("action_plan") or {}
    clarifiers = [c for c in (diagnostic_data.get("situationClarifiers") or []) if c]
    items: list[dict[str, Any]] = []
    seen_titles: set[str] = set()
    for raw in clarifiers:
        if len(items) >= 5:
            break
        key = (raw or "").strip().lower()
        for phrase, (title, owner) in CLARIFIER_MILESTONE_HINTS.items():
            if phrase in key and title not in seen_titles:
                items.append({"title": title, "description": "", "owner": owner})
                seen_titles.add(title)
                break
    for label, ap_key in [("Week", "week"), ("Month", "month"), ("Quarter", "quarter")]:
        for i, text in enumerate(ap.get(ap_key) or []):
            if text and len(items) < 5:
                title = f"{label} {i + 1}"
                if title not in seen_titles:
                    items.append({"title": title, "description": str(text)[:300], "owner": "Founder"})
                    seen_titles.add(title)
    if not items and out.get("recommendations"):
        for r in (out["recommendations"])[:3]:
            items.append({"title": "Action", "description": str(r)[:300], "owner": "Founder"})
    for m in items:
        if "owner" not in m:
            m["owner"] = "Founder"
    return items[:5]


def _governance_from_synthesis(
    primary: str,
    risk_tier: str,
) -> dict[str, Any]:
    """Governance metadata: decision_type, risk_tier, required_approvers, approval_status."""
    decision_type = DOMAIN_TO_DECISION_TYPE.get(primary, "ops")
    if decision_type in ("finance", "people") or risk_tier == "high":
        return {
            "decision_type": decision_type,
            "risk_tier": risk_tier,
            "required_approvers": ["board_or_lead"],
            "approval_status": "pending_approval",
        }
    return {
        "decision_type": decision_type,
        "risk_tier": risk_tier,
        "required_approvers": ["founder"],
        "approval_status": "draft",
    }


def run_synthesis(
    agent_outputs: dict[str, dict],
    onboarding_context: dict | None = None,
    diagnostic_data: dict | None = None,
) -> dict[str, Any]:
    """
    Build synthesis from agent_outputs. Uses onboarding_context in decision_snapshot narrative.
    Uses diagnostic_data to bias primary domain (GTM -> CMO, org -> COO) and to tailor EMR milestones.
    Returns dict with: primary_domain, secondary_domains, problem_signals, emerging_decision,
    decision_snapshot, capability_gaps, governance, recommended_next_step, recommended_playbooks, recommended_first_milestones.
    """
    primary = _primary_domain(agent_outputs, diagnostic_data)
    secondary = _secondary_domains(agent_outputs, primary)
    problem_signals = _problem_signals_by_domain(agent_outputs)
    emerging_decision = _emerging_decision(agent_outputs, primary, diagnostic_data)
    decision_snapshot = _decision_snapshot(agent_outputs, primary, onboarding_context, diagnostic_data)
    risk_tier = _risk_tier_from_outputs(agent_outputs, primary)
    governance = _governance_from_synthesis(primary, risk_tier)
    capability_gaps = _capability_gaps(agent_outputs)
    recommended_next_step = _recommended_next_step(agent_outputs, primary, decision_snapshot)
    recommended_playbooks = _recommended_playbooks(primary)
    recommended_first_milestones = _recommended_first_milestones(
        agent_outputs, primary, diagnostic_data, onboarding_context
    )

    from app.diagnostic.profile import get_company_profile
    profile = get_company_profile(onboarding_context)

    return {
        "primary_domain": primary,
        "secondary_domains": secondary,
        "problem_signals": problem_signals,
        "emerging_decision": emerging_decision,
        "decision_snapshot": decision_snapshot,
        "capability_gaps": capability_gaps,
        "governance": governance,
        "recommended_next_step": recommended_next_step,
        "recommended_playbooks": recommended_playbooks,
        "recommended_first_milestones": recommended_first_milestones,
        "profile": profile,
    }
