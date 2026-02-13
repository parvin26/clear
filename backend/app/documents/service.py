"""Phase 2: Document upload — call existing RAG upsert; optionally store document_link."""
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.rag.vectorstore import (
    upsert_finance_document,
    upsert_marketing_document,
    upsert_ops_document,
    upsert_tech_document,
)
from app.db.models import DocumentLink

_DOMAIN_TABLE = {
    "finance": ("finance_documents", upsert_finance_document),
    "marketing": ("marketing_documents", upsert_marketing_document),
    "ops": ("ops_documents", upsert_ops_document),
    "tech": ("tech_documents", upsert_tech_document),
}


class DocumentService:
    @staticmethod
    def upload(
        db: Session,
        domain: str,
        title: str,
        content: str,
        enterprise_id: Optional[int] = None,
        decision_id: Optional[UUID] = None,
    ):
        """Upsert document into RAG for domain; optionally create document_link."""
        domain_lower = (domain or "").lower()
        if domain_lower not in _DOMAIN_TABLE:
            raise ValueError(f"domain must be one of: finance, marketing, ops, tech; got {domain!r}")
        table_name, upsert_fn = _DOMAIN_TABLE[domain_lower]
        doc = upsert_fn(db, title, content)
        if enterprise_id is not None or decision_id is not None:
            link = DocumentLink(
                doc_table=table_name,
                doc_id=doc.id,
                enterprise_id=enterprise_id,
                decision_id=decision_id,
            )
            db.add(link)
            db.commit()
        return doc


document_service = DocumentService()
