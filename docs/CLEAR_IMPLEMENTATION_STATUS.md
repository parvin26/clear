# CLEAR implementation status report

**Purpose:** Explicit, structured status of the current implementation vs the original specification, with file references and gap analysis.

---

## 0. Primary ICP and wedge (product focus)

- **ICP (Ideal Customer Profile):** Operating companies with **5–100 people**, **RM1m–RM20m** equivalent revenue, needing **cash and operations discipline**. SMEs or tech-enabled SMEs; founder-led.
- **Wedge:** **Cash and execution discipline** for founder-led businesses. CLEAR is positioned as the decision-and-execution layer for this segment first; growth and tech domains are secondary for the wedge.
- These choices drive default domain emphasis (Finance/Ops), EMR templates, knowledge base content, and advisor tone. See also `CLEAR_RUNBOOK.md` and narrative in `CLEAR_FOUNDER_CTO_AND_VC_NARRATIVE.md`.

---

## 1. Actual runtime flow (step-by-step)

### Guest user starting diagnostic on `/diagnostic`

1. **Landing page**  
   - **File:** `frontend/src/app/diagnostic/page.tsx`  
   - User sees “Capability diagnostic”, “Begin diagnostic”, “Add context (optional)”.
2. **Optional onboarding**  
   - Click “Add context (optional)” → overlay opens (same file, `onboardingOpen` state).  
   - Fields: name, country, industry, company size, email.  
   - **Save** → `setOnboardingContext(onboardingForm)` → `localStorage.setItem("clear_onboarding_context", JSON.stringify(ctx))`  
     - **File:** `frontend/src/lib/onboarding-context.ts` (`setOnboardingContext`).  
   - **Skip** → overlay closes; nothing stored.
3. **Begin diagnostic**  
   - Link to `/diagnostic/run` (same file, `<Link href="/diagnostic/run">`).

### Submitting diagnostic

4. **Wizard**  
   - **File:** `frontend/src/components/diagnostic/DiagnosticWizard.tsx`  
   - Steps 1–8: wizard questions; step 9: “Generate snapshot” and `handleSubmit` runs.
5. **Submit branch**  
   - **File:** same, `handleSubmit` (lines ~120–186).  
   - `USE_BACKEND_DIAGNOSTIC_RUN` is read from `frontend/src/lib/diagnostic-run-flag.ts`:  
     `process.env.NEXT_PUBLIC_USE_BACKEND_DIAGNOSTIC_RUN !== "false"` (default **true**).
6. **When flag is true (current default):**  
   - `getOnboardingContext()` from `frontend/src/lib/onboarding-context.ts` (reads `localStorage.clear_onboarding_context`).  
   - `runDiagnosticRun({ onboarding_context, diagnostic_data: data })`  
     - **File:** `frontend/src/lib/clear-api.ts` → `POST /api/clear/diagnostic/run` with body `{ onboarding_context, diagnostic_data }`.  
   - On success: `localStorage.removeItem("clear_diagnostic_draft")`, `router.push(\`/diagnostic/result/${response.decision_id}\`)`.  
   - On error: `setSubmitError`, `setFailedDomain`, `setSubmitting(false)`; user sees “Something went wrong” and “Continue with full {domain} diagnostic form” or “Save and exit”.

### Hitting `/api/clear/diagnostic/run`

7. **Route**  
   - **File:** `backend/app/routes/clear_routes.py`  
   - `diagnostic_run_endpoint` (lines ~85–115): accepts `DiagnosticRunRequest` (body: `onboarding_context`, `diagnostic_data`).
8. **Orchestration**  
   - **File:** `backend/app/diagnostic/run_service.py`  
   - `run_diagnostic_run(db, diagnostic_data, onboarding_context, ...)` (lines ~122–224):  
     - `build_all_payloads(diagnostic_data)` → `backend/app/diagnostic/mapping.py` → dicts for cfo, cmo, coo, cto.  
     - Four agents run in parallel via `asyncio.gather(run_with_timeout("cfo"), ...)` with 55s timeout each; sync agents run in `ThreadPoolExecutor`.  
     - `run_synthesis(agent_outputs, onboarding_context)` → **File:** `backend/app/diagnostic/synthesis.py` → `run_synthesis()` (lines ~147–175).  
     - `_synthesis_to_draft_artifact(synthesis, primary)` (run_service lines ~88–119) builds draft dict including `decision_snapshot` and `synthesis_summary`.  
     - `create_decision(db, enterprise_id=None, initial_artifact=draft, ...)` → **File:** `backend/app/governance/ledger_service.py` → `create_decision()` (lines ~58–116): one `Decision`, one `DecisionArtifact` with `canonical_json=artifact_dict` (after `canonicalize_and_hash(initial_artifact)`), ledger events.  
     - `DiagnosticRun` row created with `onboarding_context`, `diagnostic_data`, `agent_outputs`, `synthesis`, `decision_id`; `db.commit()`.  
   - Response: `decision_id`, `synthesis_summary`, `synthesis`, `next_step`, `next_step_payload`.

### Seeing the result page

