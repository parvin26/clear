"""
Run 5 founder-profile test scenarios through the full CLEAR diagnostic flow via API.

Prerequisites:
- Backend server running (e.g. uvicorn app.main:app) so API is available.
- USE_BACKEND_DIAGNOSTIC_RUN is a frontend flag; this script calls the backend directly.

Usage:
  From repo root (Python 3 with no extra deps; uses urllib):
    python backend/scripts/run_sample_diagnostics.py
  Or from backend directory with venv:
    python scripts/run_sample_diagnostics.py

  Optional: set CLEAR_API_URL (e.g. http://localhost:8000) if the API is elsewhere.

Output:
  - docs/CLEAR_TEST_RUNS.md (report)
  - Prints decision_id for each test and the report path.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

# Base URL for CLEAR API (no trailing slash)
API_BASE = os.environ.get("CLEAR_API_URL", "http://localhost:8000")
TIMEOUT = 120

# ---------------------------------------------------------------------------
# Test cases: onboarding_context + diagnostic_data (wizard steps 1–7)
# ---------------------------------------------------------------------------

TEST_1_SEED_B2B_SAAS = {
    "onboarding_context": {
        "name": "Aisha",
        "country": "Malaysia",
        "industry": "B2B SaaS – workflow automation",
        "company_size": "11–20",
        "email": "aisha@company.com",
    },
    "diagnostic_data": {
        "businessStage": "Growing but unstable",
        "situationDescription": (
            "We are a seed-stage B2B SaaS company at around RM60k MRR, growing 8–10% per month but with a lot of volatility. "
            "We have about 9–10 months of cash runway and I'm torn between hiring sales/marketing to push growth or cutting burn to extend runway. "
            "I don't fully trust our cash forecast or pipeline quality, and most decisions sit with me."
        ),
        "situationClarifiers": [
            "Cash feels tight or unpredictable",
            "Costs are rising faster than revenue",
            "Too many decisions depend on me",
        ],
        "decisionHorizon": "Within 90 days",
        "clarityLevel": "I see trade-offs but struggle to choose",
        "dataAvailable": [
            "Financial numbers (revenue, costs, cash)",
            "Customer or market data",
        ],
        "riskLevel": "Cash stress",
    },
}

TEST_2_SERIES_A_MARKETPLACE = {
    "onboarding_context": {
        "name": "Daniel",
        "country": "Indonesia",
        "industry": "B2C marketplace – home services",
        "company_size": "41–50",
        "email": "daniel@homesquad.id",
    },
    "diagnostic_data": {
        "businessStage": "Growing but unstable",
        "situationDescription": (
            "Our marketplace GMV is growing fast but we're losing money on each order once we include subsidies, marketing and support. "
            "Repeat usage is low and partner churn is increasing. I need to decide how aggressively to cut subsidies and performance marketing "
            "while improving retention and partner economics, without killing top-line growth."
        ),
        "situationClarifiers": [
            "Sales are declining or unstable",
            "Costs are rising faster than revenue",
            "Operations feel messy or fragile",
        ],
        "decisionHorizon": "Within 6 months",
        "clarityLevel": "I have options but need structure to decide",
        "dataAvailable": [
            "Financial numbers (revenue, costs, cash)",
            "Operational metrics (throughput, quality)",
            "Customer or market data",
        ],
        "riskLevel": "Business viability risk",
    },
}

TEST_3_MSME_MANUFACTURER = {
    "onboarding_context": {
        "name": "Nur",
        "country": "Malaysia",
        "industry": "Manufacturing – packaged food",
        "company_size": "11–20",
        "email": "nur@halalsnacks.my",
    },
    "diagnostic_data": {
        "businessStage": "Stable but stretched",
        "situationDescription": (
            "We manufacture halal snacks sold to mini markets and online. Demand is good but we constantly run out of some SKUs and overstock others. "
            "Cash is stuck in slow-moving inventory, we guess production based on what feels urgent, and I'm not sure which operational changes "
            "to prioritize to stabilise stock and cash."
        ),
        "situationClarifiers": [
            "Cash feels tight or unpredictable",
            "Operations feel messy or fragile",
        ],
        "decisionHorizon": "Within 90 days",
        "clarityLevel": "I see trade-offs but struggle to choose",
        "dataAvailable": [
            "Financial numbers (revenue, costs, cash)",
            "Operational metrics (throughput, quality)",
            "Little formal data",
        ],
        "riskLevel": "Slower growth",
    },
}

TEST_4_INFRA_FINTECH = {
    "onboarding_context": {
        "name": "Kofi",
        "country": "Ghana",
        "industry": "Fintech infrastructure – payments API",
        "company_size": "21–50",
        "email": "kofi@transitpay.africa",
    },
    "diagnostic_data": {
        "businessStage": "Early but operating",
        "situationDescription": (
            "We built a reliable cross-border payments API and have a few pilots, but sales cycles are slow and we're chasing many different types "
            "of customers (fintechs, marketplaces, remittance apps) without a clear ICP. We need to decide our GTM focus segment and motion "
            "so we can reach meaningful revenue before runway becomes a serious issue."
        ),
        "situationClarifiers": [
            "Sales are declining or unstable",
            "Too many decisions depend on me",
            "I'm not sure — it's complicated",
        ],
        "decisionHorizon": "Within 6 months",
        "clarityLevel": "I have options but need structure to decide",
        "dataAvailable": [
            "Customer or market data",
            "Little formal data",
        ],
        "riskLevel": "Slower growth",
    },
}

TEST_5_SERIES_B_SAAS = {
    "onboarding_context": {
        "name": "Maya",
        "country": "Singapore",
        "industry": "B2B SaaS – analytics",
        "company_size": "101–250",
        "email": "maya@insightloop.com",
    },
    "diagnostic_data": {
        "businessStage": "Established, seeking resilience",
        "situationDescription": (
            "We've grown to about USD 12M ARR but execution feels messy. We have too many priorities, roadmaps keep shifting, OKRs are fuzzy, "
            "and critical initiatives slip without a clear review cadence. I need to decide how to refocus the company on a few big bets "
            "and build a consistent execution rhythm so we don't lose momentum at this stage."
        ),
        "situationClarifiers": [
            "Too many decisions depend on me",
            "Operations feel messy or fragile",
        ],
        "decisionHorizon": "No fixed timeline, but it's weighing on us",
        "clarityLevel": "I see trade-offs but struggle to choose",
        "dataAvailable": [
            "Operational metrics (throughput, quality)",
            "Little formal data",
        ],
        "riskLevel": "Slower growth",
    },
}

ALL_TESTS = [
    ("Test 1 – Seed B2B SaaS, runway vs growth", TEST_1_SEED_B2B_SAAS),
    ("Test 2 – Series A marketplace, unit economics & churn", TEST_2_SERIES_A_MARKETPLACE),
    ("Test 3 – MSME manufacturer, inventory & ops chaos", TEST_3_MSME_MANUFACTURER),
    ("Test 4 – Infra fintech, unclear GTM & ICP", TEST_4_INFRA_FINTECH),
    ("Test 5 – Series B SaaS, org focus & execution rhythm", TEST_5_SERIES_B_SAAS),
]


def _req(method: str, path: str, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{API_BASE}{path}"
    data = json.dumps(json_body).encode("utf-8") if json_body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def run_one(
    name: str,
    payload: dict[str, Any],
) -> tuple[str | None, dict[str, Any] | None, str]:
    """Run diagnostic, then fetch decision, readiness, chat/start. Returns (decision_id, report_dict, error)."""
    decision_id = None
    try:
        resp = _req("POST", "/api/clear/diagnostic/run", payload)
        decision_id = resp.get("decision_id")
        if not decision_id:
            return None, None, "Response missing decision_id"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        return None, None, f"POST diagnostic/run failed: {e.code} {body}"
    except Exception as e:
        return decision_id, None, str(e)

    try:
        decision = _req("GET", f"/api/clear/decisions/{decision_id}")
        readiness = _req("GET", f"/api/clear/decisions/{decision_id}/readiness")
        chat = _req("POST", f"/api/clear/decisions/{decision_id}/chat/start", {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        return decision_id, None, f"Follow-up request failed: {e.code} {body}"

    artifact = (decision.get("latest_artifact") or {}) if isinstance(decision.get("latest_artifact"), dict) else {}
    synthesis = resp.get("synthesis_summary") or {}
    snapshot = artifact.get("decision_snapshot") or {}
    governance = artifact.get("governance") or {}
    emr = artifact.get("emr") or {}
    milestones = emr.get("milestones") or []
    metrics = emr.get("metrics") or []

    report = {
        "name": name,
        "decision_id": decision_id,
        "onboarding_context": payload.get("onboarding_context") or {},
        "diagnostic_data": payload.get("diagnostic_data") or {},
        "synthesis_summary": synthesis,
        "decision_snapshot": snapshot,
        "governance": governance,
        "emr_milestones": milestones,
        "emr_metrics": metrics,
        "emr_config": emr.get("config") or {},
        "readiness": readiness,
        "chat_initial_message": chat.get("initial_assistant_message") or "",
    }
    return decision_id, report, ""


def section_md(report: dict[str, Any]) -> str:
    """Turn one report dict into a markdown section."""
    lines = [
        f"## {report['name']}",
        "",
        f"**Decision ID:** `{report['decision_id']}`",
        "",
        "### Inputs",
        "",
        "**Onboarding:**",
        f"```json\n{json.dumps(report['onboarding_context'], indent=2)}\n```",
        "",
        "**Wizard (diagnostic_data):**",
        f"```json\n{json.dumps(report['diagnostic_data'], indent=2)}\n```",
        "",
        "### Synthesis summary",
        "",
        f"- **Primary domain:** {report['synthesis_summary'].get('primary_domain', '—')}",
        f"- **Emerging decision:** {report['synthesis_summary'].get('emerging_decision', '—')}",
        "",
        "### Decision snapshot",
        "",
    ]
    snap = report["decision_snapshot"]
    for key in ("decision_statement", "why_now", "key_constraints", "options", "recommended_path", "first_actions", "risks", "success_metric", "timeframe"):
        val = snap.get(key)
        if val is not None:
            if isinstance(val, (list, dict)):
                lines.append(f"- **{key}:**")
                lines.append(f"  ```json\n  {json.dumps(val, indent=2)}\n  ```")
            else:
                lines.append(f"- **{key}:** {val}")
        else:
            lines.append(f"- **{key}:** —")
    lines.extend(["", "### Governance", ""])
    gov = report["governance"]
    lines.append(f"- **decision_type:** {gov.get('decision_type', '—')}")
    lines.append(f"- **risk_tier:** {gov.get('risk_tier', '—')}")
    lines.append(f"- **approval_status:** {gov.get('approval_status', '—')}")
    lines.append(f"- **required_approvers:** {gov.get('required_approvers', [])}")
    lines.extend(["", "### EMR", ""])
    lines.append("**Milestones:**")
    for m in report["emr_milestones"]:
        lines.append(f"- {m.get('title', '—')} | owner: {m.get('owner', '—')} | due: {m.get('due_date', '—')} | status: {m.get('status', '—')}")
    if not report["emr_milestones"]:
        lines.append("- (none)")
    lines.append("")
    lines.append("**Metrics:**")
    for m in report["emr_metrics"]:
        lines.append(f"- {m.get('name', '—')} | target: {m.get('target_value', '—')} {m.get('unit', '')} | actual: {m.get('actual_value', '—')} | source: {m.get('source', '—')}")
    if not report["emr_metrics"]:
        lines.append("- (none)")
    lines.append("")
    lines.append(f"**Config:** cadence={report['emr_config'].get('cadence', '—')}, next_review_date={report['emr_config'].get('next_review_date', '—')}")
    lines.extend(["", "### Readiness", ""])
    r = report["readiness"]
    lines.append(f"- **Band:** {r.get('band', '—')}")
    lines.append(f"- **Metrics:** {json.dumps(r.get('metrics', {}), indent=2)}")
    lines.extend(["", "### Chat seed (initial assistant message)", ""])
    lines.append(report.get("chat_initial_message") or "(none)")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    # Resolve docs path: script may be run from repo root or backend/
    this_dir = os.path.dirname(os.path.abspath(__file__))
    # this_dir = backend/scripts -> backend = parent, repo = parent of backend
    backend_dir = os.path.dirname(this_dir)
    repo_root = os.path.dirname(backend_dir)
    docs_path = os.path.join(repo_root, "docs", "CLEAR_TEST_RUNS.md")

    md_parts = [
        "# CLEAR test runs – 5 founder profiles",
        "",
        "Automated run of the full diagnostic flow (POST /api/clear/diagnostic/run) plus decision, readiness, and chat/start for each scenario.",
        "",
        "---",
        "",
    ]

    decision_ids: list[tuple[str, str]] = []
    for name, payload in ALL_TESTS:
        decision_id, report, err = run_one(name, payload)
        if err:
            md_parts.append(f"## {name}\n\n**Error:** {err}\n\n")
            decision_ids.append((name, decision_id or "—"))
            continue
        decision_ids.append((name, report["decision_id"]))
        md_parts.append(section_md(report))
        md_parts.append("\n---\n\n")

    os.makedirs(os.path.dirname(docs_path), exist_ok=True)
    with open(docs_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_parts))

    print("Decision IDs per test:")
    for name, did in decision_ids:
        print(f"  {name}: {did}")
    print(f"\nReport written to: {docs_path}")
    sys.exit(0)


if __name__ == "__main__":
    main()
