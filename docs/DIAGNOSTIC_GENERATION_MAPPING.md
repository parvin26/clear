# Diagnostic generation mapping by persona

This document describes how intake answers map to `diagnostic_data` for `POST /api/clear/diagnostic/run`, how the backend uses them to build the decision snapshot, and how the "Ask an AI advisor" and "Open Decision Workspace" flows work (including IDs and error handling).

---

## 1. MSME Owner / Operator

### 1.1 diagnostic_data sent to POST /api/clear/diagnostic/run

Built by `intakeAnswersToDiagnosticData(role, answers)` when `role === "msme_owner"` via `msmeToDiagnosticData(answers.msme)`. Keys sent:

| Key | Source | Notes |
|-----|--------|--------|
| `intake_version` | `"conversational_v1"` | |
| `flow` | `"msme"` | Identifies MSME path. |
| `challenges` | `msme.challenges` | Array of selected challenge values (e.g. cash_tight, ops_messy). |
| `challengesNotes` | `msme.challengesNotes` | Optional free text. |
| `primaryFocus` | `msme.primaryFocus` | Optional: cfo, cmo, coo, cto. |
| `primaryFocusNotes` | `msme.primaryFocusNotes` | Optional free text. |
| `documentNames` | `msme.documentNames` | Optional list of uploaded file names. |
| `operatingAndRevenue` | `"yes"` | Fixed for MSME. |
| `situationDescription` | Derived | `"MSME assessment: " + challenges.join(", ") + ". " + (challengesNotes || "")` or `"MSME capability diagnostic."` |

Onboarding context (company_name, country, industry, company_size_band, email) is sent separately as `onboarding_context` from identity.

### 1.2 How backend uses these fields

- **Payloads:** `build_all_payloads(diagnostic_data, onboarding_context)` builds CFO, CMO, COO, CTO payloads. Each payload gets `notes = _situation(data)` = `situationDescription` (and optional onboarding line). So the MSME narrative is carried into all four agents via `notes`.
- **Synthesis:** `run_synthesis(agent_outputs, onboarding_context, diagnostic_data)` uses `diagnostic_data.situationClarifiers` (empty for MSME) and `situationDescription` for `_context_flags` (GTM vs org bias) and for `_recommended_first_milestones` (clarifier-based milestone hints). For MSME, situationClarifiers is not set; milestones come from agent action_plan and recommendations.
- **Decision snapshot:** Built in `_decision_snapshot()` from agent outputs and primary domain. **Decision title/summary:** `emerging_decision` and `decision_snapshot.decision_statement` from primary agent’s summary/primary_issue. **Why now:** from primary agent’s primary_issue and risks. **Key constraints:** domain-specific list + generic. **How success looks:** domain success metric (e.g. cash runway, on-time delivery). **Timeframe:** default "90 days" (not read from MSME diagnostic_data currently).
- **Primary domain:** `choose_primary_domain(synthesis, agent_outputs, diagnostic_data)` — finance critical → cfo; else highest severity capability_gap; else GTM/org bias from situation text.

---

## 2. Startup Founder

### 2.1 diagnostic_data sent

Built by `founderToDiagnosticData(answers.founder)`. Keys sent:

| Key | Source | Notes |
|-----|--------|--------|
| `intake_version` | `"conversational_v1"` | |
| `operatingAndRevenue` | `founder.operatingAndRevenue` | "yes" \| "no". |
| `businessStage` | `founder.businessStage` or `founder.businessStageDropdown` | |
| `businessStageDropdown` | `founder.businessStageDropdown` | |
| `situationDescription` | `founder.situationDescription` | Required narrative. |
| `primaryAreaAffected` | `founder.primaryAreaAffected` | finance, operations, growth, tech, multiple. |
| `situationClarifiers` | `founder.situationClarifiers` | Array (from comma-separated or themes). |
| `primaryTheme` | `founder.primaryTheme` | |
| `mostUrgent` | `founder.mostUrgent` | survive_cash, fix_ops, grow_demand, tech. |
| `mostUrgentNotes` | `founder.mostUrgentNotes` | |
| `diagnosticGoal` | `founder.diagnosticGoal` | |
| `diagnosticGoalNotes` | `founder.diagnosticGoalNotes` | |
| `documentNames` | `founder.documentNames` | |
| `decisionHorizon` | `founder.decisionHorizon` or `founder.decisionHorizonDropdown` | |
| `decisionHorizonDropdown` | `founder.decisionHorizonDropdown` | |
| `clarityLevel` | `"some_clarity"` | |
| `dataAvailable` | `["qualitative"]` | |
| `riskLevel` | `"medium"` | |

### 2.2 How backend uses them

