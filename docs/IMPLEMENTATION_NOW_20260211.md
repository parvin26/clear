# “What we can do now” – implementation summary (2026-02-11)

This document summarises what was implemented from the detailed near-term plan in `CLEAR_FOUNDER_CTO_AND_VC_NARRATIVE.md` §4.1.

---

## Phase 0 – Hardening (implemented)

| Task | Status | Notes |
|------|--------|--------|
| **0.1** 10-persona in CI | Done | `.github/workflows/ci.yml`: stress-test job runs `scripts/run_10_persona_stress_test.py` with `CLEAR_API_URL` (from secrets or default localhost) and `STRESS_TEST_STRICT=1`. Second step continues-on-error if backend is not up. |
| **0.2** Rule-based evaluation harness | Done | `backend/app/evaluation/checks.py`: `check_primary_domain_in_allowed`, `check_advisor_reply_non_empty_and_emr`, `check_idea_stage_off_ramp`, `run_rule_checks()`. Reusable by stress test or standalone. |
| **0.3** trace_id across diagnostic and chat | Done | Diagnostic run: generate `trace_id`, log at start/end, return in `DiagnosticRunResponse.trace_id`. Chat start and chat message: generate `trace_id`, log, return in response `trace_id`. |
| **0.4** Prompt versioning | Done | `backend/app/diagnostic/prompts.py`: `PROMPTS_VERSION`, `ADVISOR_ROLE_LINES`, `get_advisor_role_line`, `get_first_message_system_prompt`, `get_reply_system_prompt`. `decision_chat.py` imports from prompts. |
| **0.5** SLOs + latency logging | Done | `config.py`: `SLO_DIAGNOSTIC_RUN_P95_SEC`, `SLO_CHAT_MESSAGE_P95_SEC`. Routes: log `latency_sec` and `trace_id` for diagnostic_run, chat_start, chat_message; log warning when above SLO. |
| **0.6** Immutability proof in release gate | Done | `backend/docs/RELEASE_GATE.md`: steps for 10-persona stress test and immutability proof before release; CI note for `CLEAR_API_URL` secret. |

---

## Phase 1 – Product depth (partial)

| Task | Status | Notes |
|------|--------|--------|
| **1.1** Diagnostic goal/segment | Deferred | `diagnostic-types.ts`: added `diagnosticGoal` and `DiagnosticGoal` type. Wizard and `emr_rules` tie-breaker for goal were not applied (file edit issues). You can add the review-step UI and `diagnostic_goal` in `choose_primary_domain` manually. |
| **1.2** Advisor list view | Deferred | Not implemented. Would require e.g. GET `/api/clear/me/decisions?token=` and a frontend “My decisions” page. |
| **1.3** Enterprise dashboard readiness over time | Deferred | Timeline already returns decisions; a “readiness over time” view could be added on top of existing timeline API. |
| **1.4** Cohort tracking (anonymised) | Done | `backend/scripts/aggregate_usage.py`: reads `usage_events`, outputs counts by event_type, by week, by week+type. Run with `--output json` or `print`, `--weeks 12`. |
| **1.5** Role-based EMR read-only | Deferred | Not implemented. Would require disabling milestone/metric/config edits in Execution tab when `viewingRole` is advisor or capital_partner (frontend). |

---

## Phase 2 – Learning and ecosystem (partial)

| Task | Status | Notes |
|------|--------|--------|
| **2.1** More knowledge chunks + tags | Done | `backend/scripts/seed_knowledge_finance_ops.py`: added 6 chunks (F&B wastage, logistics last-mile, clinic ops, investor readiness, Singapore grants, Indonesia KUR) with sector/geo tags. |
| **2.2** Portfolio API doc + optional API key | Done | `backend/docs/PORTFOLIO_API.md`: documents GET org portfolio, query params, and optional auth. When `CLEAR_PORTFOLIO_API_KEY` is set, require `api_key` (query) or `X-API-Key` header; implemented in `get_org_portfolio`. |
| **2.3** Usage aggregation job | Done | `backend/scripts/aggregate_usage.py`: weekly (or on-demand) aggregation of usage_events into by_event_type, by_week, by_week_and_type. |
| **2.4** Suggested resources on result page | Deferred | Already wired; verify and style on result page manually. |

---

## Files created or changed

**New files**

- `backend/app/diagnostic/prompts.py`
- `backend/app/evaluation/__init__.py`, `backend/app/evaluation/checks.py`
- `backend/docs/RELEASE_GATE.md`, `backend/docs/PORTFOLIO_API.md`
- `backend/scripts/aggregate_usage.py`
- `docs/IMPLEMENTATION_NOW_20260211.md`

**Modified**

- `backend/app/config.py` — SLO constants
- `backend/app/schemas/clear/diagnostic_run.py` — `DiagnosticRunResponse`: `enterprise_id`, `trace_id`
- `backend/app/diagnostic/decision_chat.py` — use `prompts.py`; drop local `_advisor_role_line`
- `backend/app/routes/clear_routes.py` — trace_id, latency logging, SLO warning, portfolio API key check
- `backend/scripts/seed_knowledge_finance_ops.py` — 6 new chunks
- `.github/workflows/ci.yml` — stress test runs live script with STRESS_TEST_STRICT
- `frontend/src/lib/diagnostic-types.ts` — `diagnosticGoal`, `DiagnosticGoal`
- `docs/EXECUTION_V2_ACCEPTANCE_CHECKLIST.md` — section 11 (fundable-product v0 checks)

---

## What to do next (manual)

1. **1.1** In the diagnostic wizard (step 9), add the “What’s your main goal?” options and `updateData({ diagnosticGoal })`. In `emr_rules.choose_primary_domain`, add the same goal-based tie-breaker as in the narrative (improve_cash_flow → cfo, scale_operations → coo, investor_ready → cmo/cfo).
2. **1.5** In the decision workspace Execution tab, disable EMR milestone status dropdown, metric actual input, and config edits when `!canEdit` (e.g. when `viewingRole` is advisor or capital_partner).
3. **1.2 / 1.3** Implement advisor list view and/or enterprise readiness-over-time dashboard when prioritised.
4. **2.4** Confirm suggested resources and feedback widget on the result page and adjust styling if needed.
5. Run migration if not already applied; run `seed_knowledge_finance_ops.py` and `aggregate_usage.py` as needed.
