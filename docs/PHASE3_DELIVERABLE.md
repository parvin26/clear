# Phase 3 — Impact Setup, Dashboard, Admin Views, and Guardrails

Phase 3 adds the Impact Setup Wizard, Impact Dashboard MVP, internal analytics views, tightened copy, and intake guardrails **without changing** existing APIs (`POST /api/clear/diagnostic/run`, `/diagnostic/result`, `/diagnostic/idea-stage`).

---

## 1. Internal views: impact & investor analytics

### Route and gating

- **Route:** `/admin/impact-intake`
- **Gating:** Page is **not** linked from public navigation. Access requires:
  - **Query param:** `?key=YOUR_KEY` where `YOUR_KEY` matches `NEXT_PUBLIC_ADMIN_KEY` (client-side check).
  - **Data fetch:** The page calls Next.js API route `/api/admin/impact-intake`, which calls the backend `GET /api/admin/impact-intake` with header `Admin-Api-Key` set from server env `ADMIN_API_KEY`. If the key is not configured, the API returns 503 and the page shows an error.

### Data shown

1. **Funnel (last 30 days)**  
   Counts from telemetry: `diagnostic_intake_started`, `diagnostic_role_selected` (by role), `diagnostic_intake_completed`, `diagnostic_legacy_wizard_clicked` (by label). Fetched via `GET /api/admin/funnel` (proxied by `/api/admin/funnel`).

2. **Social Enterprise intake summary**  
   One row per diagnostic run where `diagnostic_data.impact_profile` exists.  
   Columns: created_at, organization_name, country, sector, impact_categories (human-readable), metric_focus_areas, tracking_existing, seeking_impact_capital.  
   Aggregations: count of runs with impact_profile, frequency of impact categories, frequency of metric_focus_areas, % seeking_impact_capital.

3. **Investor intake summary**  
   One row per submission to `POST /api/intake/investor-profile` (stored in `investor_profiles` table).  
   Columns: created_at, sectors, geographies, themes (human-readable), portfolio_stage, primary_needs.  
   Aggregations: themes frequency, primary_needs frequency, portfolio_stage counts.

---

## 2. Impact Setup Wizard (`/impact/setup`)

### Access

- Linked from the **Social Enterprise result CTA** on `/diagnostic/result/[run_id]?social_enterprise=1`: “Configure indicators & reports” → `/impact/setup?decision_id=<run_id>`.
- **Required:** `decision_id` query param (the decision/run from the social enterprise diagnostic).
- If `decision_id` is missing or the run has no `impact_profile`, the page shows: “We'll unlock this once you complete the Social Enterprise diagnostic” and a link to `/diagnostic`.

### Steps

1. **Confirm impact categories** — Pre-filled from `impact_profile.categories` (from diagnostic). User can keep or adjust; 2–4 categories required.
2. **Choose indicators** — From the 20 Universal Indicators, filtered by selected categories. User selects 5–10 indicators (name, description, unit, default_frequency shown).
3. **Set annual targets** — For each chosen indicator: optional target value and year.
4. **SDG tags and Theory of Change** — Multi-select 2–5 SDGs; optional text areas: problem, solution, beneficiaries, change_sought.

### Completion

- On “Complete setup”, frontend calls `PUT /api/clear/impact/profile` with `decision_id`, `impact_categories`, `primary_sdg_tags`, `theory_of_change`, and `indicators` (indicator_template_id + target_value + target_year).
- Backend creates or updates `impact_profiles` and `org_impact_indicators` (and deletes indicators no longer in the list).
- User is shown “Your impact dashboard is ready” and a link to `/impact/dashboard?decision_id=<id>`.

### Persistence

- **impact_profiles:** decision_id (unique), impact_categories (JSONB array), primary_sdg_tags (JSONB array), theory_of_change (JSONB).
- **org_impact_indicators:** impact_profile_id, indicator_template_id, target_value, target_year.
- **indicator_measurements:** Added when user records values from the dashboard (see below).

---

## 3. Impact Dashboard MVP (`/impact/dashboard`)

### Access

- Linked after completing setup: `/impact/dashboard?decision_id=<id>`.
- If no impact profile exists for the given `decision_id`, user is prompted to go to `/impact/setup?decision_id=<id>`.

### Data shown

