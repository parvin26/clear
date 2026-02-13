# CLEAR Phase 1 — Rollback + Recover Playbook (Cursor-ready)

Governance-first core stays intact. This playbook lets Cursor **detect** what was applied, **safely revert** only CLEAR additions (no legacy ExecConnect changes), and **re-apply** in a failure-tolerant order.

**Constraints:** No destructive changes to legacy tables (`*_analyses`, existing chat tables, RAG tables). Revert targets only CLEAR: enterprises, decisions, decision_artifacts, decision_ledger_events, decision_evidence_links, decision_chat_sessions, triggers, and (if present) any `decision_id` columns on chat tables. If data exists in CLEAR tables, export first — no silent drop.

---

## 1) Preflight: Detect what exists

Run in your SQL console (e.g. Supabase SQL editor, `psql`) to see what is already applied.

```sql
-- What CLEAR tables exist?
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'enterprises',
    'decisions',
    'decision_artifacts',
    'decision_ledger_events',
    'decision_evidence_links',
    'decision_chat_sessions'
  )
ORDER BY tablename;

-- What CLEAR types exist? (this codebase uses VARCHAR for event_type; enums only if you added them)
SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'clear_domain',
    'clear_size_band',
    'clear_evidence_type',
    'clear_ledger_event_type'
  );

-- Are append-only triggers installed? (actual names from this codebase)
SELECT tgname, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname IN (
  'forbid_update_delete_decision_ledger_events',
  'forbid_update_delete_decision_artifacts'
);

-- Is the trigger function present?
SELECT proname
FROM pg_proc
WHERE proname = 'clear_forbid_update_delete';

-- Did we add decision_id columns to chat tables? (current implementation uses decision_chat_sessions instead)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('cfo_chat_messages', 'cmo_chat_messages', 'coo_chat_messages', 'cto_chat_messages')
  AND column_name = 'decision_id';
```

Interpretation:

- **Tables:** If any of the six CLEAR tables appear, CLEAR migrations (or manual SQL) were applied.
- **Enums:** Empty is normal; this repo uses `VARCHAR` for event/evidence types.
- **Triggers:** If both trigger names appear, the compliance migration (c3d4e5f6a7b8) was applied.
- **decision_id on chat:** Empty is normal; chat scoping uses `decision_chat_sessions`, not columns on chat tables.

---

## 2) Safe export before revert (optional but recommended)

If CLEAR tables exist and may contain data you care about, export before dropping. Adjust paths for your OS (e.g. on Windows use a writable path; COPY runs on the DB server).

**Option A — Export to CSV (often easier than COPY on managed DBs):**

```sql
-- Run per table; export path must be writable by the DB server (or use \copy in psql for client-side)
-- Supabase / managed: use Dashboard export or a one-off export script instead of COPY.
SELECT row_to_json(t) FROM decision_ledger_events t;
SELECT row_to_json(t) FROM decision_artifacts t;
SELECT row_to_json(t) FROM decision_evidence_links t;
SELECT row_to_json(t) FROM decision_chat_sessions t;
SELECT row_to_json(t) FROM decisions t;
SELECT row_to_json(t) FROM enterprises t;
```

**Option B — COPY to file (when you have server filesystem access, e.g. local Postgres):**

```sql
COPY (SELECT row_to_json(t) FROM decision_ledger_events t) TO '/tmp/decision_ledger_events.json';
COPY (SELECT row_to_json(t) FROM decision_artifacts t) TO '/tmp/decision_artifacts.json';
COPY (SELECT row_to_json(t) FROM decision_evidence_links t) TO '/tmp/decision_evidence_links.json';
COPY (SELECT row_to_json(t) FROM decision_chat_sessions t) TO '/tmp/decision_chat_sessions.json';
COPY (SELECT row_to_json(t) FROM decisions t) TO '/tmp/decisions.json';
COPY (SELECT row_to_json(t) FROM enterprises t) TO '/tmp/enterprises.json';
```

On Windows with local Postgres you might use e.g. `'C:/temp/decision_ledger_events.json'`. If COPY is not allowed (e.g. managed DB), use the Dashboard or a small script that queries and writes JSON.

---

## 3) Revert plan (SQL) — ONLY CLEAR additions

Run in this order to avoid dependency errors. Do **not** drop or alter: `users`, `cfo_analyses`, `cmo_analyses`, `coo_analyses`, `cto_analyses`, `*_chat_messages`, `*_documents`.

### 3.1 Drop triggers and function

```sql
DROP TRIGGER IF EXISTS forbid_update_delete_decision_artifacts ON decision_artifacts;
DROP TRIGGER IF EXISTS forbid_update_delete_decision_ledger_events ON decision_ledger_events;
DROP FUNCTION IF EXISTS clear_forbid_update_delete();
```

