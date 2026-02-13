# CLEAR fundable-product implementation summary (2026-02-11)

**Scope:** Portfolio view v0, roles/invite/comments, timeline, analytics/feedback, knowledge/suggested resources, diagnostic “most urgent” tie-breaker, EMR refinements, advisor prompt, stress-test strict mode, and documentation updates.

---

## What's still pending (optional / ops)

- **Run migration** `m0c1d2e3f4a5` (usage_events, impact_feedback, decision_comments, enterprise_members) if not already applied; run backend test suite.
- **Seed knowledge:** Run `backend/scripts/seed_knowledge_finance_ops.py` to populate finance/ops chunks; ensure pgvector/embedding is configured if using vector search in `retrieve_knowledge_snippets`.
- **CI / release gate:** Document or add a CI job that runs the 10-persona stress test (and optionally immutability proof) before release; use `STRESS_TEST_STRICT=1` for strict assertions (primary_domain allowed set, advisor reply references EMR).
- **Acceptance checklist:** Optionally add items to `EXECUTION_V2_ACCEPTANCE_CHECKLIST.md` for: portfolio view (enriched list + filters), invite (magic link) and comments in workspace, timeline tab, result-page feedback widget and suggested resources, advisor reply using EMR context.
- **Role-based EMR edits:** Currently only Commit plan and Invite are gated by role. Optionally restrict EMR milestone/metric/config edits to founder (e.g. advisor and capital_partner read-only for Execution tab edits).

---

## New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/clear/orgs/{portfolio_id}/portfolio` | Enriched portfolio enterprises; query params: readiness_band, primary_domain, country, industry, no_review_days |
| GET | `/api/clear/enterprises/{enterprise_id}/timeline` | List decisions for enterprise (for Timeline tab) |
| POST | `/api/clear/enterprises/{enterprise_id}/members` | Invite member (body: email, role); optional query base_url for magic link |
| GET | `/api/clear/enterprises/{enterprise_id}/members` | List members |
| GET | `/api/clear/decisions/{decision_id}/viewing-role` | Query param token → role (founder | advisor | capital_partner) |
| GET | `/api/clear/decisions/{decision_id}/comments` | List comments |
| POST | `/api/clear/decisions/{decision_id}/comments` | Create comment (body: content, author_email?, author_role?) |
| POST | `/api/clear/impact-feedback` | Body: question_id, score 1–5, comment?, decision_id?, run_id? |
| GET | `/api/clear/decisions/{decision_id}/suggested-resources` | Knowledge snippets by primary_domain and onboarding |

(Existing endpoints for diagnostic/run, decisions, artifact, execution/commit, outcome-review, chat, readiness, human-review unchanged.)

---

## New tables / columns

- **usage_events** — event_type, entity_type, entity_id, payload (JSONB), created_at; optional actor_id, session_id.
- **impact_feedback** — question_id, score, comment, decision_id, run_id, created_at.
- **decision_comments** — decision_id, content, author_email, author_role, created_at.
- **enterprise_members** — enterprise_id, email, role (founder | advisor | capital_partner), invite_token, token_expires_at, created_at.

Migration: `backend/alembic/versions/m0c1d2e3f4a5_usage_events_feedback_comments_members.py` (or equivalent in your tree).

No new columns on existing Decision / Artifact / DiagnosticRun tables for this slice.

---

## Breaking changes

**None.** All changes are additive. Existing guest flow, diagnostic run, decision workspace, and APIs remain compatible.

---

## Behaviour changes (additive)

- Diagnostic run can return `enterprise_id` when get-or-create enterprise from onboarding is used.
- Primary domain selection: optional `mostUrgent` in diagnostic_data (survive_cash | fix_ops | grow_demand) used as tie-breaker in `choose_primary_domain`.
- Advisor system prompt: domain-specific persona (CFO/COO/CMO/CTO) and “always reference EMR milestones/metrics”; plain language.
- EMR: tightened Finance A/B and Ops A/B milestone titles; regional hints (e.g. invoice terms, basic SOP).
- Commit plan panel: only shown when `canCommit` (founder or no role); Invite and Comments cards added to Execution tab.
- 10-persona script: with `STRESS_TEST_STRICT=1`, asserts primary_domain in allowed set and advisor reply references EMR.

---

## Files touched (summary)

- **Backend:** `app/routes/clear_routes.py`, `app/db/models.py`, `app/clear/*.py`, `app/enterprise/service.py`, `app/diagnostic/run_service.py`, `app/diagnostic/emr_rules.py`, `app/diagnostic/decision_chat.py`, `app/schemas/clear/diagnostic_run.py`, migration m0c1d2e3f4a5*, scripts/run_10_persona_stress_test.py, scripts/seed_knowledge_finance_ops.py.
- **Frontend:** `src/lib/clear-api.ts`, `src/lib/diagnostic-types.ts`, `src/components/diagnostic/DiagnosticWizard.tsx`, `src/app/institutional/portfolios/[portfolioId]/page.tsx`, `src/app/diagnostic/result/[run_id]/page.tsx`, `src/app/decisions/[id]/page.tsx`.
- **Docs:** `CLEAR_IMPLEMENTATION_STATUS.md` (section 14), `CLEAR_RUNBOOK.md` (portfolio and roles), `CLEAR_STRESS_TEST_REPORT.md` (strict mode note), `CLEAR_IMPLEMENTATION_SUMMARY_20260211.md` (this file).
