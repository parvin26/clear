"""
CLEAR demo mode: read-only API serving static JSON fixtures.
Routes: /demo, /demo/enterprise/:id, /demo/portfolio.
"""
import json
from datetime import date
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

_FIXTURES_DIR = Path(__file__).resolve().parent.parent / "demo" / "fixtures"


def _load_json(name: str) -> list:
    path = _FIXTURES_DIR / name
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.get("")
def demo_overview():
    """Demo overview: enterprises list and portfolio summary. Read-only."""
    enterprises = _load_json("demo_enterprises.json")
    portfolios = _load_json("demo_portfolio.json")
    return {
        "demo": True,
        "enterprises": enterprises,
        "portfolios": portfolios,
        "message": "CLEAR demo mode: read-only. Full lifecycle: situation → decision → milestones → outcome → sharing → portfolio.",
    }


@router.get("/enterprise/{enterprise_id}")
def demo_enterprise(enterprise_id: str):
    """Single enterprise with linked decisions, milestones, outcomes, and sharing. Read-only."""
    enterprises = _load_json("demo_enterprises.json")
    ent = next((e for e in enterprises if e.get("id") == enterprise_id), None)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")

    decisions = [d for d in _load_json("demo_decisions.json") if d.get("enterprise_id") == enterprise_id]
    decision_ids = {d["id"] for d in decisions}

    milestones = [m for m in _load_json("demo_milestones.json") if m.get("decision_id") in decision_ids]
    outcomes = [o for o in _load_json("demo_outcomes.json") if o.get("decision_id") in decision_ids]
    sharing = [s for s in _load_json("demo_sharing.json") if s.get("enterprise_id") == enterprise_id]
    memory_snippets = [m for m in _load_json("demo_memory.json") if m.get("enterprise_id") == enterprise_id]

    return {
        "demo": True,
        "enterprise": ent,
        "decisions": decisions,
        "milestones": milestones,
        "outcomes": outcomes,
        "sharing": sharing,
        "memory_snippets": memory_snippets,
    }


def _today_iso() -> str:
    return date.today().isoformat()


@router.get("/portfolio")
def demo_portfolio(
    readiness_band: str | None = Query(None, description="Filter by enterprise readiness_band"),
    review_due: bool | None = Query(None, description="Filter: include only enterprises with next_review_date < today"),
    execution_stalled: bool | None = Query(None, description="Filter: include only enterprises with in_progress milestone past due"),
):
    """All portfolios with enterprise details, review_due and execution_stalled flags, shared scopes. Read-only."""
    today = _today_iso()
    portfolios = _load_json("demo_portfolio.json")
    enterprises = _load_json("demo_enterprises.json")
    decisions = _load_json("demo_decisions.json")
    milestones = _load_json("demo_milestones.json")
    outcomes = _load_json("demo_outcomes.json")
    sharing = _load_json("demo_sharing.json")

    ent_by_id = {e["id"]: e for e in enterprises}
    ent_to_decision_ids = {}
    for d in decisions:
        eid = d.get("enterprise_id")
        if eid:
            ent_to_decision_ids.setdefault(eid, []).append(d["id"])

    def _review_due(ent_id: str) -> bool:
        dec_ids = ent_to_decision_ids.get(ent_id, [])
        for o in outcomes:
            if o.get("decision_id") in dec_ids and o.get("next_review_date"):
                if o["next_review_date"] < today:
                    return True
        return False

    def _execution_stalled(ent_id: str) -> bool:
        dec_ids = ent_to_decision_ids.get(ent_id, [])
        for m in milestones:
            if m.get("decision_id") in dec_ids and m.get("status") == "in_progress" and m.get("due_date"):
                if m["due_date"] < today:
                    return True
        return False

    def _shared_scopes(ent_id: str) -> list:
        return [
            s["visibility_scope"]
            for s in sharing
            if s.get("enterprise_id") == ent_id and s.get("status") == "active"
        ]

    enriched = []
    for p in portfolios:
        details = []
        for eid in p.get("enterprises", []):
            ent = ent_by_id.get(eid)
            if not ent:
                continue
            rd = _review_due(eid)
            stalled = _execution_stalled(eid)
            scopes = _shared_scopes(eid)
            if readiness_band is not None and ent.get("readiness_band") != readiness_band:
                continue
            if review_due is True and not rd:
                continue
            if execution_stalled is True and not stalled:
                continue
            details.append({
                **ent,
                "review_due": rd,
                "execution_stalled": stalled,
                "shared_scopes": scopes,
            })
        enriched.append({**p, "enterprise_details": details})
    return {"demo": True, "portfolios": enriched}


@router.get("/enterprise")
def demo_enterprises_list():
    """List all demo enterprises. Read-only."""
    enterprises = _load_json("demo_enterprises.json")
    return {"demo": True, "enterprises": enterprises}
