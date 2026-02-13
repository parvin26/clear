# CLEAR release gate

Before tagging a release or deploying, run the following checks.

## 1. 10-persona stress test

With the backend running (e.g. locally or staging):

```bash
cd backend
export CLEAR_API_URL=http://localhost:8000   # or your backend URL
export STRESS_TEST_STRICT=1
python scripts/run_10_persona_stress_test.py
```

- Exit code 0: all personas passed strict checks (primary_domain in allowed set, advisor reply non-empty and EMR-referential; idea-stage off-ramp when applicable).
- Exit code 1: one or more assertions failed; fix or adjust allowed sets before release.

Optional: write JSON results for inspection:

```bash
STRESS_TEST_JSON_OUTPUT=1 python scripts/run_10_persona_stress_test.py
# Output: docs/CLEAR_STRESS_TEST_10_RESULTS.json
```

## 2. Immutability proof

If you have a test database with CLEAR migrations and triggers applied:

```bash
cd backend
python -m pytest tests/ -v -k immutability
# Or run the proof script referenced in backend/docs/CLEAR_IMMUTABILITY_PROOF.md
```

See `backend/docs/CLEAR_IMMUTABILITY_PROOF.md` and `backend/docs/proofs/proof_immutability_20260208.md` for the exact proof steps.

## 3. CI

On push to main/master, CI runs:

- Backend canonicalization tests
- CLEAR contract endpoint tests
- 10-persona script validation (PERSONAS load) and optionally live stress test when `CLEAR_API_URL` secret is set

Set the repository secret `CLEAR_API_URL` (e.g. to a staging backend URL) to run the full stress test in CI.
