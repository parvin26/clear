import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.coo_agent import run_ai_coo_agent
from app.config import settings
from app.db.database import get_db
from app.db.models import COOAnalysis
from app.governance_engine.rtco_service import create_decision_from_analysis
from app.enterprise.decision_context_service import store_context
from app.rag.vectorstore import search_ops_docs
from app.schemas.coo.coo_analysis import COOAnalysisOut, COOAnalysisPage
from app.schemas.coo.coo_input import COOInput
from app.utils.pagination import paginate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coo", tags=["COO"])

RAG_TRIGGER_CHALLENGES = {
    "scaling_operations",
    "supply_chain_inefficiencies",
}


def _serialize_analysis(model: COOAnalysis) -> COOAnalysisOut:
    payload: dict[str, Any] = model.analysis_json.copy()
    payload["id"] = model.id
    payload["created_at"] = model.created_at
    return COOAnalysisOut.model_validate(payload)


def _normalize_ai_response(response: dict[str, Any]) -> dict[str, Any]:
    defaults = {
        "summary": "",
        "primary_issue": "",
        "priority_area": "operations",
        "risks": [],
        "recommendations": [],
        "action_plan": {"week": [], "month": [], "quarter": []},
        "risk_level": "yellow",
    }
    normalized = defaults | response
    action_plan = normalized.get("action_plan") or {}
    normalized["action_plan"] = {
        "week": action_plan.get("week", []),
        "month": action_plan.get("month", []),
        "quarter": action_plan.get("quarter", []),
    }
    return normalized


@router.post("/diagnose", response_model=COOAnalysisOut)
async def diagnose(
    coo_input: COOInput,
    db: Session = Depends(get_db),
) -> COOAnalysisOut:
    logger.info(
        "coo_diagnose_request",
        extra={"extra_data": {"challenge": coo_input.biggest_operational_challenge}},
    )
    docs: list[str] | None = None
    if settings.RAG_ENABLED and coo_input.biggest_operational_challenge in RAG_TRIGGER_CHALLENGES:
        try:
            rag_results = search_ops_docs(
                db,
                "SME operations best practices for inventory and throughput in Asia and South-East Asia",
                top_k=settings.RAG_TOP_K,
            )
            if rag_results:
                docs = [f"{doc.title}: {doc.content[:400]}" for doc in rag_results]
        except Exception as exc:
            logger.warning("RAG lookup failed: %s", exc)

    payload = coo_input.model_dump(exclude={"enterprise_id", "decision_context"})
    ai_response = _normalize_ai_response(await run_ai_coo_agent(coo_input, docs=docs))
    logger.info(
        "coo_diagnose_response",
        extra={
            "extra_data": {
                "priority_area": ai_response.get("priority_area"),
                "risk_level": ai_response.get("risk_level"),
            }
        },
    )

    analysis = COOAnalysis(
        user_id=None,
        enterprise_id=getattr(coo_input, "enterprise_id", None),
        input_payload=payload,
        analysis_json=ai_response,
        priority_area=ai_response.get("priority_area", "operations"),
        risk_level=ai_response.get("risk_level", "yellow"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    try:
        rec = create_decision_from_analysis(
            analysis_id=analysis.id,
            agent_domain="coo",
            analysis_table="coo_analyses",
            artifact_json=ai_response,
            db=db,
        )
        db.commit()
        analysis.decision_id = rec.decision_id
        if getattr(coo_input, "enterprise_id", None) is not None:
            analysis.enterprise_id = coo_input.enterprise_id
        if getattr(coo_input, "decision_context", None) is not None:
            store_context(rec.decision_id, coo_input.decision_context, db, enterprise_id=coo_input.enterprise_id)
        db.commit()
        db.refresh(analysis)
    except Exception:
        db.rollback()
    return _serialize_analysis(analysis)


@router.get("/analyses", response_model=COOAnalysisPage)
def list_analyses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> COOAnalysisPage:
    query = db.query(COOAnalysis).order_by(COOAnalysis.created_at.desc())
    items, total = paginate(query, page=page, page_size=page_size)
    return {
        "items": [_serialize_analysis(item) for item in items],
        "total": total,
    }


@router.get("/analyses/{analysis_id}", response_model=COOAnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> COOAnalysisOut:
    analysis = db.get(COOAnalysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _serialize_analysis(analysis)
