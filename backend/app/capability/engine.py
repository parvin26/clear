"""Phase 3: Capability engine — compute and persist capability_scores and financing_readiness from analyses (+ optional tasks/outcomes)."""
from decimal import Decimal
from uuid import UUID
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import (
    Capability,
    CapabilityScore,
    FinancingReadiness,
    Enterprise,
    CFOAnalysis,
    CMOAnalysis,
    COOAnalysis,
    CTOAnalysis,
)
from app.capability.mappings import (
    DOMAIN_TO_CAPABILITY,
    analysis_to_capability_delta,
    analyses_to_financing_readiness,
)


def _ensure_capabilities(db: Session) -> dict[str, int]:
    """Ensure capability rows exist; return code -> id map."""
    codes = list(DOMAIN_TO_CAPABILITY.values())
    existing = {r.code: r.id for r in db.query(Capability).filter(Capability.code.in_(codes)).all()}
    domain_names = {
        "cashflow_discipline": ("cfo", "Cashflow discipline"),
        "operational_reliability": ("coo", "Operational reliability"),
        "growth_systemization": ("cmo", "Growth systemization"),
        "technology_resilience": ("cto", "Technology resilience"),
    }
    for code in codes:
        if code not in existing:
            domain, name = domain_names.get(code, (code, code.replace("_", " ").title()))
            c = Capability(code=code, domain=domain, name=name, description=f"Capability: {name}")
            db.add(c)
            db.flush()
            existing[code] = c.id
    return existing


def _get_analyses_for_enterprise(db: Session, enterprise_id: int, decision_id: Optional[UUID] = None) -> list[dict[str, Any]]:
    """Collect latest analysis_json + domain from all agent analyses for this enterprise (optionally for one decision)."""
    out = []
    for model, domain in [
        (CFOAnalysis, "cfo"),
        (CMOAnalysis, "cmo"),
        (COOAnalysis, "coo"),
        (CTOAnalysis, "cto"),
    ]:
        q = db.query(model).filter(model.enterprise_id == enterprise_id).order_by(model.created_at.desc())
        if decision_id is not None:
            q = q.filter(model.decision_id == decision_id)
        row = q.first()
        if row and getattr(row, "analysis_json", None):
            out.append({"domain": domain, "analysis_json": row.analysis_json or {}, "risk_level": (row.analysis_json or {}).get("risk_level", "yellow")})
    return out


def recompute_enterprise(
    db: Session,
    enterprise_id: int,
    decision_id: Optional[UUID] = None,
) -> tuple[list[CapabilityScore], FinancingReadiness | None]:
    """
    Compute capability_scores and financing_readiness for an enterprise from its analyses.
    Optionally scoped to a single decision_id. Returns (list of CapabilityScore, FinancingReadiness or None).
    """
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise ValueError("Enterprise not found")
    code_to_id = _ensure_capabilities(db)
    analyses = _get_analyses_for_enterprise(db, enterprise_id, decision_id)
    if not analyses:
        return [], None

    scores_out = []
    for a in analyses:
        delta = analysis_to_capability_delta(a["domain"], a.get("analysis_json", {}))
        code = delta["capability_code"]
        cap_id = code_to_id.get(code)
        if not cap_id:
            continue
        cs = CapabilityScore(
            enterprise_id=enterprise_id,
            decision_id=decision_id,
            capability_id=cap_id,
            score=Decimal(str(delta["score"])),
            confidence=Decimal(str(delta["confidence"])),
            evidence_json=delta.get("evidence_summary"),
        )
        db.add(cs)
        db.flush()
        scores_out.append(cs)

    readiness_payload = analyses_to_financing_readiness(analyses)
    fr = FinancingReadiness(
        enterprise_id=enterprise_id,
        decision_id=decision_id,
        readiness_score=Decimal(str(readiness_payload["readiness_score"])),
        flags_json=readiness_payload.get("flags"),
        rationale_json=readiness_payload.get("rationale"),
    )
    db.add(fr)
    db.flush()
    return scores_out, fr
