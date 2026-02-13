"""
Demo: Create decision → attach one agent analysis → try finalize without constraints/sign-off → show ledger.

Run from backend dir: python scripts/demo_decision_finalize_and_ledger.py
Requires: DATABASE_URL in .env, migrations applied (CLEAR tables exist).
"""
import os
import sys
from pathlib import Path

# Ensure backend is on path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, init_db
from app.db.models import CFOAnalysis, Decision, DecisionLedgerEvent, DecisionEvidenceLink
from app.governance.ledger_service import (
    create_decision,
    finalize_decision,
    get_latest_artifact_for_decision,
    _derive_status_from_ledger,
    LedgerServiceError,
)
from app.governance.bootstrap import create_draft_from_analysis


def main():
    db: Session = SessionLocal()
    try:
        # 1) Get or create one CFO analysis so we can attach it
        analysis = db.query(CFOAnalysis).first()
        if not analysis:
            # Create a minimal analysis so we have something to link
            analysis = CFOAnalysis(
                user_id=None,
                input_payload={"biggest_challenge": "cash_flow_management"},
                analysis_json={
                    "summary": "Demo analysis for CLEAR evidence.",
                    "primary_issue": "Cash flow.",
                    "risks": [],
                    "recommendations": [],
                    "action_plan": {"week": [], "month": [], "quarter": []},
                    "risk_level": "yellow",
                },
                risk_level="yellow",
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            print(f"Created CFO analysis id={analysis.id}")
        else:
            print(f"Using existing CFO analysis id={analysis.id}")

        # 2) Create decision and attach that analysis (bootstrap creates decision + draft artifact + evidence link)
        decision = create_draft_from_analysis(
            db,
            domain="cfo",
            analysis_id=analysis.id,
            enterprise_id=None,
            actor_id="demo",
            actor_role="script",
        )
        decision_id = decision.decision_id
        print(f"Created decision: {decision_id}")

        # 3) Try to finalize without satisfying constraints (bootstrap artifact has 1 placeholder constraint and 2 options;
        #    to force failure we could add an artifact with 0 constraints via API - here we try finalize as-is first)
        #    Actually bootstrap artifact has 1 constraint and 2 options so it might pass. Overwrite by appending a new
        #    artifact version with empty constraints so finalize fails.
        from app.governance.ledger_service import append_artifact_created

        bad_artifact = {
            "problem_statement": "Demo: try finalize without proper constraints.",
            "decision_context": {"domain": "cfo"},
            "constraints": [],  # fail: at least one required
            "options_considered": [
                {"id": "o1", "title": "Option A", "summary": "A"},
                {"id": "o2", "title": "Option B", "summary": "B"},
            ],
            "chosen_option_id": "o1",
            "rationale": "Demo.",
            "risk_level": "yellow",
        }
        append_artifact_created(db, decision_id=decision_id, artifact=bad_artifact, actor_id="demo", actor_role="script")
        print("Appended artifact version with empty constraints (so finalize will fail).")

        # 4) Try finalize (expect 400 / LedgerServiceError)
        try:
            finalize_decision(db, decision_id, actor_id="demo", actor_role="script")
            print("Finalize: unexpectedly succeeded.")
        except LedgerServiceError as e:
            print(f"Finalize (blocked as expected): {e}")

        # 5) Ledger output
        events = (
            db.query(DecisionLedgerEvent)
            .filter(DecisionLedgerEvent.decision_id == decision_id)
            .order_by(DecisionLedgerEvent.created_at)
            .all()
        )
        print("\n--- Ledger output ---")
        for ev in events:
            print(f"  {ev.created_at.isoformat()}  {ev.event_type}  event_id={ev.event_id}")
            if ev.version_id:
                print(f"    version_id={ev.version_id}")
            if ev.payload:
                print(f"    payload={ev.payload}")
            if ev.actor_id:
                print(f"    actor_id={ev.actor_id}")
        print(f"\nTotal events: {len(events)}")
        print(f"Derived status: {_derive_status_from_ledger(db, decision_id)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