9. **Result page**  
   - **File:** `frontend/src/app/diagnostic/result/[run_id]/page.tsx`  
   - `runId` = `params.run_id` (the decision_id from redirect).  
   - `useEffect`: `getDecision(runId)` → **File:** `frontend/src/lib/clear-api.ts` → `GET /api/clear/decisions/{decision_id}`.  
   - Backend returns `DecisionOut` with `latest_artifact = latest_art.canonical_json` (**File:** `backend/app/routes/clear_routes.py`, `_decision_to_out`, line ~245).  
   - Page reads `artifact.decision_snapshot`, `artifact.synthesis_summary`, `primaryDomain = synthesisSummary?.primary_domain || "coo"`.  
   - If `decision_snapshot` present: **Decision Snapshot** block (decision_statement, why_now, first_actions, risks, success_metric, timeframe).  
   - **What next** section: three CTA cards (see below).  
   - Buttons: “Open Decision Workspace”, “Run another diagnostic”.

### Using each of the three CTAs

10. **Read playbooks**  
    - Link: `/resources?decision_id={runId}&primary_domain={primaryDomain}`.  
    - **File:** `frontend/src/app/resources/page.tsx`  
    - Uses `searchParams.get("decision_id")`, `searchParams.get("primary_domain")`; filters static `PLAYBOOKS` by `primary_domain`; shows list with “Available” / “Coming soon”.  
    - “Back to result” links to `/diagnostic/result/{decisionId}` when `decision_id` is present.

11. **Talk to AI advisor**  
    - Link: `/decisions/{runId}?tab=chat&from_diagnostic=1`.  
    - **File:** `frontend/src/app/decisions/[id]/page.tsx`  
    - Tabs are controlled by `searchParams.get("tab")`; value `chat` selects the Chat tab (lines ~259–261, 412–434).  
    - Chat tab content: shows `artifact.decision_snapshot.decision_statement` as “Decision context” and links to `/cfo/chat`, `/cmo/chat`, `/coo/chat`, `/cto/chat`.  
    - **Gap:** No in-tab chat; no session created or tagged to this decision; no auto-generated first assistant message; context is not actually “loaded” into any chat.

12. **Request human review**  
    - Link: `/human-review?decision_id={runId}`.  
    - **File:** `frontend/src/app/human-review/page.tsx`  
    - Form: name, email, whatsapp, country, company, role, consent (email required).  
    - Submit → `submitHumanReviewRequest(body)` → **File:** `frontend/src/lib/clear-api.ts` → `POST /api/clear/human-review` with body.  
    - **File:** `backend/app/routes/clear_routes.py`, `human_review_request` (lines ~118–142): creates `HumanReviewRequest` row, returns `{ id, decision_id, status: "pending", message }`.  
    - Frontend shows “Request received” confirmation and links back to decision or diagnostic.

---

## 2. Where key logic lives (file references)

### Multi-agent synthesis and `decision_snapshot` construction

- **Payload mapping (wizard → agent inputs):**  
  `backend/app/diagnostic/mapping.py`  
  - `build_all_payloads(diagnostic_data)` → `build_cfo_payload`, `build_cmo_payload`, `build_coo_payload`, `build_cto_payload`.
- **Synthesis (rule-based, no LLM):**  
  `backend/app/diagnostic/synthesis.py`  
  - `run_synthesis(agent_outputs, onboarding_context)` (lines ~147–175) calls:  
    - `_primary_domain(agent_outputs)` (risk-based),  
    - `_secondary_domains`, `_problem_signals_by_domain`,  
    - `_emerging_decision(agent_outputs, primary)`,  
    - `_decision_snapshot(agent_outputs, primary)` (lines ~63–104): builds `decision_statement`, `why_now`, `key_constraints`, `options`, `recommended_path`, `first_actions`, `risks`, `success_metric`, `timeframe` from **primary domain’s** analysis only.  
  - `onboarding_context` is accepted but **not used** in synthesis (docstring: “reserved for future use”).
- **Draft artifact (including snapshot) for decision:**  
  `backend/app/diagnostic/run_service.py`  
  - `_synthesis_to_draft_artifact(synthesis, primary)` (lines ~88–119): builds governance fields plus `decision_snapshot: snapshot` and `synthesis_summary: { primary_domain, secondary_domains, recommended_next_step, recommended_playbooks, recommended_first_milestones }`.

### Persistence of synthesis and decision artifact

- **Decision + artifact:**  
  `backend/app/governance/ledger_service.py`  
  - `create_decision(db, enterprise_id, initial_artifact=draft, ...)` (lines ~58–116):  
    - Inserts `Decision`; then `canonicalize_and_hash(initial_artifact)` → `artifact_dict`; inserts `DecisionArtifact` with `canonical_json=artifact_dict` (so the full draft, including `decision_snapshot` and `synthesis_summary`, is stored).  
  - **File:** `backend/app/governance/canonicalize.py`: normalizes and hashes the artifact for `canonical_json` / `canonical_hash`.
- **Diagnostic run record:**  
  `backend/app/diagnostic/run_service.py` (lines ~193–202):  
  - `DiagnosticRun(onboarding_context=..., diagnostic_data=..., agent_outputs=..., synthesis=..., decision_id=...)`; `db.add(diagnostic_run)`; `db.commit()`.
