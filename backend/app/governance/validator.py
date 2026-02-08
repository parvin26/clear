"""Governance completeness validator v1 (CLEAR). Blocks finalize unless required fields and rules pass."""
from typing import Any

REQUIRED_ARTIFACT_KEYS = [
    "problem_statement",
    "decision_context",
    "constraints",
    "options_considered",
    "chosen_option_id",
    "rationale",
    "risk_level",
]


def governance_completeness_errors(artifact: dict[str, Any]) -> list[str]:
    """
    Return list of missing/invalid field descriptions. Empty list => valid for finalize.
    Validator v1: decision statement, ≥1 domain, ≥1 constraint, ≥2 options, ≥1 criterion,
    recommendation points to real option. (Evidence count ≥1 enforced at finalize in ledger_service.)
    """
    errors: list[str] = []
    for key in REQUIRED_ARTIFACT_KEYS:
        if key not in artifact:
            errors.append(f"Missing required field: {key}")
            continue
        val = artifact[key]
        if val is None or (isinstance(val, (list, str)) and len(val) == 0):
            errors.append(f"Required field empty: {key}")
    if "decision_context" in artifact and isinstance(artifact["decision_context"], dict):
        dc = artifact["decision_context"]
        if not dc.get("domain"):
            errors.append("decision_context.domain is required (≥1 domain)")
    if "constraints" in artifact and isinstance(artifact["constraints"], list):
        if len(artifact["constraints"]) < 1:
            errors.append("At least one constraint required")
    if "options_considered" in artifact and isinstance(artifact["options_considered"], list):
        opts = artifact["options_considered"]
        if len(opts) < 2:
            errors.append("At least two options_considered required")
        else:
            option_ids = {o.get("id") for o in opts if isinstance(o, dict) and o.get("id")}
            chosen = artifact.get("chosen_option_id")
            if chosen and option_ids and chosen not in option_ids:
                errors.append("chosen_option_id must match one of options_considered[].id")
    if "criteria" in artifact and isinstance(artifact["criteria"], list):
        if len(artifact["criteria"]) < 1:
            errors.append("If criteria present, at least one criterion required")
    if "recommendations" in artifact and isinstance(artifact["recommendations"], list):
        for rec in artifact["recommendations"]:
            if isinstance(rec, dict) and rec.get("option_id"):
                option_ids = {o.get("id") for o in (artifact.get("options_considered") or []) if isinstance(o, dict) and o.get("id")}
                if option_ids and rec.get("option_id") not in option_ids:
                    errors.append("recommendation.option_id must reference a real options_considered[].id")
    if "risk_level" in artifact and artifact.get("risk_level"):
        rl = str(artifact["risk_level"]).lower()
        if rl not in ("low", "medium", "high", "green", "yellow", "red"):
            errors.append("risk_level must be one of: low, medium, high, green, yellow, red")
    return errors
