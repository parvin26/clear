"""
Tests for diagnostic synthesis: run_synthesis and _decision_snapshot.
Regression: D2 (sole proprietor) 500 when agents return recommendations as dicts.
"""
import pytest

from app.diagnostic.synthesis import run_synthesis, _decision_snapshot, _recommendation_to_str


def test_recommendation_to_str_string():
    assert _recommendation_to_str("Separate business and personal accounts") == "Separate business and personal accounts"
    assert _recommendation_to_str("  Track weekly cash  ") == "Track weekly cash"
    assert _recommendation_to_str(None) == ""


def test_recommendation_to_str_dict():
    assert _recommendation_to_str({"description": "Set up a simple cash board"}) == "Set up a simple cash board"
    assert _recommendation_to_str({"text": "Review pricing"}) == "Review pricing"
    assert _recommendation_to_str({"title": "Action 1"}) == "Action 1"
    assert _recommendation_to_str({"other": "key"})[:10] == "{'other': "


def test_decision_snapshot_cfo_with_dict_recommendations():
    """D2-like: primary CFO with recommendations as list of dicts (LLM sometimes returns this shape)."""
    agent_outputs = {
        "cfo": {
            "summary": "Sole prop mixing personal and business money; need basic financial discipline.",
            "primary_issue": "No separation of funds or simple tracking.",
            "risks": ["Cash flow confusion", "Tax exposure"],
            "recommendations": [
                {"description": "Open a separate business account"},
                {"text": "Track weekly income and expenses in a simple sheet"},
            ],
            "action_plan": {"week": [], "month": [], "quarter": []},
            "risk_level": "yellow",
        },
        "cmo": {"summary": "", "risk_level": "green"},
        "coo": {"summary": "", "risk_level": "green"},
        "cto": {"summary": "", "risk_level": "green"},
    }
    onboarding_context = {"name": "Fatimah", "company_size": "1-10", "industry": "F&B – home bakery", "country": "Malaysia"}
    diagnostic_data = {
        "businessStage": "Early but operating",
        "situationDescription": "I just registered as sole prop. I sell baked goods from home.",
        "situationClarifiers": ["Cash feels tight or unpredictable", "I'm not sure — it's complicated"],
    }
    snapshot = _decision_snapshot(agent_outputs, "cfo", onboarding_context, diagnostic_data)
    assert snapshot["decision_statement"]
    assert isinstance(snapshot["success_metric"], str)
    assert isinstance(snapshot["key_constraints"], list)
    assert len(snapshot["options"]) >= 1
    for opt in snapshot["options"]:
        assert isinstance(opt.get("summary"), str), f"Option summary must be str, got {type(opt.get('summary'))}"
    assert all(isinstance(a, str) for a in snapshot["first_actions"]), "first_actions must be list of strings"


def test_run_synthesis_d2_like_dict_recommendations():
    """Full run_synthesis with D2-like payload; recommendations as dicts must not raise."""
    agent_outputs = {
        "cfo": {
            "summary": "Basic financial discipline needed for home bakery sole prop.",
            "primary_issue": "Mixing personal and business money.",
            "risks": ["Cash confusion"],
            "recommendations": [
                {"description": "Open a business account"},
                {"text": "Track weekly cash"},
            ],
            "action_plan": {"week": [], "month": [], "quarter": []},
            "risk_level": "yellow",
        },
        "cmo": {"summary": "N/A", "risk_level": "green"},
        "coo": {"summary": "N/A", "risk_level": "green"},
        "cto": {"summary": "N/A", "risk_level": "green"},
    }
    onboarding_context = {"company_size": "1-10", "industry": "F&B – home bakery"}
    diagnostic_data = {"businessStage": "Early but operating", "situationDescription": "Sole prop, home bakery.", "situationClarifiers": ["Cash feels tight"]}
    result = run_synthesis(agent_outputs, onboarding_context, diagnostic_data)
    assert "primary_domain" in result
    assert "decision_snapshot" in result
    assert "profile" in result
    snapshot = result["decision_snapshot"]
    assert isinstance(snapshot["decision_statement"], str)
    assert isinstance(snapshot.get("first_actions"), list)
    assert all(isinstance(a, str) for a in snapshot.get("first_actions", []))
