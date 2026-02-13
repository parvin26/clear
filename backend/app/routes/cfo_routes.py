"""CFO diagnostic routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
from app.db.database import get_db
from app.schemas.cfo.cfo_input import CFOInput
from app.schemas.cfo.cfo_analysis import CFOAnalysisOut, CFOAnalysisListItem
from app.schemas.cfo.cfo_chat import CFOChatRequest, CFOChatResponse
from app.db.models import CFOAnalysis, CFOChatMessage
from app.agents.cfo_agent import run_ai_cfo_agent, run_ai_cfo_chat
from app.governance_engine.rtco_service import create_decision_from_analysis
from app.enterprise.decision_context_service import store_context
from app.tools.financial_tools import compute_financial_summary
from app.rag.vectorstore import search_finance_docs
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cfo", tags=["CFO"])


@router.post("/diagnose", response_model=CFOAnalysisOut)
async def diagnose(
    input_data: CFOInput,
    db: Session = Depends(get_db)
):
    """Run AI-CFO diagnostic analysis."""
    try:
        # Step 1: Compute financial metrics
        tools_results = compute_financial_summary(
            revenue=input_data.monthly_revenue,
            expenses=input_data.monthly_expenses,
            cash_on_hand=input_data.cash_on_hand,
            upcoming_payments=input_data.upcoming_payments
        )
        
        # Step 2: Optionally fetch RAG docs
        docs = None
        if input_data.biggest_challenge in [
            "cash_flow_management",
            "forecasting_budgeting",
            "financial_risk_management",
        ]:
            try:
                finance_docs = search_finance_docs(
                    db=db,
                    query=f"SME {input_data.biggest_challenge} best practices",
                    top_k=4
                )
                docs = [doc.content[:500] for doc in finance_docs]  # Truncate for context
            except Exception as e:
                logger.warning(f"RAG search failed: {e}")
        
        # Step 3: Call AI-CFO agent
        analysis_json = run_ai_cfo_agent(
            input_data=input_data,
            docs=docs,
            tools_results=tools_results
        )
        
        # Step 4: Save to database
        payload = input_data.model_dump(exclude={"enterprise_id", "decision_context"})
        cfo_analysis = CFOAnalysis(
            user_id=None,
            enterprise_id=getattr(input_data, "enterprise_id", None),
            input_payload=payload,
            analysis_json=analysis_json,
            risk_level=analysis_json.get("risk_level", "yellow")
        )
        db.add(cfo_analysis)
        db.commit()
        db.refresh(cfo_analysis)
        try:
            rec = create_decision_from_analysis(
                analysis_id=cfo_analysis.id,
                agent_domain="cfo",
                analysis_table="cfo_analyses",
                artifact_json=analysis_json,
                db=db,
            )
            db.commit()
            cfo_analysis.decision_id = rec.decision_id
            if getattr(input_data, "enterprise_id", None) is not None:
                cfo_analysis.enterprise_id = input_data.enterprise_id
            if getattr(input_data, "decision_context", None) is not None:
                store_context(rec.decision_id, input_data.decision_context, db, enterprise_id=input_data.enterprise_id)
            db.commit()
            db.refresh(cfo_analysis)
        except Exception as e:
            logger.warning("RTCO decision record creation failed: %s", e)
            db.rollback()
        # Step 5: Return response
        return CFOAnalysisOut(
            id=cfo_analysis.id,
            summary=analysis_json.get("summary", ""),
            primary_issue=analysis_json.get("primary_issue", ""),
            risks=analysis_json.get("risks", []),
            recommendations=analysis_json.get("recommendations", []),
            action_plan={
                "week": analysis_json.get("action_plan", {}).get("week", []),
                "month": analysis_json.get("action_plan", {}).get("month", []),
                "quarter": analysis_json.get("action_plan", {}).get("quarter", [])
            },
            risk_level=cfo_analysis.risk_level,
            created_at=cfo_analysis.created_at
        )
        
    except Exception as e:
        logger.error(f"Error in diagnose endpoint: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Diagnostic failed: {str(e)}")


@router.get("/analyses", response_model=List[CFOAnalysisListItem])
async def get_analyses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get paginated list of analyses."""
    try:
        offset = (page - 1) * page_size
        analyses = db.query(CFOAnalysis).order_by(CFOAnalysis.created_at.desc()).offset(offset).limit(page_size).all()
        
        return [
            CFOAnalysisListItem(
                id=a.id,
                summary=a.analysis_json.get("summary", "")[:200],  # Truncate for list view
                primary_issue=a.analysis_json.get("primary_issue", ""),
                risk_level=a.risk_level,
                created_at=a.created_at
            )
            for a in analyses
        ]
    except Exception as e:
        logger.error(f"Error fetching analyses: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyses: {str(e)}")


@router.get("/analyses/{id}", response_model=CFOAnalysisOut)
async def get_analysis(
    id: int,
    db: Session = Depends(get_db)
):
    """Get a single analysis by ID."""
    analysis = db.query(CFOAnalysis).filter(CFOAnalysis.id == id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return CFOAnalysisOut(
        id=analysis.id,
        summary=analysis.analysis_json.get("summary", ""),
        primary_issue=analysis.analysis_json.get("primary_issue", ""),
        risks=analysis.analysis_json.get("risks", []),
        recommendations=analysis.analysis_json.get("recommendations", []),
        action_plan={
            "week": analysis.analysis_json.get("action_plan", {}).get("week", []),
            "month": analysis.analysis_json.get("action_plan", {}).get("month", []),
            "quarter": analysis.analysis_json.get("action_plan", {}).get("quarter", [])
        },
        risk_level=analysis.risk_level,
        created_at=analysis.created_at
    )


@router.post("/chat", response_model=CFOChatResponse)
async def chat_with_ai_cfo(
    payload: CFOChatRequest,
    db: Session = Depends(get_db)
):
    """Lightweight chat endpoint for ad-hoc AI-CFO questions."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = payload.session_id or str(uuid4())

    try:
        reply = run_ai_cfo_chat(payload.message)

        chat_record = CFOChatMessage(
            session_id=session_id,
            user_id=payload.user_id,
            user_message=payload.message,
            ai_response=reply,
        )
        db.add(chat_record)
        db.commit()
        db.refresh(chat_record)

        return CFOChatResponse(
            session_id=session_id,
            user_message=payload.message,
            ai_response=reply,
            created_at=chat_record.created_at,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"AI-CFO chat failed: {exc}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Chat request failed")

