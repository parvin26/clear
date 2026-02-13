# Run sample diagnostics and 10-persona stress test

## 10-persona stress test (recommended before demos)

**Script:** `run_10_persona_stress_test.py`

Runs the **10** predefined founder personas (see `docs/CLEAR_STRESS_TEST_REPORT.md`) through the full CLEAR flow: POST diagnostic/run, GET decision, POST chat/message for a sample advisor reply. Logs per persona: `primary_domain`, `decision_statement`, `success_metric`, `key_constraints`, EMR summary (milestones/metrics count), and a sample advisor reply.

**Prerequisites:** Backend running (e.g. `uvicorn app.main:app` from `backend/`).

**Usage:**

```bash
python backend/scripts/run_10_persona_stress_test.py
```

**Optional:** Set `STRESS_TEST_JSON_OUTPUT=1` or `STRESS_TEST_JSON_OUTPUT=1` to write **docs/CLEAR_STRESS_TEST_10_RESULTS.json** with all results for inspection or CI.

```bash
STRESS_TEST_JSON_OUTPUT=1 python backend/scripts/run_10_persona_stress_test.py
```

Optional env: `CLEAR_API_URL` (default `http://localhost:8000`).

---

## Sample diagnostics (5 founder profiles)

**Script:** `run_sample_diagnostics.py`

Runs the 5 structured test scenarios through the full CLEAR flow via API (no browser). Each scenario calls:

1. `POST /api/clear/diagnostic/run` with `onboarding_context` + `diagnostic_data`
2. `GET /api/clear/decisions/{id}` (decision + latest artifact)
3. `GET /api/clear/decisions/{id}/readiness`
4. `POST /api/clear/decisions/{id}/chat/start`

Then writes **docs/CLEAR_TEST_RUNS.md** with one section per test: inputs, synthesis summary, decision snapshot, governance, EMR, readiness, chat seed.

## Prerequisites

- Backend server running (e.g. `uvicorn app.main:app` from `backend/`).
- No frontend or `USE_BACKEND_DIAGNOSTIC_RUN` needed; the script talks to the API directly.

## Usage

From **repo root** (uses stdlib only, no venv required):

```bash
python backend/scripts/run_sample_diagnostics.py
```

From **backend** directory (with venv if you prefer):

```bash
python scripts/run_sample_diagnostics.py
```

Optional env:

- `CLEAR_API_URL` — default `http://localhost:8000`

## Runtime

Each diagnostic run can take ~1–2 minutes (multi-agent synthesis). All 5 tests run sequentially, so expect ~5–10 minutes total.

## Output

- **docs/CLEAR_TEST_RUNS.md** — full report.
- Console: decision ID for each test and the report path.
