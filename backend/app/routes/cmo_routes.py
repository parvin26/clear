"""
CMO diagnostic and analysis routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import User, CMOAnalysis
from app.governance_engine.rtco_service import create_decision_from_analysis
from app.enterprise.decision_context_service import store_context
from app.schemas.cmo.cmo_input import CMOInputSchema
from app.schemas.cmo.cmo_analysis import CMOAnalysisSchema, CMOAnalysisResponse
from app.agents.cmo_agent import run_ai_cmo_agent
from app.utils.pagination import PaginationParams, PaginatedResponse

router = APIRouter(prefix="/api/cmo", tags=["CMO"])


@router.post("/diagnose")
async def diagnose_marketing(
    input_data: CMOInputSchema,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Run AI-CMO diagnostic analysis.
    """
    input_dict = input_data.model_dump(exclude={"enterprise_id", "decision_context"})
    analysis_result = run_ai_cmo_agent(input_dict, db)
    
    analysis_record = CMOAnalysis(
        user_id=user_id,
        enterprise_id=getattr(input_data, "enterprise_id", None),
        input_payload=input_dict,
        analysis_json=analysis_result,
        risk_level=analysis_result.get("risk_level", "yellow")
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)
    try:
        rec = create_decision_from_analysis(
            analysis_id=analysis_record.id,
            agent_domain="cmo",
            analysis_table="cmo_analyses",
            artifact_json=analysis_result,
            db=db,
        )
        db.commit()
        analysis_record.decision_id = rec.decision_id
        if getattr(input_data, "enterprise_id", None) is not None:
            analysis_record.enterprise_id = input_data.enterprise_id
        if getattr(input_data, "decision_context", None) is not None:
            store_context(rec.decision_id, input_data.decision_context, db, enterprise_id=input_data.enterprise_id)
        db.commit()
        db.refresh(analysis_record)
    except Exception:
        db.rollback()
    return {
        "id": analysis_record.id,
        "analysis": analysis_result,
        "input_payload": input_dict,
        "created_at": analysis_record.created_at
    }


@router.get("/analyses")
async def get_analyses(
    user_id: Optional[int] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get list of analyses with pagination.
    """
    query = db.query(CMOAnalysis)
    
    if user_id:
        query = query.filter(CMOAnalysis.user_id == user_id)
    
    total = query.count()
    # Convert offset/limit to page/page_size for response
    page = (offset // limit) + 1 if limit > 0 else 1
    page_size = limit
    
    analyses = query.order_by(CMOAnalysis.created_at.desc()).offset(offset).limit(limit).all()
    
    items = [
        {
            "id": a.id,
            "analysis": a.analysis_json,
            "input_payload": a.input_payload,
            "risk_level": a.risk_level,
            "created_at": a.created_at.isoformat() if hasattr(a.created_at, 'isoformat') else str(a.created_at)
        }
        for a in analyses
    ]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + limit) < total
    )


@router.get("/analyses/{analysis_id}")
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific analysis by ID.
    """
    analysis = db.query(CMOAnalysis).filter(CMOAnalysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "id": analysis.id,
        "analysis": analysis.analysis_json,
        "input_payload": analysis.input_payload,
        "risk_level": analysis.risk_level,
        "created_at": analysis.created_at
    }