- **API exposure of artifact:**  
  `backend/app/routes/clear_routes.py`  
  - `get_decision` → `get_latest_artifact_for_decision(db, d.decision_id)` → `_decision_to_out(..., latest_art, ...)` → `latest_artifact=latest_art.canonical_json` (so the result page receives `decision_snapshot` and `synthesis_summary` inside `latest_artifact`).

### Chat wiring and gaps

- **Current wiring:**  
  - Result page CTA “Talk to AI advisor” → `/decisions/{id}?tab=chat&from_diagnostic=1`.  
  - **File:** `frontend/src/app/decisions/[id]/page.tsx`, TabsContent `value="chat"` (lines ~412–434):  
    - Renders `artifact?.decision_snapshot?.decision_statement` as “Decision context”.  
    - Renders links to `/cfo/chat`, `/cmo/chat`, `/coo/chat`, `/cto/chat` with copy “Your decision context can be shared there” (but no automatic sharing).
- **Gaps vs spec (decision-scoped chat with seeded context):**  
  - No `DecisionChatSession` creation when user opens Chat tab.  
  - No system message or seed containing onboarding + diagnostic + synthesis + snapshot.  
  - No auto-generated first assistant message (greet by name, restate decision, one next question).  
  - No in-tab chat UI; user must leave to a domain chat, and that chat is not pre-loaded with this decision’s context.  
  - Backend has `PUT /api/clear/decisions/{decision_id}/chat-session` (tag session) and `GET .../chat-sessions` but they are not used in this flow.

### Onboarding context: read, attach, use

- **Read:**  
  - **File:** `frontend/src/lib/onboarding-context.ts`: `getOnboardingContext()` reads `localStorage.getItem("clear_onboarding_context")`, parses JSON, returns `OnboardingContext | null`.
- **Attach to diagnostic run:**  
  - **File:** `frontend/src/components/diagnostic/DiagnosticWizard.tsx` (lines ~127–129): `getOnboardingContext()` passed as `onboarding_context` in `runDiagnosticRun({ onboarding_context: onboardingContext ?? undefined, diagnostic_data: data })`.  
  - **File:** `backend/app/routes/clear_routes.py`: `body.onboarding_context` passed into `run_diagnostic_run(..., onboarding_context=body.onboarding_context)`.  
  - **File:** `backend/app/diagnostic/run_service.py`: `onboarding_context` stored on `DiagnosticRun` row (line ~194) and passed to `run_synthesis(agent_outputs, onboarding_context)` (line ~182).
- **Use:**  
  - **File:** `backend/app/diagnostic/synthesis.py`: `run_synthesis(..., onboarding_context=...)` accepts it but **does not use it** (no personalisation, name, or industry in snapshot or emerging_decision).  
  - So: onboarding is **persisted and attached** but **not yet used** in synthesis or snapshot.

---

## 3. Spec vs implementation (fully / partially / not implemented)

### Phase 0: Orchestration and frontend fallback

| Spec item | Status | Notes |
|-----------|--------|--------|
| POST /api/clear/diagnostic/run with onboarding_context + diagnostic_data | **Done** | `clear_routes.py` + `run_service.run_diagnostic_run`. |
| Determine domains: always run cfo, cmo, coo, cto | **Done** | All four in `asyncio.gather` in run_service. |
| Call internal diagnose for each agent with mapped payloads | **Done** | mapping.py + _run_cfo/_run_cmo/_run_coo/_run_cto. |
| Collect agent analyses; timeout; partial results | **Done** | 55s per agent; failed domains get placeholder; synthesis on remaining. |
| Synthesis returns primary_domain, secondary_domains, problem_signals, emerging_decision, decision_snapshot, recommended_next_step, recommended_playbooks, recommended_first_milestones | **Done** | synthesis.py `run_synthesis`; snapshot from primary only. |
| Bootstrap decision from synthesis (not single analysis) | **Done** | `_synthesis_to_draft_artifact` + `create_decision(initial_artifact=draft)`. |
| Store SynthesisArtifact linked to decision_id | **Done** | Full synthesis in `DiagnosticRun.synthesis`; snapshot + synthesis_summary in decision artifact `canonical_json`. |
| Return decision_id, synthesis_summary, next_step, payload | **Done** | DiagnosticRunResponse in clear_routes. |
| Frontend fallback: if backend not ready, call 4 agents + frontend synthesis + bootstrap | **Partial** | Fallback exists when `USE_BACKEND_DIAGNOSTIC_RUN=false`: single-agent + bootstrap (not 4 agents + frontend synthesis). Spec said “call all 4 agent endpoints in parallel” and “frontend synthesis function”; that path is **not** implemented—only single-agent path is. |

### Phase 1: Decision snapshot clarity

| Spec item | Status | Notes |
|-----------|--------|--------|
| Canonical DecisionSnapshot type (decision_statement, why_now, key_constraints, options with pros_cons, recommended_path, first_actions, risks, success_metric, timeframe) | **Done** | synthesis.py `_decision_snapshot`; options have `pros_cons` (empty dict). |
| Render snapshot on /diagnostic/result/[decision_id] above everything | **Done** | result page: DecisionSnapshotBlock when `artifact.decision_snapshot` exists. |
| Store as artifact on the decision | **Done** | In draft’s `decision_snapshot` key; persisted in DecisionArtifact.canonical_json. |

### Phase 2: Next action routing