### 3.2 Remove chat decision_id columns (only if you added them)

Skip this if you never added `decision_id` to chat tables (current implementation uses `decision_chat_sessions`).

```sql
ALTER TABLE IF EXISTS cfo_chat_messages DROP COLUMN IF EXISTS decision_id;
ALTER TABLE IF EXISTS cmo_chat_messages DROP COLUMN IF EXISTS decision_id;
ALTER TABLE IF EXISTS coo_chat_messages DROP COLUMN IF EXISTS decision_id;
ALTER TABLE IF EXISTS cto_chat_messages DROP COLUMN IF EXISTS decision_id;

DROP INDEX IF EXISTS idx_cfo_chat_decision;
DROP INDEX IF EXISTS idx_cmo_chat_decision;
DROP INDEX IF EXISTS idx_coo_chat_decision;
DROP INDEX IF EXISTS idx_cto_chat_decision;
```

### 3.3 Drop CLEAR tables (children first, then parents)

Order matters: drop tables that reference others first.

```sql
-- Child tables first (depend on decisions / decision_artifacts)
DROP TABLE IF EXISTS decision_chat_sessions;
DROP TABLE IF EXISTS decision_evidence_links;
DROP TABLE IF EXISTS decision_ledger_events;
DROP TABLE IF EXISTS decision_artifacts;
DROP TABLE IF EXISTS decisions;
DROP TABLE IF EXISTS enterprises;
```

### 3.4 Drop enums (only if they exist and nothing else uses them)

This codebase does not create these enums; run only if you added them separately.

```sql
DROP TYPE IF EXISTS clear_ledger_event_type CASCADE;
DROP TYPE IF EXISTS clear_evidence_type CASCADE;
DROP TYPE IF EXISTS clear_size_band CASCADE;
DROP TYPE IF EXISTS clear_domain CASCADE;
```

After 3.1–3.4, the schema should be back to pre-CLEAR. Legacy ExecConnect tables are unchanged.

---

## 4) Re-apply plan (failure-tolerant sequence)

Re-apply CLEAR in an order that reduces trigger and FK issues.

### 4.1 Option A — Re-apply via Alembic (recommended)

1. **Stamp back** so Alembic thinks CLEAR migrations are not applied (only if you reverted with SQL and want to re-run the same migrations):

   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   python -c "from alembic.config import main; main(argv=['stamp', 'a1b2c3d4e5f6'])"
   ```

   That sets the revision to the one *before* CLEAR (`a1b2c3d4e5f6`).

2. **Run CLEAR migrations again:**

   ```powershell
   python -c "from alembic.config import main; main(argv=['upgrade', 'head'])"
   ```

   This recreates enterprises → decisions → decision_ledger_events → decision_evidence_links → decision_chat_sessions (b2c3d4e5f6a7), then decision_artifacts, source_ref, version_id, and triggers (c3d4e5f6a7b8).

### 4.2 Option B — Re-apply manually (enums → tables → triggers last)

Use this if you are applying CLEAR without Alembic or need to avoid triggers until routes are stable.

**4.2.1 Enums first (idempotent)**  
Only if you use PostgreSQL enums; this repo uses VARCHAR, so you can skip.

```sql
-- Example if you introduce enums later:
-- CREATE TYPE clear_ledger_event_type AS ENUM ('DECISION_INITIATED', 'ARTIFACT_DRAFT_CREATED', ...);
-- Add values later: ALTER TYPE clear_ledger_event_type ADD VALUE IF NOT EXISTS 'OUTCOME_CAPTURED';
```

**4.2.2 Create tables (no triggers yet)**  
Create in dependency order: enterprises → decisions → decision_ledger_events (without version_id if you do it in two steps) → decision_evidence_links → decision_chat_sessions, then decision_artifacts and add version_id to decision_ledger_events. Use the same definitions as in:

- `alembic/versions/b2c3d4e5f6a7_clear_phase1_governance_tables.py`
- `alembic/versions/c3d4e5f6a7b8_clear_compliance_artifacts_source_ref_triggers.py`

**4.2.3 Add triggers last**  
After tables exist and inserts work:

```sql
CREATE OR REPLACE FUNCTION clear_forbid_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CLEAR: UPDATE/DELETE not allowed on %. Use append-only semantics.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forbid_update_delete_decision_ledger_events
BEFORE UPDATE OR DELETE ON decision_ledger_events
FOR EACH ROW EXECUTE PROCEDURE clear_forbid_update_delete();

