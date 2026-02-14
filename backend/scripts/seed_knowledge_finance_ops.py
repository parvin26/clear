"""
Seed knowledge_chunks with finance and ops content for the ICP wedge (cash and execution discipline, 5-100 person SMEs, Malaysia/SEA).
Run from backend: python -m scripts.seed_knowledge_finance_ops (or with full path).
"""
import os
import sys

# Ensure app is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import KnowledgeChunk
from app.rag.vectorstore import get_embedding


CHUNKS = [
    {
        "source_type": "framework",
        "title": "Cash flow basics for SMEs",
        "content": "Track cash in and out weekly. Know your runway: months of cash left at current burn. Separate business and personal accounts. Invoice promptly and follow up on receivables; agree clear payment terms with suppliers.",
        "tags": ["finance", "cash", "runway", "SME", "Malaysia", "SEA"],
    },
    {
        "source_type": "framework",
        "title": "Working capital and collections (SEA)",
        "content": "In Malaysia and many SEA markets, 30–60 day payment terms are common. Improve collections by sending reminders before due date, offering early-payment discount where possible, and tracking DSO (days sales outstanding) by customer.",
        "tags": ["finance", "working capital", "collections", "Malaysia", "SEA", "DSO"],
    },
    {
        "source_type": "article",
        "title": "Simple ops cadence for founder-led teams",
        "content": "A short weekly ops review (30 minutes) helps: what shipped, what slipped, what’s blocking. One owner per area. Document the top 3–5 processes first; avoid heavy bureaucracy. Focus on on-time delivery and defect reduction.",
        "tags": ["operations", "cadence", "SME", "process", "on-time delivery"],
    },
    {
        "source_type": "framework",
        "title": "Inventory and stock basics",
        "content": "Match stock levels to demand: avoid over-ordering and stockouts. Simple reorder points and safety stock for key items. Count critical items regularly. For F&B and retail, wastage and expiry matter: track and reduce.",
        "tags": ["operations", "inventory", "retail", "F&B", "SME"],
    },
    {
        "source_type": "article",
        "title": "Runway and burn for small teams",
        "content": "Runway = cash on hand divided by monthly net burn. Aim for at least 6 months for stability; 12+ when planning growth. Cut non-essential spend first; then improve revenue and payment timing. Review weekly.",
        "tags": ["finance", "runway", "burn", "SME", "cash"],
    },
    {
        "source_type": "framework",
        "title": "Basic SOPs without bureaucracy",
        "content": "Document the steps that cause most errors or delays. One page per process. Assign an owner. Review quarterly. Use checklists for handoffs. Keep it simple so the team actually uses it.",
        "tags": ["operations", "SOP", "process", "SME", "quality"],
    },
    {
        "source_type": "article",
        "title": "Bank and financing relationships (Malaysia)",
        "content": "Build a relationship with your business bank: regular contact, clear financials, and a simple funding pack (P&amp;L, cash flow, key metrics) when you need working capital or facilities. Many banks offer SME programmes.",
        "tags": ["finance", "Malaysia", "banking", "SME", "working capital"],
    },
    {
        "source_type": "framework",
        "title": "On-time delivery and reliability",
        "content": "Reliability builds trust. Measure on-time delivery (OTD) as a percentage. Fix the top 2 causes of delay first. Align capacity with demand; avoid overcommitment. Communicate early if a date will slip.",
        "tags": ["operations", "on-time delivery", "reliability", "SME"],
    },
    # Sector/geo extension (Phase 2.1)
    {
        "source_type": "article",
        "title": "F&B wastage and cost control",
        "content": "In F&B, wastage directly hits margin. Track portion control, expiry, and spoilage. Simple daily counts for high-value items. Link purchases to sales to spot leakage. Malaysia and SEA: halal and storage conditions matter for compliance.",
        "tags": ["operations", "F&B", "wastage", "SME", "Malaysia", "SEA"],
    },
    {
        "source_type": "framework",
        "title": "Logistics last-mile basics",
        "content": "Last-mile delivery: route planning, driver capacity, and proof of delivery. Start with a simple checklist per delivery; track on-time % and complaints. Consolidate trips where possible. Slip windows (e.g. 2-hour) help manage expectations.",
        "tags": ["operations", "logistics", "delivery", "SME", "on-time delivery"],
    },
    {
        "source_type": "article",
        "title": "Clinic and healthcare ops (multi-outlet)",
        "content": "Multi-outlet clinics: consistent patient experience and clinical standards across sites. One-page SOPs for booking, intake, and discharge. Track key metrics per outlet (wait time, no-show rate). Centralise scheduling where possible.",
        "tags": ["operations", "healthcare", "clinic", "SME", "process", "SEA"],
    },
    {
        "source_type": "framework",
        "title": "Investor readiness one-pager",
        "content": "Before approaching investors: one-page summary with problem, solution, traction, team, ask. Clear numbers: revenue, burn, runway. Have a simple data room: P&L, cash flow, cap table. Practice a 5-minute pitch.",
        "tags": ["finance", "investor", "readiness", "SME", "pitch"],
    },
    {
        "source_type": "article",
        "title": "Singapore SME grants and support",
        "content": "Singapore offers grants and schemes for SMEs: productivity, digitalisation, capability development. Check Enterprise Singapore and sector-specific programmes. Keep records and KPIs; many grants require proof of improvement.",
        "tags": ["finance", "Singapore", "grants", "SME", "government"],
    },
    {
        "source_type": "article",
        "title": "Indonesia SME banking and KUR",
        "content": "In Indonesia, KUR (Kredit Usaha Rakyat) and other programmes support SMEs. Build a relationship with a bank that serves your sector. Prepare simple financials and a clear use of funds. Payment culture and collateral requirements vary by region.",
        "tags": ["finance", "Indonesia", "banking", "SME", "KUR"],
    },
]


def seed(db: Session) -> int:
    count = 0
    for c in CHUNKS:
        existing = db.query(KnowledgeChunk).filter(
            KnowledgeChunk.title == c["title"],
            KnowledgeChunk.source_type == c["source_type"],
        ).first()
        if existing:
            continue
        chunk = KnowledgeChunk(
            source_type=c["source_type"],
            title=c["title"],
            content=c["content"],
            tags=c["tags"],
        )
        db.add(chunk)
        db.flush()
        try:
            emb = get_embedding(c["content"][:8000])
            if emb:
                chunk.embedding = emb
        except Exception:
            pass
        count += 1
    db.commit()
    return count


def main():
    db = SessionLocal()
    try:
        n = seed(db)
        print(f"Inserted {n} knowledge chunks (finance/ops wedge).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
