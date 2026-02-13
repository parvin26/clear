# Backfill decision_records (RTCO Phase 1)

One-time script to populate `decision_records` from existing `cfo_analyses`, `cmo_analyses`, `coo_analyses`, `cto_analyses`.

## Prerequisites

- `DATABASE_URL` set (e.g. in `backend/.env`)
- Migration `d4e5f6a7b8c9` applied (`decision_records` table exists)

## Run

From **backend** directory:

```bash
python scripts/backfill_decisions.py
```

Or with venv:

```bash
.\.venv\Scripts\python.exe scripts\backfill_decisions.py
```

## Behavior

- Skips any `(analysis_table, analysis_id)` already present in `decision_records`
- For each analysis: builds artifact via rule-based extractor, inserts one row (version=1)
- Prints counts per domain: `Backfill done: {'cfo': N, 'cmo': N, 'coo': N, 'cto': N}`

## Safe to re-run

Re-running only adds records for analyses that do not yet have a decision record.
