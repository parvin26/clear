"""Phase 3: Deterministic mapping from agent domain + analysis_json to capability signals.

Domain -> capability code:
- cfo -> cashflow_discipline
- coo -> operational_reliability
- cmo -> growth_systemization
- cto -> technology_resilience
"""
from decimal import Decimal
from typing import Any

# Capability codes (must exist in capabilities table or be seeded)
DOMAIN_TO_CAPABILITY = {
    "cfo": "cashflow_discipline",
    "coo": "operational_reliability",
    "cmo": "growth_systemization",
    "cto": "technology_resilience",
}


def risk_level_to_numeric(risk: str) -> Decimal:
    """Map risk_level string to 0–1 score (green=high, red=low)."""
    r = (risk or "yellow").lower()
    if r == "green":
        return Decimal("0.85")
    if r == "yellow":
        return Decimal("0.55")
    if r == "red":
        return Decimal("0.25")
    return Decimal("0.5")


def analysis_to_capability_delta(domain: str, analysis_json: dict[str, Any]) -> dict[str, Any]:
    """
    Compute a single capability score delta from one analysis.
    Returns dict: capability_code, score, confidence, evidence_summary.
    """
    code = DOMAIN_TO_CAPABILITY.get(domain.lower(), "general")
    risk = analysis_json.get("risk_level", "yellow")
    score = risk_level_to_numeric(risk)
    # Confidence from presence of key fields
    has_summary = bool(analysis_json.get("summary") or analysis_json.get("primary_issue"))
    has_recommendations = bool(analysis_json.get("recommendations"))
    confidence = Decimal("0.9") if (has_summary and has_recommendations) else Decimal("0.6")
    evidence_summary = {
        "domain": domain,
        "risk_level": risk,
        "has_summary": has_summary,
        "has_recommendations": has_recommendations,
    }
    return {
        "capability_code": code,
        "score": score,
        "confidence": float(confidence),
        "evidence_summary": evidence_summary,
    }


def analyses_to_financing_readiness(analyses: list[dict[str, Any]], domain_weights: dict[str, float] | None = None) -> dict[str, Any]:
    """
    Aggregate analyses (e.g. per enterprise) into a single financing readiness score.
    Weights: cfo typically highest for financing; others optional.
    """
    if not analyses:
        return {
            "readiness_score": float(Decimal("0")),
            "flags": [],
            "rationale": {"message": "No analyses"},
        }
    weights = domain_weights or {"cfo": 0.4, "cmo": 0.2, "coo": 0.2, "cto": 0.2}
    total = Decimal("0")
    weight_sum = Decimal("0")
    flags = []
    for a in analyses:
        domain = a.get("domain", "cfo")
        w = Decimal(str(weights.get(domain, 0.2)))
        score = risk_level_to_numeric(a.get("risk_level", "yellow"))
        total += score * w
        weight_sum += w
        if score < Decimal("0.4"):
            flags.append(f"{domain}_risk_low")
    readiness = (total / weight_sum) if weight_sum else Decimal("0")
    return {
        "readiness_score": float(readiness),
        "flags": flags,
        "rationale": {"weighted_analyses": len(analyses), "flags": flags},
    }