- **Payloads:** Same as MSME: all agents get `notes = situationDescription` (+ onboarding). No direct use of businessStage, primaryAreaAffected, mostUrgent, diagnosticGoal in payload building; they are only in diagnostic_data for synthesis/context.
- **Synthesis:** `situationDescription` and `situationClarifiers` drive `_context_flags` (GTM vs org), which influences `_primary_domain`, `_emerging_decision`, and `_decision_snapshot`. `_recommended_first_milestones` uses `diagnostic_data.situationClarifiers` to suggest milestone titles (see CLARIFIER_MILESTONE_HINTS in synthesis.py). `onboarding_context` (including company_size_band, industry) is used in `_decision_snapshot` to prefix decision_statement (e.g. "For a 2–10 company in services, ...").
- **Decision title/summary:** From primary agent summary/primary_issue, with GTM/org overrides. **Why now:** primary_issue + risks. **Key constraints:** domain-specific + generic. **How success looks:** domain success metric. **Timeframe:** "90 days" (decisionHorizon not yet wired into snapshot timeframe in synthesis).
- **Idea-stage off-ramp:** If `businessStage` (lowercased) is in IDEA_STAGE_BUSINESS_STAGES (e.g. "validation", "idea stage", "no company yet"), backend returns `idea_stage: true` and no decision_id; no agents run.

---

## 3. Social Enterprise Leader

### 3.1 diagnostic_data sent

Same as Founder (founder mapping) plus:

| Key | Source | Notes |
|-----|--------|--------|
| `impact_profile` | `answers.impact_profile` | categories, metric_focus_areas, tracking_existing, tracking_notes, seeking_impact_capital. |

### 3.2 How backend uses founder fields

Identical to §2: situationDescription, situationClarifiers, onboarding_context drive synthesis and snapshot.

### 3.3 How impact_profile is used today

- **Current use:** `impact_profile` is passed in `diagnostic_data` and stored on `DiagnosticRun.diagnostic_data` (JSON). It is **not** currently used in `run_synthesis`, `_decision_snapshot`, or `build_all_payloads`. So the narrative (decision_statement, why_now, key_constraints, success_metric, timeframe) is the same as for a founder; impact categories and metric focus do not yet change the generated text.
- **Proposal (documentation only):** To incorporate impact without changing backend contracts:
  - **Option A:** In synthesis, if `diagnostic_data.get("impact_profile")` is present, append a short line to `decision_snapshot` or to the artifact’s `decision_context`, e.g. "Impact focus: {categories}. Metric focus: {metric_focus_areas}. Seeking impact capital: {seeking_impact_capital}." This can be done inside the existing artifact shape (e.g. in `decision_context` or in a new optional `impact_context` field that the UI can display).
  - **Option B:** When building EMR or recommended_first_milestones, bias or add milestones that reference impact (e.g. "Update impact metrics" when tracking_existing is true). Again, no change to API response shape.
  - **Option C:** Keep impact_profile only for downstream use (Impact Dashboard, impact report PDF, impact seed) and leave narrative unchanged until a dedicated "impact narrative" feature is added.

---

## 4. "Ask an AI advisor" and "Open Decision Workspace" flows

### 4.1 IDs and assumptions

- After a successful diagnostic run, the backend returns `decision_id` (UUID string). The frontend redirects to **`/diagnostic/result/[run_id]`** where **`run_id` is set to `res.decision_id`**. So in the result page URL, **`run_id` === `decision_id`**.
- All links from the result page use this same id:
  - **Open Decision Workspace:** `Link href={/decisions/${runId}}` → `/decisions/[id]` with **`id === decision_id`**.
  - **Ask an AI advisor:** `Link href={/decisions/${runId}?tab=chat&from_diagnostic=1}` → same page with chat tab; **`params.id`** in the decisions page is the **decision_id**.
- **Assumption:** A Decision row already exists when the user lands on the result page, because `runDiagnosticRun` creates the decision and returns its id only after a successful run. So by the time we show the result page, the decision exists. If the user bookmarks the result URL or opens the workspace link later, the only way "Failed to load decision" can occur is: (1) invalid or corrupted id in the URL, (2) decision was deleted, (3) backend/database error, (4) network/CORS/404 (e.g. wrong API base URL).

### 4.2 Frontend functions and API endpoints

**Result page (`/diagnostic/result/[run_id]/page.tsx`):**

- On load: `getDecision(runId)` where `runId = params.run_id`.
- **API:** `GET /api/clear/decisions/{decision_id}` (clear-api.ts: `getDecision(decisionId)`).
- If the request fails or decision is null, the page shows: "Could not load decision record." or "Decision not found." with a "Run diagnostic" link.

**Decision Workspace (`/decisions/[id]/page.tsx`):**

