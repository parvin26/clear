"""
Tests for EMR rule matrix: choose_primary_domain and build_emr_plan selection counts.
"""
import pytest

from app.diagnostic.emr_rules import (
    choose_primary_domain,
    build_emr_plan,
    get_company_profile,
    PROFILE_BOUNDS,
)


def test_choose_primary_domain_finance_red():
    """CFO risk red -> finance (cfo)."""
    synthesis = {"capability_gaps": [{"domain": "cmo", "severity": 4}]}
    agent_outputs = {"cfo": {"risk_level": "red", "summary": "Cash crisis"}}
    assert choose_primary_domain(synthesis, agent_outputs) == "cfo"


def test_choose_primary_domain_highest_severity_gap():
    """No finance critical; pick domain with highest severity from gaps."""
    synthesis = {"capability_gaps": [
        {"domain": "cfo", "severity": 2},
        {"domain": "cmo", "severity": 4},
        {"domain": "coo", "severity": 3},
    ]}
    agent_outputs = {"cfo": {"risk_level": "yellow"}, "cmo": {}, "coo": {}}
    assert choose_primary_domain(synthesis, agent_outputs) == "cmo"


def test_choose_primary_domain_fallback_finance():
    """No gaps or no high severity -> fallback cfo."""
    synthesis = {}
    agent_outputs = {}
    assert choose_primary_domain(synthesis, agent_outputs) == "cfo"

    synthesis = {"capability_gaps": []}
    assert choose_primary_domain(synthesis, agent_outputs) == "cfo"


def test_choose_primary_domain_runway_critical_in_summary():
    """CFO summary mentioning runway critical forces finance (survival pattern)."""
    synthesis = {"capability_gaps": [{"domain": "cmo", "severity": 4}]}
    agent_outputs = {"cfo": {"risk_level": "yellow", "summary": "Runway critical under 2 months"}}
    assert choose_primary_domain(synthesis, agent_outputs) == "cfo"


def test_choose_primary_domain_gtm_preferred_when_not_survival():
    """B1 GTM persona: primary_domain is growth when no runway-critical flag."""
    synthesis = {"capability_gaps": [{"domain": "cfo", "severity": 2}, {"domain": "cmo", "severity": 3}]}
    agent_outputs = {"cfo": {"risk_level": "yellow", "summary": "Burn rate is high, extend runway and hit metrics for Series A."}, "cmo": {"risk_level": "yellow"}}
    diagnostic_data = {"situationDescription": "Pre-Series A, MRR, CAC vs LTV, go-to-market focus, pipeline.", "situationClarifiers": []}
    assert choose_primary_domain(synthesis, agent_outputs, diagnostic_data) == "cmo"


def test_build_emr_plan_profile_a_counts():
    """Profile A: 2–3 milestones, 1–2 metrics."""
    emr = build_emr_plan("cfo", "A", {}, None, {})
    min_m, max_m, min_met, max_met, _, _, _ = PROFILE_BOUNDS["A"]
    assert min_m <= len(emr["milestones"]) <= max_m, f"Profile A milestones: {len(emr['milestones'])}"
    assert min_met <= len(emr["metrics"]) <= max_met, f"Profile A metrics: {len(emr['metrics'])}"
    assert emr["config"]["cadence"] == "weekly"
    assert "must_do_recommended_ids" in emr
    assert len(emr["must_do_recommended_ids"]) >= 2


def test_build_emr_plan_profile_b_counts():
    """Profile B: 3–5 milestones, 2–3 metrics."""
    emr = build_emr_plan("cmo", "B", {}, None, {})
    min_m, max_m, min_met, max_met, _, _, _ = PROFILE_BOUNDS["B"]
    assert min_m <= len(emr["milestones"]) <= max_m
    assert min_met <= len(emr["metrics"]) <= max_met
    assert emr["config"]["horizon_label"] == "4–8 weeks"


def test_build_emr_plan_profile_c_counts():
    """Profile C: 5–7 milestones, 3–5 metrics."""
    emr = build_emr_plan("coo", "C", {}, None, {})
    min_m, max_m, min_met, max_met, _, _, _ = PROFILE_BOUNDS["C"]
    assert min_m <= len(emr["milestones"]) <= max_m
    assert min_met <= len(emr["metrics"]) <= max_met
    assert emr["config"]["cadence"] == "monthly"


def test_build_emr_plan_domain_specific_content():
    """Milestones and metrics content differs by domain."""
    emr_cfo = build_emr_plan("cfo", "A", {}, None, {})
    emr_tech = build_emr_plan("cto", "A", {}, None, {})
    assert any("cash" in (m.get("title") or "").lower() for m in emr_cfo["milestones"])
    assert any("tool" in (m.get("title") or "").lower() or "backup" in (m.get("title") or "").lower() for m in emr_tech["milestones"])
    assert any("runway" in (m.get("name") or "").lower() or "net cash" in (m.get("name") or "").lower() for m in emr_cfo["metrics"])
    assert any("uptime" in (m.get("name") or "").lower() or "incident" in (m.get("name") or "").lower() for m in emr_tech["metrics"])


def test_build_emr_plan_metrics_have_input_type():
    """Output metrics include input_type for UI."""
    emr = build_emr_plan("cfo", "B", {}, None, {})
    for m in emr["metrics"]:
        assert "input_type" in m
        assert m["input_type"] in ("number", "text")


def test_get_company_profile_delegate():
    """get_company_profile returns A|B|C from onboarding."""
    assert get_company_profile(None) == "B"
    assert get_company_profile({"company_size": 5}) == "A"
    assert get_company_profile({"company_size": 25}) == "B"
    assert get_company_profile({"company_size": "11-50"}) == "B"
    assert get_company_profile({"stage": "micro"}) == "A"
