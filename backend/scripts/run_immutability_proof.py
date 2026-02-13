"""
Run CLEAR + RTCO immutability proof: preflight (triggers/functions) then each UPDATE/DELETE.
Each mutation must fail with a trigger error. Results update backend/docs/proofs/proof_immutability_20260208.md.
Usage: from repo root or backend: python scripts/run_immutability_proof.py
       Or: python -m scripts.run_immutability_proof (from backend with PYTHONPATH=.)
Requires: backend/.env with DATABASE_URL set.
"""
import os
import sys
from pathlib import Path

# Ensure backend is on path and load .env
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not set. Set it in backend/.env and try again.")
    sys.exit(1)

# Use SQLAlchemy so we don't require psycopg2 separately if app uses psycopg
from sqlalchemy import create_engine, text

# Proof steps: (name, sql, expected_substring_in_error)
# Each should raise an exception containing the substring
PREFLIGHT_TRIGGERS = """
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname IN (
  'forbid_update_delete_decision_ledger_events',
  'forbid_update_delete_decision_artifacts',
  'forbid_update_delete_decision_records',
  'forbid_update_delete_rtco_decision_ledger_events',
  'forbid_update_delete_rtco_decision_evidence_links',
  'forbid_update_delete_decision_context'
);
"""
PREFLIGHT_FUNCTIONS = """
SELECT proname FROM pg_proc WHERE proname IN ('clear_forbid_update_delete', 'rtco_forbid_update_delete', 'clear_forbid_update_delete_context');
"""

# Use UPDATE/DELETE that touch a real row when present, so the trigger fires.
# When table is empty, (SELECT id ... LIMIT 1) returns no row so 0 rows updated -> statement succeeds (no trigger).
PROOF_STEPS = [
    ("UPDATE decision_ledger_events", "UPDATE decision_ledger_events SET event_type = 'X' WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1)", "not allowed"),
    ("DELETE decision_ledger_events", "DELETE FROM decision_ledger_events WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1)", "not allowed"),
    ("UPDATE decision_artifacts", "UPDATE decision_artifacts SET canonical_hash = 'x' WHERE artifact_id = (SELECT artifact_id FROM decision_artifacts LIMIT 1)", "not allowed"),
    ("DELETE decision_artifacts", "DELETE FROM decision_artifacts WHERE artifact_id = (SELECT artifact_id FROM decision_artifacts LIMIT 1)", "not allowed"),
    ("UPDATE decision_context", "UPDATE decision_context SET context_json = '{}' WHERE id = (SELECT id FROM decision_context LIMIT 1)", "not allowed"),
    ("DELETE decision_context", "DELETE FROM decision_context WHERE id = (SELECT id FROM decision_context LIMIT 1)", "not allowed"),
    ("UPDATE decision_records", "UPDATE decision_records SET artifact_hash = 'x' WHERE id = (SELECT id FROM decision_records LIMIT 1)", "not allowed"),
    ("DELETE decision_records", "DELETE FROM decision_records WHERE id = (SELECT id FROM decision_records LIMIT 1)", "not allowed"),
    ("UPDATE rtco_decision_ledger_events", "UPDATE rtco_decision_ledger_events SET event_type = 'X' WHERE id = (SELECT id FROM rtco_decision_ledger_events LIMIT 1)", "not allowed"),
    ("DELETE rtco_decision_ledger_events", "DELETE FROM rtco_decision_ledger_events WHERE id = (SELECT id FROM rtco_decision_ledger_events LIMIT 1)", "not allowed"),
    ("UPDATE rtco_decision_evidence_links", "UPDATE rtco_decision_evidence_links SET source_ref = 'x' WHERE id = (SELECT id FROM rtco_decision_evidence_links LIMIT 1)", "not allowed"),
    ("DELETE rtco_decision_evidence_links", "DELETE FROM rtco_decision_evidence_links WHERE id = (SELECT id FROM rtco_decision_evidence_links LIMIT 1)", "not allowed"),
]