| Spec item | Status | Notes |
|-----------|--------|--------|
| “What next” section with three cards | **Done** | result page, three Links. |
| Read playbooks → /resources?decision_id&primary_domain; curated list; tags by domain; coming soon | **Done** | resources/page.tsx; static PLAYBOOKS; primary_domain filter; “Coming soon” where available=false. |
| Talk to AI advisor → /decisions/[id]?tab=chat; auto create/open chat; first message from snapshot + onboarding | **Partial** | Link to tab=chat works; Chat tab shows decision_statement + links to domain chats. No auto session create, no seeded context, no first assistant message. |
| Request human review → form; capture name, email, whatsapp, country, company, role, decision_id, consent; HumanReviewRequest; confirmation | **Done** | human-review/page.tsx + POST /api/clear/human-review; HumanReviewRequest model. |

### Phase 3: Chat continuation in decision context

| Spec item | Status | Notes |
|-----------|--------|--------|
| DecisionChatSession (or equivalent) when user clicks “Talk to AI advisor” | **Not done** | No session creation or tagging in this flow. |
| Seed chat with system message (onboarding, diagnostic, synthesis, snapshot) | **Not done** | No such message or API. |
| Auto-generate first assistant message (greet by name, restate decision, one question) | **Not done** | Not implemented. |
| Chat persists per decision; can be reopened | **Not done** | No decision-scoped chat persistence in this flow. |

### Phase 4: Onboarding persistence

| Spec item | Status | Notes |
|-----------|--------|--------|
| Step 0.5 modal on /diagnostic (not inside wizard): name, country, industry, company size, email; optional; skip | **Done** | diagnostic/page.tsx overlay; “Add context (optional)” button. |
| Store in localStorage clear_onboarding_context | **Done** | onboarding-context.ts. |
| Attach to diagnostic run and synthesis | **Partial** | Attached to run (body + DiagnosticRun + passed to run_synthesis). Not used inside synthesis/snapshot yet. |
| Optional account creation / attach guest decisions later | **Not done** | Spec said “implement later”; not in scope of current work. |

### Data and storage

| Spec item | Status | Notes |
|-----------|--------|--------|
| DiagnosticRun: id, created_at, onboarding_context, diagnostic_data, agent_outputs, synthesis, decision_id | **Done** | db/models.py + migration g4c5d6e7f8a9. |
| DecisionArtifact: store Decision Snapshot as structured json | **Done** | Snapshot in artifact’s canonical_json under `decision_snapshot`. |
| HumanReviewRequest: id, created_at, decision_id, contact fields, status | **Done** | db/models.py + same migration. |

### Quality and safety (spec)

| Spec item | Status | Notes |
|-----------|--------|--------|
| Orchestrated calls timeout; partial results with clear message | **Done** | 55s per agent; failed domains get placeholder; synthesis continues. |
| If one agent fails, continue synthesis; mark missing domain | **Done** | agent_outputs only includes successful or placeholder; synthesis runs. |
| Never block decision creation if at least one agent returns | **Done** | ValueError only if `not agent_outputs`. |

---

## 4. Suggested cleanup / refactors (no behaviour change)

- **Synthesis module**  
  - Add a single exported type (e.g. `SynthesisResult`) or dataclass for the return shape of `run_synthesis` so callers and artifact builders don’t rely on raw dict keys.  
  - Keep `onboarding_context` in the signature and document “future: use for personalisation and first message”.

- **Run service**  
  - Move `AGENT_TIMEOUT` and `EXECUTOR` to config or a small `diagnostic/constants.py` so they can be tuned without touching orchestration logic.

- **Decision snapshot shape**  
  - Backend: add a Pydantic model (e.g. in `schemas/clear/diagnostic_run.py` or `artifact.py`) for the snapshot structure used in the artifact and in API responses.  
  - Frontend: the existing `DecisionSnapshot` interface in the result page is fine; consider moving it to a shared types file if other pages start using it.

- **Chat**  
  - Isolate “decision context for chat” in one place: e.g. a function that, given `decision_id` (or artifact + onboarding), returns the payload that would be used for a system message or first message.  
  - When adding a decision-scoped chat API, have it call that helper so seeding logic lives in one spot.

- **Routes**  
  - Group diagnostic + human-review in the code (e.g. “Diagnostic & review” section) and add a short comment that they form the “What next” backend for the result page.

- **Frontend result page**  
  - `primaryDomain` fallback when there is no `synthesis_summary` (e.g. single-agent legacy) is `"coo"`. Consider a constant (e.g. `DEFAULT_PRIMARY_DOMAIN`) so the assumption is explicit.

- **Migrations**  
  - Already idempotent; no change needed. Keep the same pattern for future tables.

These refactors would make it easier to add governance rules, EMR cycle, or capital readiness signals later without changing current behaviour.

---

## 5. Recent extensions (governance, EMR, outcome review, readiness, decision chat)

The following have been added; see **docs/CLEAR_RUNBOOK.md** for the guest runbook.