- **ID used:** `decisionId = params.id` (from the dynamic route).
- On load, `load()` runs:
  - `getDecision(decisionId)` → **GET /api/clear/decisions/{decision_id}**
  - `listLedgerEvents(decisionId)` → GET .../decisions/{id}/ledger
  - `listEvidenceLinks(decisionId)` → GET .../decisions/{id}/evidence
  - `listMilestones(decisionId)` → GET .../decisions/{id}/milestones
  - `getReadiness(decisionId)` → GET .../decisions/{id}/readiness
  - `listOutcomeReviews(decisionId)` → GET .../decisions/{id}/outcome-reviews
- If **any** of these fail (e.g. getDecision returns 404), the catch sets **`setError("Failed to load decision")`** and the UI shows that message. So a 404 from GET decision, or a 500, or network error, all surface as "Failed to load decision".

**AI advisor (same page, tab=chat):**

- When `tab=chat` and `from_diagnostic=1`, the page first calls `decisionChatSeed(decisionId)` → **POST /api/clear/decisions/{decision_id}/chat/seed**, then `decisionChatStart(decisionId)` → **POST /api/clear/decisions/{decision_id}/chat/start**.
- Chat messages: **POST /api/clear/decisions/{decision_id}/chat/message** with body `{ message, session_id? }`.
- **Assumption:** The decision must exist and be loadable (GET decision 200) before chat is used; otherwise the user would already see "Failed to load decision" from `load()`. If chat/seed or chat/start fails, the UI shows "Failed to seed chat" or "Failed to start chat" (set in `setActionError`), not the generic "Failed to load decision".

### 4.3 Backend (GET decision and chat)

- **GET /api/clear/decisions/{decision_id}:** Expects `decision_id` as UUID; returns 404 if not found. Frontend passes the string from the URL; Axios sends it in the path. If the id format is invalid, FastAPI may return 422; if valid but not found, 404.
- **Chat endpoints:** All require an existing Decision row; they look up the decision by `decision_id` and return 404 if not found.

### 4.4 Root causes of "Failed to load decision" and advisor errors

- **Failed to load decision:**  
  - **404:** decision_id missing in DB (e.g. user navigated with wrong id, or decision was deleted).  
  - **500:** Server error during fetch or artifact load.  
  - **Network:** Wrong API base URL, CORS, or offline.  
  - **Invalid UUID:** 422 if the path param is not a valid UUID (e.g. typo in URL).

- **Advisor "Failed to seed chat" / "Failed to start chat":**  
  - Usually 404/500 from POST .../chat/seed or .../chat/start (e.g. decision not found, or backend error).  
  - Can also be network or timeout.

### 4.5 Investor profile submit: URL and migrations

- **Frontend:** `submitInvestorProfile()` in clear-api.ts posts to **`/api/intake/investor-profile`** (relative to `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL`).
- **Backend:** Intake router prefix `/api/intake`, route `POST /investor-profile` → full path **`/api/intake/investor-profile`**. They match.
- **Table:** Payload is stored in **`investor_profiles`** (model `InvestorProfileSubmission`). If you see missing-table or relation errors, ensure Alembic migrations have been run (e.g. the migration that creates `investor_profiles`). Do not swallow errors: the user sees a friendly message and in development the console logs `[Investor submit] POST /api/intake/investor-profile failed: { status, body }` for debugging.

- **SDG-based themes:** Investor profiles now carry **`sdg_themes`** (SDG 1–17 ids: sdg_1 … sdg_17) in addition to **`themes`** (ImpactCategoryId[]). The UI lets users select multiple SDGs; `themes` is derived from `sdg_themes` via `SDG_TO_IMPACT_CATEGORY` (flatten + dedupe) so existing aggregations and analytics that use the 8 internal categories continue to work. Both fields are sent and stored in the same JSONB; backend accepts optional `sdg_themes`. **Admin:** Investor SDG selections are visible in the admin impact-intake view via **`sdg_theme_counts`** (GET `/api/admin/impact-intake` → `investor.aggregations.sdg_theme_counts`): counts per SDG id for profiles that have `sdg_themes` set; older backends omit this key and the UI degrades gracefully.

### 4.6 Robust fix (implemented in Part 4)

- **Result page:** Keep using `runId` (decision_id) for getDecision; on error, show a clear message and "Run diagnostic" / "Back to diagnostic" so the user can start over.
- **Decision Workspace:** In the catch of `load()`, inspect the error (response status, response body) and set a more specific message (e.g. "Decision not found. It may have been deleted or the link may be incorrect.") and suggest "Run a new diagnostic" or "Go to dashboard". Optionally log status/body in dev.
- **Advisor:** On chat/seed or chat/start failure, show a clear message (e.g. "We couldn't start the advisor for this decision. Please try opening the workspace again or run a new diagnostic.") and optionally retry or link to workspace/diagnostic.
- **Ensure decision_id is passed correctly:** Result page already uses `res.decision_id` for redirect and for all links; no change needed. Decisions page already uses `params.id`; ensure the route file is `[id]` (not `[decision_id]`) so that `/decisions/abc-123` gives `params.id === "abc-123"`. This is already the case.
