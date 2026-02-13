"""
RTCO Phase 1: one-time backfill of decision_records from existing *_analyses.
Run from backend: python scripts/backfill_decisions.py
Requires .env with DATABASE_URL (or run from backend after load_dotenv).
"""
import os
import sys
from pathlib import Path

# Ensure backend is on path and .env is loaded
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
except ImportError:
    pass

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import CFOAnalysis, CMOAnalysis, COOAnalysis, CTOAnalysis, DecisionRecord
from app.governance_engine.rtco_service import create_decision_from_analysis


def existing_record_ids(db: Session) -> set[tuple[str, int]]:
    """Set of (analysis_table, analysis_id) already in decision_records."""
    rows = db.query(DecisionRecord.analysis_table, DecisionRecord.analysis_id).distinct().all()
    return {(r.analysis_table, r.analysis_id) for r in rows}


def backfill(db: Session) -> dict[str, int]:
    counts = {"cfo": 0, "cmo": 0, "coo": 0, "cto": 0}
    existing = existing_record_ids(db)
    for model, table, domain in [
        (CFOAnalysis, "cfo_analyses", "cfo"),
        (CMOAnalysis, "cmo_analyses", "cmo"),
        (COOAnalysis, "coo_analyses", "coo"),
        (CTOAnalysis, "cto_analyses", "cto"),
    ]:
        for analysis in db.query(model).order_by(model.id):
            key = (table, analysis.id)
            if key in existing:
                continue
            try:
                create_decision_from_analysis(
                    analysis_id=analysis.id,
                    agent_domain=domain,
                    analysis_table=table,
                    artifact_json=analysis.analysis_json or {},
                    db=db,
                )
                db.commit()
                counts[domain] += 1
            except Exception as e:
                print(f"Skip {table} id={analysis.id}: {e}")
                db.rollback()
    return counts


def main():
    if not os.environ.get("DATABASE_URL"):
        print("ERROR: DATABASE_URL not set. Set it or run from backend with .env.")
        sys.exit(1)
    db = SessionLocal()
    try:
        counts = backfill(db)
        print("Backfill done:", counts)
    finally:
        db.close()


if __name__ == "__main__":
    main()