CREATE TRIGGER forbid_update_delete_decision_artifacts
BEFORE UPDATE OR DELETE ON decision_artifacts
FOR EACH ROW EXECUTE PROCEDURE clear_forbid_update_delete();
```

**4.2.4 Sanity check after tables + triggers**  
```sql
INSERT INTO enterprises (name, sector, geography, operating_model, size_band)
VALUES ('test', 'test', 'test', 'test', 'test')
RETURNING id;
-- Then delete if desired: DELETE FROM enterprises WHERE name = 'test';
```

**4.2.5 Chat scoping**  
Current design uses `decision_chat_sessions` (created with CLEAR tables). If you later add `decision_id` to chat tables, do that only after `decisions` exists and routes are stable to avoid FK issues.

---

## 5) Cursor code revert guidance (repo-level)

If CLEAR-related code is broken and you want to remove only CLEAR additions:

### Remove (additive CLEAR only)

- **Routes:** `backend/app/routes/clear_routes.py`
- **Governance:** `backend/app/governance/` (entire package: `ledger_service.py`, `validator.py`, `canonicalize.py`, `bootstrap.py`, `__init__.py`)
- **Schemas:** `backend/app/schemas/clear/` (entire package)
- **Models:** In `backend/app/db/models.py`, remove only the CLEAR model classes: `Enterprise`, `Decision`, `DecisionArtifact`, `DecisionLedgerEvent`, `DecisionEvidenceLink`, `DecisionChatSession`, and the CLEAR relationship attributes on `Decision` / `Enterprise`.
- **Main:** In `backend/app/main.py`, remove the `clear_routes` import and `app.include_router(clear_routes.router)`.
- **Migrations:** Do **not** delete migration files; revert the DB with Section 3 and optionally stamp (Section 4.1). If you must remove migration files, remove only the CLEAR ones and fix `down_revision` of any later migration.

Do **not** remove or alter: `app/routes/cfo_routes.py`, `cmo_*`, `coo_*`, `cto_*`, `health.py`, `app/agents/`, `app/tools/`, `app/rag/`, `app/db/models.py` (legacy models), or `app/schemas/cfo/`, etc.

### Re-add order (when reintroducing CLEAR)

1. **DB + models:** Run CLEAR migrations (or apply SQL); ensure CLEAR models are back in `app/db/models.py`.
2. **Canonicalization + validator:** Restore `app/governance/canonicalize.py` and `app/governance/validator.py`, then `ledger_service.py` and `bootstrap.py`.
3. **Schemas:** Restore `app/schemas/clear/`.
4. **Routes:** Restore `app/routes/clear_routes.py` and register in `main.py`.
5. **Chat scoping:** Already covered by `decision_chat_sessions` and PUT `/api/clear/decisions/{id}/chat-session`; no change to legacy chat routes unless you add `decision_id` columns later.

---

## 6) “Most common failure” fixes (quick)

| Issue | Fix |
|-------|-----|
| **Enum already exists / value exists** | Use `ADD VALUE IF NOT EXISTS` when adding enum values, or use VARCHAR (as in this repo) and avoid enums. |
| **Trigger prevents updates during debugging** | Install triggers only after routes and inserts are stable (Section 4.2.3). Temporarily drop triggers with Section 3.1 if you need to fix data; re-create with 4.2.3. |
| **FK failures on chat decision_id** | This repo uses `decision_chat_sessions`; no FK from chat message tables. If you add `decision_id` to chat tables, add those columns only after `decisions` exists and is stable. |
| **Hash mismatches** | Run canonicalization and hashing server-side only (`app/governance/canonicalize.py`); never accept or trust a client-supplied hash. |
| **Supersedes drift** | Do not accept `supersedes_version_id` from the client as authority; compute it in the service from the latest artifact version for that decision. |
| **Alembic “can’t find revision”** | After a manual SQL revert, run `alembic stamp <revision>` to sync the DB revision (e.g. `stamp a1b2c3d4e5f6` before re-running CLEAR migrations). |
| **PowerShell: alembic not found** | Use venv and `python -c "from alembic.config import main; main(argv=['upgrade','head'])"` (see `MIGRATION_WINDOWS_POWERSHELL.md`). |

---

## Summary checklist

- [ ] Run **Section 1** (preflight) and note which CLEAR objects exist.
- [ ] If CLEAR tables have data, run **Section 2** (export) before revert.
- [ ] Revert: **3.1** triggers/function → **3.2** chat `decision_id` (if present) → **3.3** CLEAR tables → **3.4** enums (if present).
- [ ] Re-apply: use **Section 4.1** (Alembic) or **4.2** (manual SQL with triggers last).
- [ ] If reverting code, remove only CLEAR routes, governance, schemas, and CLEAR model bits; re-add in the order in **Section 5**.

Legacy ExecConnect (*_analyses, chat messages, RAG documents, users) is never dropped or altered by this playbook.
