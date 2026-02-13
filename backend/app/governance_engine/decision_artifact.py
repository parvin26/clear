"""
RTCO Phase 1: rule-based decision artifact generator.
Input: existing analysis_json from any agent (CFO, CMO, COO, CTO).
Output: normalized artifact { problem_statement, constraints, options, chosen_path, rationale, risks }.
No LLM; extraction from structure only. LLM enhancement can come later without schema change.
"""
from typing import Any


def build_artifact_from_analysis(analysis_json: dict[str, Any], agent_domain: str) -> dict[str, Any]:
    """
    Build a decision artifact from an agent's analysis_json.
    agent_domain in ("cfo", "cmo", "coo", "cto").
    """
    domain = (agent_domain or "").lower()
    if domain == "cfo":
        return _from_cfo(analysis_json)
    if domain == "cmo":
        return _from_cmo(analysis_json)
    if domain == "coo":
        return _from_coo(analysis_json)
    if domain == "cto":
        return _from_cto(analysis_json)
    return _generic_artifact(analysis_json)


def _problem(analysis: dict[str, Any], *keys: str) -> str:
    for k in keys:
        v = analysis.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def _risks(analysis: dict[str, Any], key: str = "risks") -> list[str]:
    r = analysis.get(key)
    if isinstance(r, list):
        return [str(x) for x in r if x]
    return []


def _options(analysis: dict[str, Any]) -> list[str]:
    recs = analysis.get("recommendations")
    if isinstance(recs, list) and recs:
        return [str(x) for x in recs]
    ap = analysis.get("action_plan") or {}
    out = []
    for slot in ("week", "month", "quarter"):
        items = ap.get(slot)
        if isinstance(items, list):
            out.extend(str(x) for x in items if x)
    return out[:10] if out else []


def _from_cfo(analysis: dict[str, Any]) -> dict[str, Any]:
    problem_statement = _problem(analysis, "primary_issue", "summary")
    options = _options(analysis)
    recs = analysis.get("recommendations") or []
    chosen_path = recs[0] if isinstance(recs, list) and recs else (options[0] if options else "")
    return {
        "problem_statement": problem_statement or analysis.get("summary", ""),
        "constraints": [],
        "options": options or list(recs)[:5] if isinstance(recs, list) else [],
        "chosen_path": chosen_path,
        "rationale": analysis.get("summary", ""),
        "risks": _risks(analysis),
    }


def _from_cmo(analysis: dict[str, Any]) -> dict[str, Any]:
    problem_statement = _problem(analysis, "primary_issue", "summary", "key_findings")
    options = _options(analysis)
    recs = analysis.get("recommendations")
    chosen_path = recs[0] if isinstance(recs, list) and recs else (options[0] if options else "")
    return {
        "problem_statement": problem_statement or (str(analysis.get("summary", ""))),
        "constraints": [],
        "options": options or (list(recs)[:5] if isinstance(recs, list) else []),
        "chosen_path": chosen_path,
        "rationale": analysis.get("summary", ""),
        "risks": _risks(analysis),
    }


def _from_coo(analysis: dict[str, Any]) -> dict[str, Any]:
    problem_statement = _problem(analysis, "primary_issue", "summary")
    options = _options(analysis)
    recs = analysis.get("recommendations")
    chosen_path = recs[0] if isinstance(recs, list) and recs else (options[0] if options else "")
    return {
        "problem_statement": problem_statement or analysis.get("summary", ""),
        "constraints": [],
        "options": options or (list(recs)[:5] if isinstance(recs, list) else []),
        "chosen_path": chosen_path,
        "rationale": analysis.get("summary", ""),
        "risks": _risks(analysis),
    }


def _from_cto(analysis: dict[str, Any]) -> dict[str, Any]:
    problem_statement = _problem(analysis, "primary_issue", "summary", "biggest_challenge")
    options = _options(analysis)
    recs = analysis.get("recommendations")
    chosen_path = recs[0] if isinstance(recs, list) and recs else (options[0] if options else "")
    return {
        "problem_statement": problem_statement or str(analysis.get("summary", "")),
        "constraints": [],
        "options": options or (list(recs)[:5] if isinstance(recs, list) else []),
        "chosen_path": chosen_path,
        "rationale": analysis.get("summary", ""),
        "risks": _risks(analysis),
    }


def _generic_artifact(analysis: dict[str, Any]) -> dict[str, Any]:
    return {
        "problem_statement": _problem(analysis, "primary_issue", "summary", "key_findings"),
        "constraints": [],
        "options": _options(analysis),
        "chosen_path": "",
        "rationale": str(analysis.get("summary", "")),
        "risks": _risks(analysis),
    }
