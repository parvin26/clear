"""
Retrieve curated knowledge snippets for synthesis/chat (RAG). No autonomous ingestion.
Populate knowledge_chunks via offline script or manual ingest.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import KnowledgeChunk
from app.rag.vectorstore import get_embedding


def retrieve_knowledge_snippets(
    primary_domain: str,
    industry: str | None = None,
    country: str | None = None,
    topic_keywords: list[str] | None = None,
    db: Session | None = None,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    Return top K short snippets (1–3 sentences) from knowledge_chunks.
    Builds search from domain + industry + country + topic_keywords.
    Uses vector similarity when embedding is available; else tag match.
    """
    if not db:
        return []
    domain_label = {"cfo": "finance", "cmo": "growth", "coo": "operations", "cto": "technology"}.get(primary_domain, "general")
    query_parts = [domain_label]
    if industry:
        query_parts.append(industry)
    if country:
        query_parts.append(country)
    if topic_keywords:
        query_parts.extend(topic_keywords[:5])
    query_text = " ".join(query_parts)

    try:
        if getattr(settings, "RAG_ENABLED", False):
            query_embedding = get_embedding(query_text)
            if query_embedding:
                embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
                conn = db.connection().connection
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, source_type, title, content, tags
                        FROM knowledge_chunks
                        WHERE embedding IS NOT NULL
                        ORDER BY embedding <=> %s::vector
                        LIMIT %s
                    """, (embedding_str, top_k))
                    rows = cursor.fetchall()
                snippets = []
                for row in rows:
                    _id, source_type, title, content, tags = row[0], row[1], row[2], row[3], row[4]
                    text = (content or "")[:500].strip()
                    if not text:
                        continue
                    snippets.append({"id": _id, "source_type": source_type or "", "title": title or "", "content": text, "tags": tags or []})
                return snippets
        chunks = db.query(KnowledgeChunk).limit(top_k * 2).all()
        out = []
        for c in chunks:
            text = (c.content or "")[:500].strip()
            if text:
                out.append({"id": c.id, "source_type": c.source_type or "", "title": c.title or "", "content": text, "tags": (c.tags or [])})
            if len(out) >= top_k:
                break
        return out
    except Exception:
        return []
