"""Phase 2: Governance contract endpoint. Assert enums + versions + pilot_mode_rules."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_contract_returns_200():
    r = client.get("/api/clear/contract")
    assert r.status_code == 200


def test_contract_has_required_fields():
    r = client.get("/api/clear/contract")
    assert r.status_code == 200
    data = r.json()
    assert "contract_version" in data
    assert "canonicalization_version" in data
    assert data["contract_version"] == "1.0"
    assert data["canonicalization_version"] == "canon_v1"
    assert data.get("artifact_status_rule") == "derived_from_ledger_only"


def test_contract_ledger_event_enums_include_phase2():
    r = client.get("/api/clear/contract")
    assert r.status_code == 200
    enums = r.json().get("ledger_event_enums", [])
    assert "TASK_CREATED" in enums
    assert "TASK_UPDATED" in enums
    assert "MILESTONE_LOGGED" in enums
    assert "OUTCOME_RECORDED" in enums


def test_contract_has_pilot_mode_rules():
    r = client.get("/api/clear/contract")
    assert r.status_code == 200
    rules = r.json().get("pilot_mode_rules", {})
    assert "enterprise_required" in rules
    assert isinstance(rules["enterprise_required"], bool)
