"""
Run 10 founder-persona stress tests through the full CLEAR diagnostic flow.
Payloads match the personas in docs/CLEAR_STRESS_TEST_REPORT.md.
Use: python backend/scripts/run_10_persona_stress_test.py (backend running).
Output: prints decision_id and summary per persona; optionally set STRESS_TEST_OUTPUT_JSON=1 to write raw JSON.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

API_BASE = os.environ.get("CLEAR_API_URL", "http://localhost:8000")
TIMEOUT = 120

# ---------------------------------------------------------------------------
# 10 personas: onboarding_context + diagnostic_data (first-person, messy founder voice)
# ---------------------------------------------------------------------------

PERSONAS: list[tuple[str, dict[str, Any]]] = [
    (
        "A1 – Cash‑strained Hawker Stall Owner",
        {
            "onboarding_context": {
                "name": "Ahmad",
                "country": "Malaysia",
                "industry": "F&B – hawker stall",
                "company_size": "1-10",
                "stage": "micro",
            },
            "diagnostic_data": {
                "businessStage": "Surviving",
                "situationDescription": "I run a hawker stall in KL, 3 staff. We do RM35k a month but every week I'm scrambling for supplier credit and rent. I don't really track daily cash—just what's in the drawer. Some months we're short and I borrow from family. I need to survive the next 12 months and smooth out the cash so I can sleep.",
                "situationClarifiers": ["Cash feels tight or unpredictable", "Customers are paying late or not paying"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I'm overwhelmed",
                "dataAvailable": ["Little formal data"],
                "riskLevel": "Cash stress",
            },
        },
    ),
    (
        "A2 – Family Manufacturing SME Owner",
        {
            "onboarding_context": {
                "name": "Raj",
                "country": "Malaysia",
                "industry": "Manufacturing – components",
                "company_size": "41-50",
            },
            "diagnostic_data": {
                "businessStage": "Stable but stretched",
                "situationDescription": "Family business in Penang, 40 staff, about RM8m a year. We use old systems. The real pain is working capital—customers pay late, we have inventory piling up, and we're always negotiating with the bank. I want to improve cash conversion and reduce financing cost but I don't know where to start.",
                "situationClarifiers": ["Cash feels tight or unpredictable", "Operations feel messy or fragile"],
                "decisionHorizon": "Within 6 months",
                "clarityLevel": "I have options but need structure to decide",
                "dataAvailable": ["Financial numbers (revenue, costs, cash)", "Operational metrics (throughput, quality)"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "A3 – Bootstrapped Services Agency Founder",
        {
            "onboarding_context": {
                "name": "Dewi",
                "country": "Indonesia",
                "industry": "Services – creative agency",
                "company_size": "11-20",
            },
            "diagnostic_data": {
                "businessStage": "Growing but unstable",
                "situationDescription": "Jakarta-based agency, 12 people. Revenue is project-based so it's lumpy—some months we're flush, others we're cutting. We don't have real budgets and I set all the prices. I need predictable monthly cash and to understand our margins so we can grow without burning out.",
                "situationClarifiers": ["Cash feels tight or unpredictable", "Too many decisions depend on me"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I see trade-offs but struggle to choose",
                "dataAvailable": ["Financial numbers (revenue, costs, cash)", "Little formal data"],
                "riskLevel": "Cash stress",
            },
        },
    ),
    (
        "B1 – VC-backed SaaS Startup Founder",
        {
            "onboarding_context": {
                "name": "James",
                "country": "Singapore",
                "industry": "B2B SaaS",
                "company_size": "11-20",
                "stage": "seed",
            },
            "diagnostic_data": {
                "businessStage": "Growing but unstable",
                "situationDescription": "We're pre-Series A, 18 people, about USD40k MRR. Burn rate is high and I'm not sure our CAC vs LTV story is convincing. We don't have a clear go-to-market focus—we're trying enterprise and SMB at once. I need to extend runway and hit metrics that matter for Series A.",
                "situationClarifiers": ["Costs are rising faster than revenue", "Sales are declining or unstable"],
                "decisionHorizon": "Within 6 months",
                "clarityLevel": "I have options but need structure to decide",
                "dataAvailable": ["Financial numbers (revenue, costs, cash)", "Customer or market data"],
                "riskLevel": "Business viability risk",
            },
        },
    ),
    (
        "B2 – E‑commerce Brand Founder",
        {
            "onboarding_context": {
                "name": "Lina",
                "country": "Malaysia",
                "industry": "E-commerce – consumer brand",
                "company_size": "1-10",
            },
            "diagnostic_data": {
                "businessStage": "Growing but unstable",
                "situationDescription": "We do about RM450k GMV a month with 7 staff. Ad spend feels inefficient, we get stockouts and then overorder, and ops is chaos. I want profitable growth with basic ops discipline—not just more sales at any cost.",
                "situationClarifiers": ["Sales are declining or unstable", "Operations feel messy or fragile"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I see trade-offs but struggle to choose",
                "dataAvailable": ["Financial numbers (revenue, costs, cash)", "Customer or market data"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "B3 – Multi-outlet Restaurant Group Owner",
        {
            "onboarding_context": {
                "name": "Wei Ming",
                "country": "Malaysia",
                "industry": "F&B – multi-outlet",
                "company_size": "51-100",
            },
            "diagnostic_data": {
                "businessStage": "Stable but stretched",
                "situationDescription": "5 outlets in Johor, 65 staff. Performance is inconsistent across outlets, we don't have good reporting, and wastage is high. I need to standardize operations and get central dashboards so I know what's really going on.",
                "situationClarifiers": ["Operations feel messy or fragile", "Too many decisions depend on me"],
                "decisionHorizon": "Within 6 months",
                "clarityLevel": "I have options but need structure to decide",
                "dataAvailable": ["Operational metrics (throughput, quality)", "Financial numbers (revenue, costs, cash)"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "C1 – Logistics SME Owner",
        {
            "onboarding_context": {
                "name": "Kumar",
                "country": "Malaysia",
                "industry": "Logistics – last mile",
                "company_size": "21-50",
            },
            "diagnostic_data": {
                "businessStage": "Stable but stretched",
                "situationDescription": "Klang Valley, 30 drivers and 5 ops staff. We miss deliveries, we don't have a route planning system, and driver turnover is high. Customers complain. I need reliability and fewer complaints—that's the only way we grow.",
                "situationClarifiers": ["Operations feel messy or fragile", "Too many decisions depend on me"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I see trade-offs but struggle to choose",
                "dataAvailable": ["Operational metrics (throughput, quality)", "Little formal data"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "C2 – Clinic Network Founder",
        {
            "onboarding_context": {
                "name": "Dr. Siti",
                "country": "Malaysia",
                "industry": "Healthcare – clinic network",
                "company_size": "21-50",
            },
            "diagnostic_data": {
                "businessStage": "Stable but stretched",
                "situationDescription": "3 clinics, mix of doctors and assistants. Each clinic runs differently and we have poor process documentation. Patient experience is inconsistent. I want standard SOPs and a better patient experience so we can scale without chaos.",
                "situationClarifiers": ["Operations feel messy or fragile", "Too many decisions depend on me"],
                "decisionHorizon": "Within 6 months",
                "clarityLevel": "I have options but need structure to decide",
                "dataAvailable": ["Operational metrics (throughput, quality)", "Little formal data"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "D1 – Idea-stage Tech Founder",
        {
            "onboarding_context": {
                "name": "Alex",
                "country": "Singapore",
                "industry": "Fintech – app",
                "company_size": "1-10",
                "stage": "early",
            },
            "diagnostic_data": {
                "businessStage": "Idea / pre-revenue",
                "situationDescription": "I have an idea for a fintech app but no company yet. I'm overwhelmed—I don't know what to validate first, who to talk to, or how to structure the next 90 days. I need a disciplined validation path so I'm not just spinning.",
                "situationClarifiers": ["I'm not sure — it's complicated", "Too many decisions depend on me"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I'm overwhelmed",
                "dataAvailable": ["Little formal data"],
                "riskLevel": "Slower growth",
            },
        },
    ),
    (
        "D2 – Newly Registered Sole Proprietor",
        {
            "onboarding_context": {
                "name": "Fatimah",
                "country": "Malaysia",
                "industry": "F&B – home bakery",
                "company_size": "1-10",
            },
            "diagnostic_data": {
                "businessStage": "Early but operating",
                "situationDescription": "I just registered as sole prop. I sell baked goods from home and scale online. I'm mixing personal and business money and my pricing is ad-hoc. I need basic financial discipline and a simple plan so I don't mess this up.",
                "situationClarifiers": ["Cash feels tight or unpredictable", "I'm not sure — it's complicated"],
                "decisionHorizon": "Within 90 days",
                "clarityLevel": "I'm overwhelmed",
                "dataAvailable": ["Little formal data"],
                "riskLevel": "Cash stress",
            },
        },
    ),
]


def _req(method: str, path: str, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{API_BASE}{path}"
    data = json.dumps(json_body).encode("utf-8") if json_body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def run_one(name: str, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any] | None, str]:
    try:
        resp = _req("POST", "/api/clear/diagnostic/run", payload)
        decision_id = resp.get("decision_id")
        idea_stage = resp.get("idea_stage") is True
        if idea_stage or (decision_id is None and resp.get("idea_stage_message")):
            # Idea-stage off-ramp: no decision, no chat
            report = {
                "decision_id": None,
                "idea_stage": True,
                "idea_stage_message": (resp.get("idea_stage_message") or "")[:200],
                "primary_domain": None,
                "emerging_decision": None,
                "decision_statement": None,
                "success_metric": None,
                "key_constraints": [],
                "emr_summary": {},
                "sample_advisor_reply": None,
            }
            return None, report, ""
        if not decision_id:
            return None, None, "Response missing decision_id"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:300]
        return None, None, f"POST failed: {e.code} {body}"
    except Exception as e:
        return None, None, str(e)

    try:
        decision = _req("GET", f"/api/clear/decisions/{decision_id}")
        artifact = decision.get("latest_artifact") or {}
        synthesis = resp.get("synthesis_summary") or {}
        snapshot = artifact.get("decision_snapshot") or {}
        emr = artifact.get("emr") or {}
        primary = synthesis.get("primary_domain", "—")
        emerging = (synthesis.get("emerging_decision") or "")[:120]
        decision_statement = (snapshot.get("decision_statement") or "")[:300]
        success_metric = (snapshot.get("success_metric") or "")[:200]
        key_constraints = snapshot.get("key_constraints") or []
        milestones = emr.get("milestones") or []
        metrics = emr.get("metrics") or []
        emr_summary = {"milestones_count": len(milestones), "metrics_count": len(metrics), "domain": primary}

        # Call chat/message (session_id optional); one realistic question to get contextual reply
        sample_advisor_reply = ""
        try:
            chat_resp = _req("POST", f"/api/clear/decisions/{decision_id}/chat/message", {"message": "What should I focus on first?"})
            sample_advisor_reply = (chat_resp.get("assistant_message") or "").strip()[:500]
        except Exception as chat_err:
            sample_advisor_reply = f"[Chat error: {chat_err!s}]"[:200]

        report = {
            "decision_id": decision_id,
            "primary_domain": primary,
            "emerging_decision": emerging,
            "decision_statement": decision_statement,
            "success_metric": success_metric,
            "key_constraints": key_constraints,
            "emr_summary": emr_summary,
            "sample_advisor_reply": sample_advisor_reply,
            "artifact": artifact,
            "milestone_titles": [m.get("title") or m.get("name") or "" for m in milestones[:10]],
        }
        return decision_id, report, ""
    except urllib.error.HTTPError as e:
        return decision_id, None, f"GET failed: {e.code}"
    except Exception as e:
        return decision_id, None, str(e)


def _safe_print(msg: str) -> None:
    """Print avoiding UnicodeEncodeError on Windows cp1252."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("ascii", errors="replace").decode("ascii"))