1. **Hero card** — “Your impact this year”: e.g. Total beneficiaries (if that indicator is selected), plus 1–2 key indicators with latest value vs target and a simple progress bar.
2. **Indicators grid** — For each org impact indicator: name, latest value, target, status (On track / At risk / Off track) from % of target achieved (≥80% On track, 50–80% At risk, &lt;50% Off track).
3. **Measurement input** — For each indicator: input for current value, period (e.g. 2025-01–2025-03), “Save” button. Values are sent via `POST /api/clear/impact/measurement` and stored in `indicator_measurements`.
4. **SDG tags** — Badges from `ImpactProfile.primary_sdg_tags`.
5. **Report** — “Generate basic impact report” opens an inline summary (indicators, latest values, targets, status). No PDF in this phase; layout is ready for a future PDF generator.

---

## 4. Copy refinements

- **StepRoleSelect:**  
  - MSME Owner / Operator: “Running an established small or medium business.”  
  - Social Enterprise Leader: “Running a business or organization with a clear social or environmental mission.”  
  - Impact Investor / Capital Partner: “Investors and funders. Portfolio-level dashboards, due diligence, and impact reporting.”
- **Social enterprise result CTA:**  
  Text updated to: “We're piloting the Impact Dashboard with our first social enterprises. Your impact focus is already saved—join the pilot to configure your indicators and reports.” CTA button: “Configure indicators & reports” → `/impact/setup?decision_id=<run_id>`.
- **Impact investor result:**  
  Copy clarifies that we use their `investor_profile` to shape portfolio view and impact reporting. CTAs: “Book a call” (→ `/contact`), “Join early access” (→ `/contact`), “Back to home”.

---

## 5. Guardrails and metrics

### intake_version

- **diagnostic_data.intake_version** is set to `'conversational_v1'` for all roles that call the diagnostic run (founder, MSME, social enterprise) in `intakeAnswersToDiagnosticData` (frontend `intake-mapping.ts`). Backend does not require this field; it can ignore it if present.

### Analytics

- **Events** now include:  
  - `intake_version: "conversational_v1"`  
  - `source`: from query param `source` when available (e.g. `?source=email`).  
  Applied to: `diagnostic_intake_started`, `diagnostic_role_selected`, `diagnostic_intake_completed`.

### Funnel view

- **GET /api/admin/funnel?days=30** (admin key required) returns counts for the last N days:  
  `diagnostic_intake_started`, `diagnostic_role_selected` (by role), `diagnostic_intake_completed`, `diagnostic_legacy_wizard_clicked` (by label).  
- The `/admin/impact-intake` page (when gated) fetches this and displays a “Funnel (last 30 days)” section above the impact and investor tables.

---

## 6. New backend pieces (no contract changes to existing APIs)

- **Tables:** `investor_profiles`, `impact_profiles`, `org_impact_indicators`, `indicator_measurements` (migration `p4b5c6d7e8f9_phase3_investor_profiles_impact_tables`).
- **POST /api/intake/investor-profile** — Now persists to `investor_profiles` (Phase 2 contract unchanged).
- **GET /api/admin/impact-intake** — Returns social enterprise runs (from `diagnostic_runs` where `diagnostic_data` has `impact_profile`) and investor profile rows + aggregations.
- **GET /api/admin/funnel** — Returns diagnostic funnel counts from `telemetry_events`.
- **GET /api/clear/impact/seed?decision_id=** — Returns impact_profile seed from the diagnostic run for that decision.
- **GET /api/clear/impact/profile?decision_id=** — Returns full impact profile and org indicators (with latest value per indicator).
- **PUT /api/clear/impact/profile** — Create/update impact profile and selected indicators (from setup wizard).
- **POST /api/clear/impact/measurement** — Record a measurement for an org impact indicator.

---

## 7. New frontend routes and files

- **/admin/impact-intake** — Internal page (gated by `?key=NEXT_PUBLIC_ADMIN_KEY`); shows funnel, social enterprise table, investor table.
- **/impact/setup** — Setup wizard (requires `?decision_id=` from social enterprise run).
- **/impact/dashboard** — Dashboard (requires `?decision_id=` and completed setup).
- **lib/impact-indicators.ts** — 20 Universal Indicator templates and helpers.
- **app/api/admin/impact-intake/route.ts** — Proxy to backend admin impact-intake.
- **app/api/admin/funnel/route.ts** — Proxy to backend admin funnel.

---

## 8. What was not changed

- **POST /api/clear/diagnostic/run** — Request/response unchanged; `diagnostic_data` may include extra key `intake_version` (and existing `impact_profile` for social enterprise).
- **/diagnostic/result**, **/diagnostic/idea-stage** — Unchanged.
- Legacy routes and wizards remain; no redirects enabled by default.
