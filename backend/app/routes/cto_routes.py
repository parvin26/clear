"""
CTO diagnostic routes.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import CTOAnalysis, User
from app.governance_engine.rtco_service import create_decision_from_analysis
from app.enterprise.decision_context_service import store_context
from app.schemas.cto.cto_input import CTOInputSchema
from app.schemas.cto.cto_analysis import CTOAnalysisSchema, CTOAnalysisResponse
from app.tools.tech_tools import calculate_all_tools
from app.rag.vectorstore import search_tech_docs
from app.agents.cto_agent import run_ai_cto_agent
from app.utils.pagination import PaginationParams, PaginatedResponse
import json

router = APIRouter(prefix="/api/cto", tags=["CTO"])


def get_or_create_user(db: Session, email: str, name: str = "Anonymous") -> User:
    """Get existing user or create new one."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/diagnose", response_model=CTOAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def diagnose_technology(
    input_data: CTOInputSchema,
    user_email: str = "user@example.com",
    user_name: str = "User",
    db: Session = Depends(get_db)
):
    """
    Run CTO diagnostic analysis.
    """
    try:
        user = get_or_create_user(db, user_email, user_name)
        input_dict = input_data.model_dump(exclude={"enterprise_id", "decision_context"})
        tools_results = calculate_all_tools(input_dict)
        
        rag_context = []
        try:
            query_text = f"{input_data.biggest_challenge} {input_data.tech_stack_maturity} {input_data.notes or ''}"
            rag_context = search_tech_docs(db, query_text, top_k=4)
        except Exception as e:
            print(f"RAG search error (non-critical): {e}")
        
        analysis_data = run_ai_cto_agent(input_dict, tools_results, rag_context)
        
        analysis = CTOAnalysis(
            user_id=user.id,
            enterprise_id=getattr(input_data, "enterprise_id", None),
            input_payload=input_dict,
            analysis_json=analysis_data,
            risk_level=analysis_data.get("risk_level", tools_results.get("risk_level", "medium"))
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        try:
            rec = create_decision_from_analysis(
                analysis_id=analysis.id,
                agent_domain="cto",
                analysis_table="cto_analyses",
                artifact_json=analysis_data,
                db=db,
            )
            db.commit()
            analysis.decision_id = rec.decision_id
            if getattr(input_data, "enterprise_id", None) is not None:
                analysis.enterprise_id = input_data.enterprise_id
            if getattr(input_data, "decision_context", None) is not None:
                store_context(rec.decision_id, input_data.decision_context, db, enterprise_id=input_data.enterprise_id)
            db.commit()
            db.refresh(analysis)
        except Exception:
            db.rollback()
        analysis_schema = CTOAnalysisSchema(**analysis_data)
        
        return CTOAnalysisResponse(
            id=analysis.id,
            user_id=user.id,
            analysis=analysis_schema,
            created_at=analysis.created_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running diagnostic: {str(e)}"
        )


@router.get("/analyses", response_model=PaginatedResponse[CTOAnalysisResponse])
async def get_analyses(
    pagination: PaginationParams = Depends(),
    user_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of CTO analyses with pagination.
    """
    query = db.query(CTOAnalysis)
    
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            query = query.filter(CTOAnalysis.user_id == user.id)
    
    total = query.count()
    analyses = query.order_by(desc(CTOAnalysis.created_at)).offset(pagination.skip).limit(pagination.limit).all()
    
    items = []
    for analysis in analyses:
        try:
            analysis_schema = CTOAnalysisSchema(**analysis.analysis_json)
            items.append(CTOAnalysisResponse(
                id=analysis.id,
                user_id=analysis.user_id,
                analysis=analysis_schema,
                created_at=analysis.created_at
            ))
        except Exception as e:
            print(f"Error parsing analysis {analysis.id}: {e}")
            continue
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )


@router.get("/analyses/{analysis_id}", response_model=CTOAnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific CTO analysis by ID.
    """
    analysis = db.query(CTOAnalysis).filter(CTOAnalysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found"
        )
    
    try:
        analysis_schema = CTOAnalysisSchema(**analysis.analysis_json)
        return CTOAnalysisResponse(
            id=analysis.id,
            user_id=analysis.user_id,
            analysis=analysis_schema,
            created_at=analysis.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing analysis: {str(e)}"
        )
