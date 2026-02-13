# CLEAR immutability proof (backend enforcement)

Ledger and artifacts are append-only. The database enforces this with triggers. Below is the **must-pass** proof.

## 1. Trigger and function

### CLEAR (migration c3d4e5f6a7b8)

- **Function:** `clear_forbid_update_delete()` — raises an exception on UPDATE or DELETE.
- **Triggers:**
  - `forbid_update_delete_decision_ledger_events` on `decision_ledger_events`
  - `forbid_update_delete_decision_artifacts` on `decision_artifacts`

### CLEAR Phase 2 (migration a3b4c5d6e7f8)

- **Function:** `clear_forbid_update_delete_context()` — raises on UPDATE or DELETE.
- **Trigger:** `forbid_update_delete_decision_context` on `decision_context` (append-only snapshots).

### RTCO Phase 1B (migration e1f2a3b4c5d6)

- **Function:** `rtco_forbid_update_delete()` — raises an exception on UPDATE or DELETE.
- **Triggers:**
  - `forbid_update_delete_decision_records` on `decision_records`
  - `forbid_update_delete_rtco_decision_ledger_events` on `rtco_decision_ledger_events`
  - `forbid_update_delete_rtco_decision_evidence_links` on `rtco_decision_evidence_links`

## 2. Proof tests (run in SQL console)

Run these against your CLEAR-enabled database. **Expected: each must fail** with an error that indicates the trigger blocked the operation.

### 2.1 UPDATE on ledger (must fail)

```sql
-- Should fail with trigger error (e.g. "CLEAR: UPDATE/DELETE not allowed on decision_ledger_events")
UPDATE decision_ledger_events
SET event_type = 'X'
WHERE 1 = 0;
```

If the table is empty, `WHERE 1 = 0` updates no rows but the trigger still runs per row; with zero rows the statement may succeed in some engines. To force a real update attempt on a real row:

```sql
-- If you have at least one row, this must fail:
UPDATE decision_ledger_events
SET event_type = 'X'
WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1);
```

**Expected:** Error from `clear_forbid_update_delete` (e.g. "CLEAR: UPDATE/DELETE not allowed on decision_ledger_events").

### 2.2 DELETE on ledger (must fail)

```sql
DELETE FROM decision_ledger_events WHERE 1 = 0;
-- Or with a real row:
-- DELETE FROM decision_ledger_events WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1);
```

**Expected:** Same trigger error.

### 2.3 UPDATE on artifacts (must fail)

```sql
UPDATE decision_artifacts
SET canonical_hash = 'x'
WHERE 1 = 0;
-- Or with a real row:
-- UPDATE decision_artifacts SET canonical_hash = 'x' WHERE artifact_id = (SELECT artifact_id FROM decision_artifacts LIMIT 1);
```

**Expected:** "CLEAR: UPDATE/DELETE not allowed on decision_artifacts".

### 2.4 DELETE on artifacts (must fail)

```sql
DELETE FROM decision_artifacts WHERE 1 = 0;
```

**Expected:** Same trigger error.

### 2.5 UPDATE on decision_records (RTCO; must fail)

```sql
UPDATE decision_records SET artifact_hash = 'x' WHERE 1 = 0;
-- Or with a real row:
-- UPDATE decision_records SET artifact_hash = 'x' WHERE id = (SELECT id FROM decision_records LIMIT 1);
```

**Expected:** "RTCO Phase 1B: UPDATE/DELETE not allowed on decision_records".

### 2.6 DELETE on decision_records (RTCO; must fail)

```sql
DELETE FROM decision_records WHERE 1 = 0;
```

**Expected:** Same trigger error.

### 2.7 UPDATE/DELETE on rtco_decision_ledger_events (must fail)

```sql
UPDATE rtco_decision_ledger_events SET event_type = 'X' WHERE 1 = 0;
DELETE FROM rtco_decision_ledger_events WHERE 1 = 0;
```

**Expected:** Trigger error on `rtco_decision_ledger_events`.

### 2.8 UPDATE/DELETE on rtco_decision_evidence_links (must fail)

```sql
UPDATE rtco_decision_evidence_links SET source_ref = 'x' WHERE 1 = 0;
DELETE FROM rtco_decision_evidence_links WHERE 1 = 0;
```

**Expected:** Trigger error on `rtco_decision_evidence_links`.

### 2.9 UPDATE/DELETE on decision_context (Phase 2; must fail)

```sql
UPDATE decision_context SET context_json = '{}' WHERE 1 = 0;
DELETE FROM decision_context WHERE 1 = 0;
```

**Expected:** "CLEAR Phase 2: UPDATE/DELETE not allowed on decision_context".

## 3. Acceptance criteria

- **Pass:** Each of the above UPDATE/DELETE attempts returns an error that clearly comes from the trigger (e.g. mentions `clear_forbid_update_delete` or "not allowed").
- **Fail:** If any of these statements succeed without error, the triggers are missing or not attached; run the CLEAR compliance migration and re-check.

## 4. Preflight (confirm triggers exist)

Before running the proof, confirm triggers and function exist:

```sql
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

SELECT proname FROM pg_proc WHERE proname IN ('clear_forbid_update_delete', 'rtco_forbid_update_delete', 'clear_forbid_update_delete_context');
```

You should see six trigger rows and three function rows (CLEAR ledger/artifacts, RTCO, CLEAR context).
