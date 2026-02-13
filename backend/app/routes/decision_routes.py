"""
RTCO Phase 1: read-only decision APIs. List/detail/versions from decision_records.
No auth required yet. Reuses list/detail patterns from /analyses.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import DecisionRecord

router = APIRouter(prefix="/api", tags=["Decisions"])


@router.get("/decisions")
def list_decisions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    agent_domain: str | None = Query(None, description="Filter by cfo|cmo|coo|cto"),
    db: Session = Depends(get_db),
):
    """Paginated list of decision records (latest first)."""
    q = db.query(DecisionRecord).order_by(desc(DecisionRecord.created_at))
    if agent_domain:
        q = q.filter(DecisionRecord.agent_domain == agent_domain.lower())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": r.id,
                "decision_id": str(r.decision_id),
                "version": r.version,
                "agent_domain": r.agent_domain,
                "analysis_table": r.analysis_table,
                "analysis_id": r.analysis_id,
                "artifact_json": r.artifact_json,
                "created_at": r.created_at,
            }
            for r in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/decisions/{decision_id}")
def get_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
):
    """Latest version of a decision by decision_id (uuid)."""
    rec = (
        db.query(DecisionRecord)
        .filter(DecisionRecord.decision_id == decision_id)
        .order_by(desc(DecisionRecord.version))
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {
        "id": rec.id,
        "decision_id": str(rec.decision_id),
        "version": rec.version,
        "agent_domain": rec.agent_domain,
        "analysis_table": rec.analysis_table,
        "analysis_id": rec.analysis_id,
        "artifact_json": rec.artifact_json,
        "created_at": rec.created_at,
        "supersedes_id": rec.supersedes_id,
    }


@router.get("/decisions/{decision_id}/versions")
def get_decision_versions(
    decision_id: UUID,
    db: Session = Depends(get_db),
):
    """All versions of a decision (same decision_id), ordered by version desc."""
    recs = (
        db.query(DecisionRecord)
        .filter(DecisionRecord.decision_id == decision_id)
        .order_by(desc(DecisionRecord.version))
        .all()
    )
    if not recs:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {
        "decision_id": str(decision_id),
        "versions": [
            {
                "id": r.id,
                "version": r.version,
                "agent_domain": r.agent_domain,
                "analysis_table": r.analysis_table,
                "analysis_id": r.analysis_id,
                "artifact_json": r.artifact_json,
                "created_at": r.created_at,
                "supersedes_id": r.supersedes_id,
            }
            for r in recs
        ],
    }