- **Governance metadata:** Stored in `DecisionArtifact.canonical_json.governance` (decision_type, risk_tier, required_approvers, approval_status). Inferred in synthesis; rule: finance/people or high risk → pending_approval + board_or_lead; else draft + founder. UI: Artifact tab shows governance and cycle-approval control; PATCH `/api/clear/decisions/{id}/artifact` with `governance`.
- **Capability gaps:** Synthesis and draft artifact include `capability_gaps`; every diagnostic-run decision has at least one. Execution tab shows a soft “readiness to approve” warning if gaps, milestones, or metrics are missing.
- **EMR loop:** Artifact holds `emr: { milestones, metrics, config }`. Bootstrapped from synthesis in `_synthesis_to_draft_artifact`. Execution tab: EMR milestones (status dropdown), metrics (actual editable), config (next_review_date); all via PATCH artifact.
- **OutcomeReview:** New model and migration; POST/GET `/api/clear/decisions/{id}/outcome-review(s)`. Execution tab: “Add outcome review” when date ≥ next_review_date; form and list of reviews.
- **Capital readiness:** `backend/app/governance/readiness.py` computes band (Nascent / Emerging / Institutionalizing) from reviews, EMR milestone completion, and approval. GET `/api/clear/decisions/{id}/readiness`; workspace header shows band + tooltip.
- **Decision-scoped chat:** POST `/api/clear/decisions/{id}/chat/start` builds context from DiagnosticRun + artifact, creates/reuses `DecisionChatSession` (agent_domain=unified), returns session_id and initial_assistant_message. POST `.../chat/message` with session_id and message returns assistant reply. Chat tab: start on open, show first message and conversation.
- **Onboarding in synthesis:** `run_synthesis` uses onboarding_context in decision_snapshot narrative (e.g. “for a &lt;stage&gt; company in &lt;industry&gt;”); onboarding stored in artifact and included in chat context.

---

## 6. Execution layer v2

- **Company profile (A/B/C):** `backend/app/diagnostic/profile.py` — `get_company_profile(onboarding_context)`. Stored in `DiagnosticRun.synthesis.profile` and `DecisionArtifact.canonical_json.context.profile`.
- **EMR plan by profile + primary domain:** `backend/app/diagnostic/emr_rules.py` — Domain- and profile-aware rule matrix (Finance, Growth, Ops, Tech × A/B/C). `choose_primary_domain(synthesis, agent_outputs)`; `build_emr_plan(primary_domain, profile, ...)` selects from metric and milestone templates. A = 2–3 milestones, 1–2 metrics, 2–4 weeks; B = 3–5, 2–3 metrics, 4–8 weeks; C = 5–7, 3–5 metrics, 8–12 weeks. Persisted in `canonical_json.emr` with `must_do_recommended_ids`; `decision_context.primary_domain` and `profile` stored. See `backend/docs/EMR_RULE_MATRIX.md`. Draft includes `plan_committed: false`, `must_do_milestone_ids: []`, `commit_note: null`.
- **Execution commit:** POST `/api/clear/decisions/{id}/execution/commit` (body: `must_do_milestone_ids`, `commit_note`). Sets `plan_committed=true`, stores must-do ids and note, sets `governance.approval_status=approved`. UI: Commit panel in Execution tab (select up to 3 must-do milestones, note, "Commit plan").
- **OutcomeReview extension:** Migration `i6e7f8a9b0c1`: `main_constraint`, `keep_raise_reduce_stop` (keep|raise|reduce|stop). Form: Main constraint, Next cycle decision. On create (draft only): advance `emr.config.next_review_date` by cadence.
- **Chat seed:** POST `/api/clear/decisions/{id}/chat/seed` returns `{ initial_message }`. Frontend: when `from_diagnostic=1` and no `localStorage.clear_chat_seeded_{id}`, call seed once, set message and flag.
- **Docs:** `docs/LLM_PROMPTS_EXECUTION.md` — EMR and outcome review JSON-only prompt templates for future LLM swap.

---

## 7. Contextual Advisor & Learning Layer

- **Enriched chat context:** Decision-scoped chat builds `chat_context` from full decision_snapshot + EMR (must_do_milestones, all_milestones, metrics). `build_chat_context_for_advisor()` in `backend/app/diagnostic/decision_chat.py`; passed into `generate_assistant_reply` with a server-side summary and instructions to use milestones/metrics, not contradict the plan, and gently challenge “raise money first” in survival contexts. GET `/api/clear/decisions/{id}/chat-context` and POST `.../chat/start` return `chat_context` for the UI context chip.
- **Domain-specific snapshot:** `backend/app/diagnostic/synthesis.py` — `DOMAIN_SUCCESS_METRICS` and `DOMAIN_KEY_CONSTRAINTS` by primary_domain; `opt1_summary` rephrased when ~identical to decision_statement; `recommended_path` concrete (opt1 + success_metric).
- **Onboarding in agent payloads:** `backend/app/diagnostic/mapping.py` — `format_onboarding_context_line(onboarding_context)`; passed into each agent (CFO, CMO, COO, CTO) and prepended to system prompts so advice is contextual (size, stage, industry, country).
- **GTM vs finance primary domain:** `backend/app/diagnostic/emr_rules.py` — `choose_primary_domain(..., diagnostic_data)`; GTM tokens and survival patterns; prefer growth when GTM-heavy and CFO not critical. Test: B1 GTM persona → primary_domain growth unless runway critical.
- **Idea-stage off-ramp:** Wizard step 1: “Is your business already operating and generating revenue?” (Yes / No). If No → redirect to `/diagnostic/idea-stage`; no full diagnostic. Page: “CLEAR is designed for operating businesses (for now)” + optional email/short_text signup. POST `/api/clear/diagnostic/idea-stage`; `IdeaStageLead` table.
- **Visible cycle memory:** On outcome review create, `_build_last_cycle_summary()` computes cycle_number, milestones_completed/total, readiness_before/after, next_cycle_focus; stored in `canonical_json.last_cycle_summary` and appended to `cycle_summaries`. Execution tab shows “Last cycle at a glance” card when present.
- **10-persona stress test:** `backend/scripts/run_10_persona_stress_test.py` — runs 10 personas end-to-end; logs primary_domain, decision_statement, success_metric, key_constraints, EMR summary, sample advisor reply. Env `STRESS_TEST_JSON_OUTPUT=1` or `STRESS_TEST_JSON_OUTPUT=1` writes `docs/CLEAR_STRESS_TEST_10_RESULTS.json`.
- **Knowledge base (RAG):** Table `knowledge_chunks` (id, source_type, title, content, tags, embedding). `retrieve_knowledge_snippets(primary_domain, industry, country, topic_keywords)` in `backend/app/knowledge/retrieval.py`; used in decision chat as “reference material”. No autonomous ingestion; populate via offline script. See `docs/KNOWLEDGE_BASE.md`.

