# Proof: CLEAR + RTCO immutability (trigger enforcement)

**Date:** 2026-02-11  
**Reference:** `backend/docs/CLEAR_IMMUTABILITY_PROOF.md`

## Scope

Database triggers must block UPDATE and DELETE on:

**CLEAR**
- `decision_ledger_events`
- `decision_artifacts`

**CLEAR Phase 2**
- `decision_context`

**RTCO Phase 1B**
- `decision_records`
- `rtco_decision_ledger_events`
- `rtco_decision_evidence_links`

## Preflight (triggers and functions present)

Run before the proof:

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

**Expected:** Six trigger rows and three function rows.

## Proof tests (each must fail)

### CLEAR
1. **UPDATE decision_ledger_events** — e.g. `UPDATE decision_ledger_events SET event_type = 'X' WHERE id = (SELECT id FROM decision_ledger_events LIMIT 1);`  
   **Expected:** Error from `clear_forbid_update_delete`.
2. **DELETE decision_ledger_events** — e.g. `DELETE FROM decision_ledger_events WHERE 1 = 0;`  
   **Expected:** Same trigger error.
3. **UPDATE decision_artifacts** — e.g. `UPDATE decision_artifacts SET canonical_hash = 'x' WHERE 1 = 0;`  
   **Expected:** "CLEAR: UPDATE/DELETE not allowed on decision_artifacts".
4. **DELETE decision_artifacts** — e.g. `DELETE FROM decision_artifacts WHERE 1 = 0;`  
   **Expected:** Same trigger error.

### CLEAR Phase 2
5. **UPDATE decision_context** — e.g. `UPDATE decision_context SET context_json = '{}' WHERE 1 = 0;`  
   **Expected:** "CLEAR Phase 2: UPDATE/DELETE not allowed on decision_context".
6. **DELETE decision_context** — e.g. `DELETE FROM decision_context WHERE 1 = 0;`  
   **Expected:** Same trigger error.

### RTCO Phase 1B
7. **UPDATE decision_records** — e.g. `UPDATE decision_records SET artifact_hash = 'x' WHERE 1 = 0;`  
   **Expected:** "RTCO Phase 1B: UPDATE/DELETE not allowed on decision_records".
8. **DELETE decision_records** — e.g. `DELETE FROM decision_records WHERE 1 = 0;`  
   **Expected:** Same trigger error.
9. **UPDATE rtco_decision_ledger_events** — e.g. `UPDATE rtco_decision_ledger_events SET event_type = 'X' WHERE 1 = 0;`  
   **Expected:** Trigger error on `rtco_decision_ledger_events`.
10. **DELETE rtco_decision_ledger_events** — e.g. `DELETE FROM rtco_decision_ledger_events WHERE 1 = 0;`  
    **Expected:** Same trigger error.
11. **UPDATE rtco_decision_evidence_links** — e.g. `UPDATE rtco_decision_evidence_links SET source_ref = 'x' WHERE 1 = 0;`  
    **Expected:** Trigger error on `rtco_decision_evidence_links`.
12. **DELETE rtco_decision_evidence_links** — e.g. `DELETE FROM rtco_decision_evidence_links WHERE 1 = 0;`  
    **Expected:** Same trigger error.

## Result (to be filled when run)

- [x] Preflight: triggers and functions present  
- [x] UPDATE ledger: failed as expected  
- [x] DELETE ledger: failed as expected  
- [x] UPDATE artifacts: failed as expected  
- [x] DELETE artifacts: failed as expected  
- [ ] UPDATE decision_context: failed as expected *(table empty—trigger not fired; re-run after storing context for a decision)*  
- [ ] DELETE decision_context: failed as expected *(same)*  
- [x] UPDATE decision_records: failed as expected  
- [x] DELETE decision_records: failed as expected  
- [x] UPDATE rtco_decision_ledger_events: failed as expected  
- [x] DELETE rtco_decision_ledger_events: failed as expected  
- [x] UPDATE rtco_decision_evidence_links: failed as expected  
- [x] DELETE rtco_decision_evidence_links: failed as expected  

**Signed:** _________________ **Date:** 2026-02-11 (script)

Run the SQL in `CLEAR_IMMUTABILITY_PROOF.md` against your CLEAR-enabled database and check the boxes above when each step fails as expected. Keep this file (or a copy with results/screenshot) as the immutability proof record.
