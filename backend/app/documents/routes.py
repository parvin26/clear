"""Phase 2: Document upload API (RAG + optional linkage)."""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.documents.service import document_service

router = APIRouter(prefix="/api", tags=["Documents (Phase 2)"])


class DocumentUploadBody(BaseModel):
    """POST /api/documents body."""
    domain: str  # finance | marketing | ops | tech
    title: str
    content: str
    enterprise_id: Optional[int] = None
    decision_id: Optional[UUID] = None


@router.post("/documents")
def upload_document(body: DocumentUploadBody, db: Session = Depends(get_db)):
    """Upload a document to RAG; optionally link to enterprise/decision."""
    try:
        doc = document_service.upload(
            db,
            domain=body.domain,
            title=body.title,
            content=body.content,
            enterprise_id=body.enterprise_id,
            decision_id=body.decision_id,
        )
        return {"id": doc.id, "domain": body.domain, "title": doc.title}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload failed: {e!s}")