---

## 8. Primary domain selection – current behaviour and limitations

**How `choose_primary_domain` works** (`backend/app/diagnostic/emr_rules.py`):

1. **CFO forced** if: (a) CFO agent returns `risk_level == "red"`, or (b) `_has_survival_patterns(agent_outputs)` is true (CFO summary contains phrases like “runway &lt; 2”, “can’t make payroll”, “behind on rent”, or `runway_critical` is true).
2. **Fallback to CFO** if `synthesis["capability_gaps"]` is empty (no gaps → return `"cfo"`).
3. **Severity** is computed from `capability_gaps`: each gap has a `domain` and `severity` (2–4). `by_domain` = max severity per domain; `best_domain` = domain with highest max severity.
4. **GTM override** only when: `_has_gtm_signals(diagnostic_data)` AND `best_domain == "cfo"` AND `cmo_sev >= cfo_sev - 1` AND `cmo_sev >= 1` → return `"cmo"`. Otherwise return `best_domain`.

**Why the skew happens:**

- **Capability_gaps** are built in synthesis from agent outputs: one gap per domain that has `primary_issue` or `summary`, with severity 4 (red), 3 (yellow), or 2. So every domain that returns something gets at least one gap; CFO often returns red or yellow, so CFO gets severity 4 or 3. If CFO is red, step 1 forces CFO before we ever look at gaps. If CFO is yellow and others yellow too, `best_domain` is the first domain in the iteration that has the max score (order is cfo, cmo, coo, cto), so CFO often wins on a tie. **No equivalent “ops-heavy” override**: we have GTM → CMO but no “org_heavy / ops-heavy → COO” in `choose_primary_domain`.
- **A1 (Hawker)** came out **COO**: likely `_primary_domain` in synthesis was used for the snapshot, or capability_gaps had COO with equal/higher severity and no CFO red/survival, so `best_domain` was coo; or gaps were empty and we’d get cfo – so A1 might have had gaps with COO leading. (Note: the **stored** primary is from `choose_primary_domain`; the **snapshot** was built in synthesis with `_primary_domain`. So A1’s stored primary in the run was COO from `choose_primary_domain`.)
- **A2, B2, C2, D1** → **CFO**: CFO agent often returns red or yellow; survival patterns or red force CFO; or when gaps exist, CFO has highest severity; GTM override requires CMO severity within 1 of CFO, so if CFO is 4 and CMO is 2, CMO never wins.
- **C2 (Clinic)** and **D1 (Idea-stage)**: same as above – no ops-heavy bias in `choose_primary_domain`, and idea-stage is not detected; both go through full diagnostic and CFO dominates.

**Limitations:** (1) No “ops-heavy” bias (e.g. situationClarifiers “operations feel messy”, “process”) to prefer COO when COO severity is close. (2) Fallback when gaps are empty is always CFO. (3) GTM override is narrow (CMO must be within 1 of CFO).

---

## 9. Snapshot boilerplate (success_metric and key_constraints)

**Where they are set:** `backend/app/diagnostic/synthesis.py`, `_decision_snapshot()`:

- **success_metric:** From `DOMAIN_SUCCESS_METRICS[primary]` – we take `domain_metrics[0]` (or for CFO, sometimes `[1]` if “cash flow” in summary). So synthesis **does** use domain-specific metrics (e.g. Finance: “Cash runway of at least 6 months”; Ops: “On-time delivery ≥ 95%”).
- **key_constraints:** `domain_constraints = DOMAIN_KEY_CONSTRAINTS.get(primary, ...)`; we set `key_constraints = domain_constraints[:2] + [GENERIC_CONSTRAINTS[0]]`. So we always append “Limited founder time” or “Resource and time constraints typical of SMEs.” (from `GENERIC_CONSTRAINTS[0]`).

**Why many runs look boilerplate:**

