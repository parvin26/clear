# Proof: CLEAR API smoke test

**Date:** 2026-02-08  
**Script:** `backend/scripts/demo_api_flow.ps1`  
**Base URL:** http://localhost:8000

## Result

**CLEAR API smoke test passed.**

## Steps executed

1. **POST /api/clear/enterprises** — Created enterprise `id=1`.
2. **POST /api/clear/decisions** (incomplete artifact: constraints empty) — Created decision `decision_id=c7903cac-c3d2-4c87-a4da-67bbd5f6b933`.
3. **POST /api/clear/decisions/{id}/evidence** — Attached evidence link.
4. **POST /api/clear/decisions/{id}/finalize** (expect 400) — Finalize blocked as expected:
   - **Response:** 400  
   - **Detail:** `Governance completeness check failed: Required field empty: constraints; At least one constraint required`
5. **GET /api/clear/decisions/{id}/ledger** — Ledger events:
   - `2026-02-08T11:05:06.610153Z DECISION_INITIATED event_id=7d090c6a-cfc3-4dd2-a0fd-870dbe3f9050`
   - `2026-02-08T11:05:06.610153Z ARTIFACT_DRAFT_CREATED event_id=a7c7b55f-d60f-4a01-ab2e-062112bbbc6a`
   - **No ARTIFACT_FINALIZED** (correct).

## Acceptance criteria met

- Finalize is blocked when governance validator fails (missing constraints).
- No `ARTIFACT_FINALIZED` event is written when finalize is blocked.
- Ledger reflects only events that actually occurred (DECISION_INITIATED, ARTIFACT_DRAFT_CREATED).