def main():
    # Short connect timeout so we don't hang if DB is unreachable
    connect_args = {}
    if "postgresql" in (DATABASE_URL or ""):
        connect_args["connect_timeout"] = 10
    engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT", connect_args=connect_args)
    results = {}
    preflight_ok = False

    # Preflight
    try:
        with engine.connect() as conn:
            r = conn.execute(text(PREFLIGHT_TRIGGERS))
            triggers = r.fetchall()
            r = conn.execute(text(PREFLIGHT_FUNCTIONS))
            funcs = r.fetchall()
        trigger_count = len(triggers)
        func_count = len(funcs)
        preflight_ok = trigger_count >= 6 and func_count >= 3
        print(f"Preflight: triggers={trigger_count} (expect >=6), functions={func_count} (expect >=3) -> {'PASS' if preflight_ok else 'FAIL'}")
        results["preflight"] = preflight_ok
    except Exception as e:
        print(f"Preflight failed: {e}")
        results["preflight"] = False
        # Continue to try proof steps; some tables may not exist yet
    if not preflight_ok:
        print("Preflight did not find 6 triggers and 3 functions. Migrations may not be applied. Proof steps may still run.")

    # Proof steps: each must raise
    for name, sql, expected in PROOF_STEPS:
        try:
            with engine.connect() as conn:
                conn.execute(text(sql))
            # If we get here, the statement did not raise -> fail
            print(f"  {name}: FAIL (statement succeeded; expected trigger error)")
            results[name] = False
        except Exception as e:
            err_msg = str(e).lower()
            ok = expected.lower() in err_msg or "forbid" in err_msg or "trigger" in err_msg
            results[name] = ok
            print(f"  {name}: {'PASS' if ok else 'FAIL'} (error: {err_msg[:80]}...)")

    # Update proof markdown
    proof_path = BACKEND_DIR / "docs" / "proofs" / "proof_immutability_20260208.md"
    if not proof_path.exists():
        print(f"Proof file not found: {proof_path}")
        sys.exit(0 if all(results.values()) else 1)

    with open(proof_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Map result keys to checkbox labels in the doc
    checklist = [
        ("preflight", "Preflight: triggers and functions present"),
        ("UPDATE decision_ledger_events", "UPDATE ledger: failed as expected"),
        ("DELETE decision_ledger_events", "DELETE ledger: failed as expected"),
        ("UPDATE decision_artifacts", "UPDATE artifacts: failed as expected"),
        ("DELETE decision_artifacts", "DELETE artifacts: failed as expected"),
        ("UPDATE decision_context", "UPDATE decision_context: failed as expected"),
        ("DELETE decision_context", "DELETE decision_context: failed as expected"),
        ("UPDATE decision_records", "UPDATE decision_records: failed as expected"),
        ("DELETE decision_records", "DELETE decision_records: failed as expected"),
        ("UPDATE rtco_decision_ledger_events", "UPDATE rtco_decision_ledger_events: failed as expected"),
        ("DELETE rtco_decision_ledger_events", "DELETE rtco_decision_ledger_events: failed as expected"),
        ("UPDATE rtco_decision_evidence_links", "UPDATE rtco_decision_evidence_links: failed as expected"),
        ("DELETE rtco_decision_evidence_links", "DELETE rtco_decision_evidence_links: failed as expected"),
    ]
    for key, label in checklist:
        old = f"- [ ] {label}"
        new = f"- [x] {label}" if results.get(key, False) else old
        content = content.replace(old, new)

    # Update date to today (YYYY-MM-DD)
    from datetime import date
    today = date.today().isoformat()
    content = content.replace("**Date:** 2026-02-08", f"**Date:** {today}")
    content = content.replace("**Date:** _________________", f"**Date:** {today} (script)")

    with open(proof_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nUpdated {proof_path} with results.")

    all_ok = all(results.get(k, False) for k, _ in checklist)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