- The **primary** used inside `_decision_snapshot` is the one from **synthesis’s `_primary_domain`** (risk-based, with GTM/org overrides). But the **stored** primary and EMR use **`choose_primary_domain`** (which can differ). So the snapshot can be built with e.g. COO primary (giving ops success_metric and constraints), while the API and EMR later show CFO. That inconsistency can make it seem like “everyone gets the same” when in fact the snapshot was built for a different domain than the one we display.
- **C2, D1, D2** sometimes get more specific metrics (e.g. “On-time delivery ≥ 95%”, “Net operating cash flow positive…”) when the **synthesis** primary (used for the snapshot) was COO or CFO with a variant; if `choose_primary_domain` then overrides to CFO, we still show that snapshot. So the variety comes from synthesis’s internal primary; the boilerplate impression comes from (a) always adding the same generic constraint and (b) possible mismatch between snapshot primary and displayed primary.

**Note:** The string “Improved clarity and first steps completed within 90 days” does **not** appear in `DOMAIN_SUCCESS_METRICS` in synthesis; it appears only as a fallback in `backend/app/diagnostic/emr_plan.py` when building EMR metrics. If the stored snapshot’s `success_metric` were ever missing or overwritten, that fallback could surface. Ensuring the snapshot is built with the **same** primary as `choose_primary_domain` and that we always set domain-specific success_metric in the snapshot will remove reliance on that fallback.

---

## 10. AI advisor returns no replies in stress test – root cause

**How the stress test calls chat:** `backend/scripts/run_10_persona_stress_test.py`, in `run_one()` after GET decision:

- It does: `_req("POST", f"/api/clear/decisions/{decision_id}/chat/message", {"message": "What should I focus on first?"})`.
- It then sets `sample_advisor_reply = (chat_resp.get("assistant_message") or "")[:300]`.
- Any exception is caught with `except Exception: pass`, so failures are silent and `sample_advisor_reply` stays `""`.

**Chat endpoint:** `POST /api/clear/decisions/{decision_id}/chat/message` (`backend/app/routes/clear_routes.py`). Body schema: **`ChatMessageRequest`** with **`session_id: str`** and **`message: str`** (`backend/app/schemas/clear/diagnostic_run.py`).

**Root cause:** The stress test sends only `{"message": "What should I focus on first?"}` and **does not send `session_id`**. The API therefore returns **422 Unprocessable Entity** (validation error for missing required `session_id`). The script catches the exception and leaves `sample_advisor_reply` empty.

**Fix options:** (1) Make `session_id` optional on the API and create or reuse a session when missing; or (2) Have the stress test call `GET /api/clear/decisions/{id}/chat/start` first, then POST with the returned `session_id`. Either fixes the empty advisor reply; (1) also simplifies one-off or scripted calls.

---

## 11. Scope limitation for idea-stage and pre-revenue founders

**Current behaviour:**

- The wizard and diagnostic do **not** ask “Is your business already operating and generating revenue?” before running. All users go through the same flow: `POST /api/clear/diagnostic/run` with `diagnostic_data` (and optional `onboarding_context`). There is a separate **idea-stage** path: `POST /api/clear/diagnostic/idea-stage` (and frontend `/diagnostic/idea-stage`) for signup only; it does **not** run the diagnostic.
- **D1 (Idea-stage Tech Founder)** in the stress test uses payload with e.g. “early stage fintech app”, “no company yet” / validation focus. The payload is sent to **diagnostic/run**. All four agents run; CFO (and others) often infer “no revenue”, “dormant”, or high financial risk. Synthesis and `choose_primary_domain` then:
  - Often choose **CFO** (red or high severity, or fallback when gaps are empty).
  - The **snapshot** may be built with a different primary (e.g. COO from risk/context), so we sometimes see **success_metric** like “On-time delivery ≥ 95%” (COO) even though the **stored** primary is CFO – hence “On-time delivery ≥ 95%” for a fintech idea-stage persona.

**Why D1 gets mis-handled:**

- No early gate: idea-stage users are not detected or redirected before the full diagnostic.
- No “operating vs idea/validation” question in the run request; the backend does not check `businessStage` or a dedicated flag to skip synthesis/EMR.
- So idea-stage founders get a full decision + EMR (often finance-heavy) and sometimes ops-oriented success metrics, which is misleading for “no company yet” use cases.

**Intended behaviour (per spec):** Add an early question “Is your business already operating and generating revenue?” (Yes / No). If No → do **not** run the full CLEAR diagnostic/EMR path; create an idea-stage record and show a dedicated message (CLEAR is for operating businesses; optional email for “validation path” updates). Idea-stage runs should not reach synthesis/EMR so they cannot produce full CFO/ops snapshots.

---

## 12. QA checklist (quick)

- [ ] Existing decisions still render; chat works with full context.
- [ ] New onboarding question (operating/revenue) and idea-stage path: select “No” → idea-stage page; no EMR/decision created.
- [ ] 10-persona script runs against local backend; JSON output when `STRESS_TEST_JSON_OUTPUT=1`.
- [ ] Advisor replies reference EMR milestones where appropriate.

---

## 13. D2 (sole proprietor) 500 error – root cause and fix

**Observed:** In the 10-persona stress test, **D2 – Newly Registered Sole Proprietor** (home bakery, sole prop, mixing personal/business money) returned **HTTP 500** from `POST /api/clear/diagnostic/run`. Other operating personas (A1–C2) completed; D1 was correctly off-ramped as idea-stage.

