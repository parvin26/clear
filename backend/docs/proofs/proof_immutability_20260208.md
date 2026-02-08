# Proof: CLEAR immutability (trigger enforcement)

**Date:** 2026-02-08  
**Reference:** `backend/docs/CLEAR_IMMUTABILITY_PROOF.md`

## Scope

Database triggers must block UPDATE and DELETE on:

- `decision_ledger_events`
- `decision_artifacts`

## Preflight (triggers and function present)

Run before the proof:

```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname IN (
  'forbid_update_delete_decision_ledger_events',
  'forbid_update_delete_decision_artifacts'
);

SELECT proname FROM pg_proc WHERE proname = 'clear_forbid_update_delete';
```

**Expected:** Two trigger rows, one function row.

## Proof tests (each must fail)

1. **UPDATE decision_ledger_events** — e.g. `UPDATE decision_ledger_events SET event_type = 'X' WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1);`  
   **Expected:** Error from `clear_forbid_update_delete` (e.g. "CLEAR: UPDATE/DELETE not allowed on decision_ledger_events").

2. **DELETE decision_ledger_events** — e.g. `DELETE FROM decision_ledger_events WHERE 1 = 0;`  
   **Expected:** Same trigger error.

3. **UPDATE decision_artifacts** — e.g. `UPDATE decision_artifacts SET canonical_hash = 'x' WHERE 1 = 0;`  
   **Expected:** "CLEAR: UPDATE/DELETE not allowed on decision_artifacts".

4. **DELETE decision_artifacts** — e.g. `DELETE FROM decision_artifacts WHERE 1 = 0;`  
   **Expected:** Same trigger error.

## Result (to be filled when run)

- [ ] Preflight: triggers and function present  
- [ ] UPDATE ledger: failed as expected  
- [ ] DELETE ledger: failed as expected  
- [ ] UPDATE artifacts: failed as expected  
- [ ] DELETE artifacts: failed as expected  

**Signed:** _________________ **Date:** _________________

Run the SQL in `CLEAR_IMMUTABILITY_PROOF.md` against your CLEAR-enabled database and check the boxes above when each step fails as expected. Keep this file (or a copy with results/screenshot) as the immutability proof record.
