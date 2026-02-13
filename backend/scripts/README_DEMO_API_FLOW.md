# CLEAR API demo flow (repeatable smoke test)

Backend-first, no frontend or local Python imports. Uses HTTP only so it works on Windows without resolving sqlalchemy/venv.

## Prerequisites

- Backend server running (e.g. `uvicorn app.main:app --reload` from `backend`, default `http://127.0.0.1:8000`).
- CLEAR migrations applied (enterprises, decisions, decision_artifacts, decision_ledger_events, decision_evidence_links, decision_chat_sessions, triggers).

## Run the smoke test

From the **backend** directory (or pass `-BaseUrl` if your server is elsewhere):

```powershell
cd backend
.\scripts\demo_api_flow.ps1
```

Optional: different base URL:

```powershell
.\scripts\demo_api_flow.ps1 -BaseUrl "http://localhost:8000"
```

## What the script does

1. **POST /api/clear/enterprises** — Create one enterprise.
2. **POST /api/clear/decisions** — Create a decision with an **intentionally incomplete** artifact (`constraints: []`).
3. **POST /api/clear/decisions/{id}/evidence** — Attach one minimal evidence link (dummy `source_ref` to `cfo_analyses` id 1).
4. **POST /api/clear/decisions/{id}/finalize** — Expect **400** (validator blocks: at least one constraint required).
5. **GET /api/clear/decisions/{id}/ledger** — Confirm ledger has **no** `ARTIFACT_FINALIZED` event.

## Success criteria

- Finalize returns HTTP 400 with a message about governance completeness / constraints.
- Ledger does not contain any event with `event_type == "ARTIFACT_FINALIZED"`.
- Script exits with "CLEAR API smoke test passed."

## If the script fails

- **Connection refused:** Start the backend (`uvicorn app.main:app`).
- **404 on /api/clear/...:** CLEAR router is not mounted; check `app/main.py` includes `clear_routes.router`.
- **500 or migration errors:** Run migrations (see `docs/MIGRATION_WINDOWS_POWERSHELL.md`).
- **Finalize returns 200:** Validator or evidence gate is not enforced; check `ledger_service.finalize_decision` and validator.