**Root cause:** In `backend/app/diagnostic/synthesis.py`, the decision snapshot and options assumed agent **recommendations** were always a **list of strings**. For some runs (e.g. D2 with CFO primary), the LLM returned **recommendations as a list of objects** (e.g. `[{"description": "Open a business account"}, ...]`). Code then did `recs[0][:200]` to build the "Alternative" option summary, which raised **TypeError** when `recs[0]` was a dict. Similarly, `first_actions` derived from `out["recommendations"]` could be a list of dicts, and `decision_statement` / `_emerging_decision` used `recs[0]` as a string in places that expect str. No validation or normalisation was applied to recommendation items.

**Fix (applied):**

1. **`backend/app/diagnostic/synthesis.py`**
   - Added **`_recommendation_to_str(r)`** to normalise a single recommendation item to a string whether it is `str`, `dict` (with keys such as `description`, `text`, `title`, `recommendation`, `action`, `summary`), or other.
   - **`_decision_snapshot`:** All uses of `recs[0]` and of `first_actions` derived from recommendations now go through `_recommendation_to_str`, so option summaries, `decision_statement`, and `first_actions` are always strings.
   - **`_emerging_decision`:** When falling back to `recs[0]` for summary, use `_recommendation_to_str(recs[0])`.

2. **`backend/app/diagnostic/emr_rules.py`**
   - **`choose_primary_domain`:** Guard against **empty `by_domain`** (e.g. when no capability_gap has domain in cfo/cmo/coo/cto) by returning `"cfo"` before calling `max(by_domain.items(), ...)`, avoiding **ValueError** in edge cases.

3. **Regression test**
   - **`backend/tests/test_synthesis.py`** added: tests for `_recommendation_to_str`, and for `_decision_snapshot` / `run_synthesis` with D2-like agent outputs where CFO recommendations are list-of-dicts. Ensures snapshot options and first_actions are strings and no exception is raised.

**Verification:** Re-run `backend/scripts/run_10_persona_stress_test.py` with backend up and `STRESS_TEST_OUTPUT_JSON=1`. D2 should complete with a valid `decision_id`, `primary_domain` (e.g. cfo), domain-appropriate `success_metric` and `key_constraints`, and EMR summary; other personas unchanged. No API shape change; only defensive handling of agent output shape.

---

## 14. Fundable-product v0 (portfolio, roles, timeline, analytics, knowledge)

- **Portfolio view v0:** GET `/api/clear/orgs/{portfolio_id}/portfolio` returns an enriched list of enterprises (last decision, last_primary_domain, readiness_band, last_review_date, has_committed_plan) with optional filters: readiness_band, primary_domain, country, industry, no_review_days. Frontend: `frontend/src/app/institutional/portfolios/[portfolioId]/page.tsx` uses this API and shows filters.
- **Roles/permissions v0:** Email-based members; magic-link token for invite. POST `/api/clear/enterprises/{id}/members` (invite), GET members; GET `/api/clear/decisions/{id}/viewing-role?token=` to resolve role (founder / advisor / capital_partner). Decision workspace shows "Viewing as: {role}" and restricts Commit plan to founder; Invite card when founder and enterprise_id; Comments for all.
- **Timeline v0:** GET `/api/clear/enterprises/{enterprise_id}/timeline` returns decisions for the enterprise (decision_id, created_at, primary_domain, readiness_band, has_outcome_review, statement). Decision workspace has a Timeline tab when enterprise_id is set.
- **Analytics and feedback:** Server-side usage events only. `record_event()` in `backend/app/clear/usage.py`; event types for diagnostic_completed, decision_created, plan_committed, outcome_review_created, chat_message_sent, chat_reply_received. POST `/api/clear/impact-feedback` for "Did this framing help?" (1–5 + optional comment). Frontend: result page feedback widget; usage recorded at diagnostic completion, decision create, commit, outcome review, chat.
- **Knowledge base v1:** Table `knowledge_chunks`; `retrieve_knowledge_snippets(primary_domain, industry, country, topic_keywords)`; GET `/api/clear/decisions/{id}/suggested-resources` returns snippets. Seed script `backend/scripts/seed_knowledge_finance_ops.py` (finance/ops chunks). Result page "Suggested resources" and resources page can use this.
- **Diagnostic "What feels most urgent?":** Optional tie-breaker in wizard (Survive/cash, Fix ops, Grow demand); stored in diagnostic_data as `mostUrgent`; `choose_primary_domain` in emr_rules.py uses it when severity is close.
- **Advisor prompt:** Domain-specific persona (CFO = disciplined practical CFO for 5–100 person SMEs; COO = hands-on COO, reliability and simple systems); always reference EMR milestones/metrics; plain language. See `backend/app/diagnostic/decision_chat.py` (`_advisor_role_line`, system prompts).
- **10-persona stress test:** Optional strict mode (`STRESS_TEST_STRICT=1`): assert primary_domain in allowed set per persona and advisor reply non-empty and references EMR. See `docs/CLEAR_STRESS_TEST_REPORT.md`.

- [ ] After adding an outcome review, “Last cycle at a glance” appears on Execution tab after refetch.