def main() -> None:
    results: list[dict[str, Any]] = []
    for name, payload in PERSONAS:
        decision_id, report, err = run_one(name, payload)
        if err:
            _safe_print(f"{name}: ERROR - {err}")
            results.append({"name": name, "error": err, "decision_id": decision_id})
            continue
        if report.get("idea_stage"):
            _safe_print(f"{name}: IDEA-STAGE (off-ramp, no decision)")
            results.append({
                "name": name,
                "idea_stage": True,
                "idea_stage_message": report.get("idea_stage_message"),
                "decision_id": None,
                "primary_domain": None,
                "decision_statement": None,
                "success_metric": None,
                "key_constraints": [],
                "emr_summary": {},
                "sample_advisor_reply": None,
                "emerging_decision": None,
            })
            continue
        st = (report.get("decision_statement") or "")[:60]
        _safe_print(f"{name}: {report['decision_id']} | primary={report['primary_domain']} | {st}...")
        results.append({
            "name": name,
            "decision_id": report["decision_id"],
            "primary_domain": report["primary_domain"],
            "decision_statement": report["decision_statement"],
            "success_metric": report["success_metric"],
            "key_constraints": report["key_constraints"],
            "emr_summary": report["emr_summary"],
            "sample_advisor_reply": report.get("sample_advisor_reply") or "",
            "emerging_decision": report.get("emerging_decision"),
        })

    json_env = os.environ.get("STRESS_TEST_JSON_OUTPUT") or os.environ.get("STRESS_TEST_OUTPUT_JSON")
    if json_env and json_env != "0":
        out_path = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "CLEAR_STRESS_TEST_10_RESULTS.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults written to {out_path}")

    # Optional strict assertions (e.g. CI): primary_domain in allowed set; advisor reply non-empty and references plan/milestone/metric
    strict = os.environ.get("STRESS_TEST_STRICT", "").lower() in ("1", "true", "yes")
    allowed_primary: dict[str, set[str]] = {
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
    failures: list[str] = []
    for r in results:
        if r.get("error") or r.get("idea_stage"):
            continue
        name = r.get("name", "")
        primary = (r.get("primary_domain") or "").lower()
        allowed = allowed_primary.get(name)
        if allowed and primary and primary not in allowed:
            failures.append(f"{name}: primary_domain={primary} not in allowed {allowed}")
        reply = (r.get("sample_advisor_reply") or "").lower()
        if not reply or reply.startswith("[chat error"):
            failures.append(f"{name}: advisor reply missing or error")
        else:
            emr_refs = ["milestone", "metric", "first", "step", "plan", "week", "cash", "runway", "target", "action", "focus"]
            if not any(w in reply for w in emr_refs):
                failures.append(f"{name}: advisor reply does not reference EMR/milestone/metric (reply snippet: {reply[:80]}...)")
    if strict and failures:
        for f in failures:
            _safe_print(f"STRICT FAIL: {f}")
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
