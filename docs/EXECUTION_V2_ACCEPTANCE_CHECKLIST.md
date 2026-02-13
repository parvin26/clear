# Execution layer v2 – acceptance and regression checklist

Use this checklist to verify the execution layer v2 and ensure no regressions. Run after code changes or before release.

---

## 1. Diagnostic run completes and result page renders

- [ ] From `/diagnostic`, add optional context (or skip), go to "Begin diagnostic" → `/diagnostic/run`.
- [ ] Complete the wizard and submit. Backend returns `decision_id`; redirect to `/diagnostic/result/{decision_id}`.
- [ ] Result page loads without error. Decision snapshot block shows (decision_statement, why_now, first_actions, risks, success_metric, timeframe).
- [ ] "What next" section shows three CTAs: Resources, Talk to AI advisor, Request human review.

---

## 2. Decision snapshot renders

- [ ] On result page, snapshot fields are present and readable.
- [ ] "Open Decision Workspace" goes to `/decisions/{id}`. Workspace loads; Overview/Artifact/Execution/Chat tabs visible.
- [ ] Artifact tab (or Overview) shows the same snapshot content; no crash if `synthesis_summary` or `primary_domain` is missing (fallback works).

---

## 3. EMR draft renders and edits persist

- [ ] Execution tab shows EMR: milestones list, metrics, config (cadence, next_review_date, horizon_label).
- [ ] EMR is shown as "Draft" until commit (no "Committed" badge before commit).
- [ ] Edit a milestone (e.g. status or title) or metric (e.g. actual_value) and save (PATCH artifact). Reload page; edits persist.

---

## 4. Commit sets approved and persists must_do

- [ ] With EMR in draft, "Commit plan" panel is visible: select up to 3 must-do milestones, optional note, "Commit plan" button.
- [ ] Click "Commit plan". Request succeeds; UI updates (panel disappears or shows "Committed").
- [ ] Reload; `plan_committed` is true; selected must_do milestones and commit_note are stored in artifact.
- [ ] Governance shows `approval_status: approved` (or equivalent in UI).

---

## 5. Outcome review can be created and list renders

- [ ] When `now >= emr.config.next_review_date` (or manually trigger if your build allows), "Add outcome review" or similar is available.
- [ ] Submit outcome review form with: summary, what_worked, what_did_not_work, key_learnings, assumptions_validated/broken, **main_constraint**, **keep_raise_reduce_stop**.
- [ ] After submit, new review appears in the list. List shows main_constraint and next-cycle decision (keep/raise/reduce/stop).
- [ ] For draft decisions, `emr.config.next_review_date` advances by cadence after creating a review.

---

## 6. Resources link works

- [ ] From result page, "Read playbooks" → `/resources?decision_id=...&primary_domain=...`. Page loads; playbooks filtered by primary_domain; "Back to result" works.

---

## 7. Human review form works

- [ ] From result page, "Request human review" → human review form. Submit with name, email, whatsapp, country, company, role, consent. Confirmation or success message; no 500.

---

## 8. Chat opens with seeded first message when from_diagnostic=1

- [ ] From result page, "Talk to AI advisor" → `/decisions/{id}?tab=chat&from_diagnostic=1`.
- [ ] Chat tab opens. First assistant message is present (seeded from snapshot + synthesis), not empty.
- [ ] Seeding happens only once per decision (localStorage flag). Reopening same decision with `from_diagnostic=1` does not re-seed (or re-call seed API unnecessarily).

---

## 9. Guest flow works with no login

- [ ] Do not log in. Complete diagnostic from landing → run → result. All CTAs (Resources, Chat, Human review) and Decision Workspace work without requiring login.
- [ ] No redirect to login or "unauthorized" on result, decision, resources, or human review pages in the guest path.

---

## 10. No new crashes when old decisions missing new fields

- [ ] Open a decision that was created **before** execution v2 (no `emr`, no `plan_committed`, no `context.profile`, or minimal artifact).
- [ ] Result page, Decision Workspace (all tabs), Execution tab, Outcome review list, and Chat tab load without JS or server errors. Missing fields show as empty or sensible defaults; no "cannot read property of undefined" or 500.

---

## 11. Fundable-product v0 and “what we can do now” (optional)

- [ ] **Portfolio view:** GET `/api/clear/orgs/{portfolio_id}/portfolio` returns enriched list; filters (readiness_band, primary_domain, no_review_days) work. Frontend portfolio page uses it.
- [ ] **Invite and comments:** Decision workspace Execution tab shows Invite card (when founder + enterprise_id) and Comments card; invite produces magic link; comments list and add work.
- [ ] **Timeline tab:** When decision has enterprise_id, Timeline tab shows other decisions for enterprise.
- [ ] **Result page:** Suggested resources and “Did this framing help?” feedback widget work.
- [ ] **10-persona stress test:** Run `STRESS_TEST_STRICT=1` with backend up; no assertion failures (or adjust allowed sets). See `backend/docs/RELEASE_GATE.md`.
- [ ] **trace_id:** Diagnostic run and chat responses include `trace_id`; logs show trace_id and latency for diagnostic_run and chat_message.

---

## Automated tests (when available)

From backend directory:

```bash
python -m pytest tests/ -v
```

- Contract and canonicalization tests should pass. Add integration tests for execution commit, outcome review create, and chat seed when feasible.

---

## Sign-off

| Date       | Tester | Pass (1–10) | Notes |
|------------|--------|-------------|-------|
|            |        |             |       |

---

## Execution v2 – commit summary and files changed

**Summary:** Execution layer v2: company profile (A/B/C), EMR plan by profile + domain, execution commit, OutcomeReview extension (main_constraint, keep_raise_reduce_stop), chat seed from diagnostic, docs and acceptance checklist.

**Files changed (implementation):**

- **Backend**
  - `app/diagnostic/profile.py` — `get_company_profile(onboarding_context)` → "A"|"B"|"C".
  - `app/diagnostic/emr_plan.py` — `generate_emr_plan(...)` rule-based by profile + primary_domain.
  - `app/diagnostic/synthesis.py` — add profile to synthesis; primary_domain in synthesis.
  - `app/diagnostic/run_service.py` — use profile + generate_emr_plan in draft artifact; plan_committed, must_do_milestone_ids, commit_note.
  - `app/routes/clear_routes.py` — POST execution/commit, POST chat/seed, outcome review create/list with new fields.
  - `app/schemas/clear/diagnostic_run.py` — ExecutionCommitRequest; OutcomeReviewCreate/Out with main_constraint, keep_raise_reduce_stop.
  - `app/db/models.py` — OutcomeReview: main_constraint, keep_raise_reduce_stop.
  - `app/diagnostic/decision_chat.py` — `generate_first_assistant_message` for seed.
  - `alembic/versions/i6e7f8a9b0c1_outcome_review_execution_v2.py` — migration for OutcomeReview columns.
- **Frontend**
  - `app/decisions/[id]/page.tsx` — Execution commit panel (must-do select, note, Commit plan); chat tab seed when from_diagnostic=1 + localStorage flag.
  - `lib/clear-api.ts` — commitExecutionPlan, decisionChatSeed; OutcomeReview types.
- **Docs**
  - `docs/LLM_PROMPTS_EXECUTION.md` — EMR and outcome review JSON-only prompt templates.
  - `docs/CLEAR_IMPLEMENTATION_STATUS.md` — Section 6 Execution layer v2.
  - `docs/EXECUTION_V2_ACCEPTANCE_CHECKLIST.md` — 10-point checklist and sign-off.
