# Phase 2 — Social Enterprise, Impact Investor, and intake hardening

Phase 2 unlocks value for **Social Enterprises** and **Impact Investors** and hardens the new conversational intake without changing backend contracts (`POST /api/clear/diagnostic/run`, `/diagnostic/result`, `/diagnostic/idea-stage`) or removing legacy routes.

---

## 1. New role behaviors

### Social Enterprise (`social_enterprise_leader`)

- **Flow:** Identity → Role → same founder-style question set as `startup_founder` → **impact add-on steps** (4 steps) → submit.
- **Impact add-on steps (StepImpactAddOn):**
  1. **Impact categories** — multi-select 2–4 from 8 `ImpactCategoryId` values (livelihoods_income, education_skills, health_wellbeing, environment_climate, financial_inclusion, gender_inclusion, community_development, governance_rights).
  2. **Metric focus areas** — multi-select from `MetricFocusArea` (reach, jobs_and_income, education, health, environment, financial_inclusion, gender_inclusion).
  3. **Tracking today** — Yes/No + optional “How are you tracking it?” text.
  4. **Seeking impact capital** — Yes/No (next 12–24 months).
- **Submit:** Calls `runDiagnosticRun` with the same contract as founders; `diagnostic_data` includes all founder keys **plus** `impact_profile` (see below).
- **Result:** Redirect to `/diagnostic/result/[run_id]?social_enterprise=1`. Result page shows an extra CTA card: “Set up your Impact Dashboard (coming soon)” (teaser only; no full dashboard in this phase).

### Impact Investor (`impact_investor`)

- **Flow:** Identity → Role → **StepInvestorProfile** (thesis, portfolio stage, primary needs) → submit.
- **Investor steps:**
  1. **Investment thesis** — sectors (from intake-constants), geographies (countries), impact themes (same 8 `ImpactCategoryId`).
  2. **Portfolio stage** — single-select: evaluating_opportunities, active_portfolio, reporting_phase, mixed.
  3. **Primary needs from CLEAR** — multi-select: due_diligence_support, portfolio_monitoring, impact_measurement_and_reporting, exit_and_realization_planning.
- **Submit:** Does **not** call `runDiagnosticRun`. Instead:
  - Persists identity (onboarding_context) and **investor_profile** via `POST /api/intake/investor-profile`.
  - Shows an inline “investor result” on the same page (or lightweight result view): “Portfolio dashboards are coming soon” with CTAs “Book a call” (e.g. `/contact`) and “Back to home”.
- **No decision/result route:** Impact investor flow never redirects to `/diagnostic/result/[run_id]` or decision snapshot.

---

## 2. Where impact_profile and investor_profile are stored

| Data | Where stored | How |
|------|----------------|-----|
| **impact_profile** | In the same `diagnostic_data` payload sent to `POST /api/clear/diagnostic/run` for social enterprises. | When role is `social_enterprise_leader`, `intakeAnswersToDiagnosticData()` builds founder-style `diagnostic_data` and sets `diagnostic_data.impact_profile = answers.impact_profile` (shape: `ImpactProfileSeed`: categories, metric_focus_areas, tracking_existing, tracking_notes?, seeking_impact_capital). Backend receives it in the existing run request; no new backend contract. |
| **investor_profile** | Backend intake API. | `POST /api/intake/investor-profile` (body: onboarding_context + investor_profile). Minimal endpoint: accepts payload, returns 200 OK; persistence (e.g. DB) can be added later without changing the API contract. |

---

## 3. Feature flag: redirects (off by default)

- **Flag:** `NEXT_PUBLIC_USE_NEW_DIAGNOSTIC_REDIRECTS`  
  - **Default:** `false` (no redirects; legacy behavior kept).
  - **When `true`:**
    - **`/diagnostic/run`** → redirect to `/diagnostic?role=startup_founder`.
    - **`/diagnostic/msme`** → redirect to `/diagnostic?role=msme_owner`.
    - **`/get-started`** → redirect to `/diagnostic`.

- **Implementation:** `frontend/src/lib/feature-flags.ts` exports `USE_NEW_DIAGNOSTIC_REDIRECTS`. The three pages above read the flag and call `router.replace(...)` on load when the flag is true; otherwise they render the existing legacy wizard or get-started content.

---

## 4. Other Phase 2 deliverables

- **Primary entry:** `/diagnostic` has a clear heading (“CLEAR Diagnostic (New Conversational Flow)”) and subtext; footer includes “Prefer the previous step-by-step forms? Use the legacy wizards below.” plus analytics events: `diagnostic_intake_started`, `diagnostic_role_selected`, `diagnostic_intake_completed`, `diagnostic_legacy_wizard_clicked`.
- **Validation:** Identity and Role steps show inline validation when required fields are missing or no role is selected.
- **Session resume:** Intake state (identity, role, steps, founder/msme/impact/investor answers) is saved to `sessionStorage` and restored on soft refresh so users can resume the same session.
- **Tests:** `frontend/src/lib/intake-mapping.test.ts` extended with:
  - **MSME parity:** `runMSMEMappingTest()` — unified MSME answers produce `diagnostic_data` matching legacy MSME wizard shape.
  - **Social Enterprise:** `runSocialEnterpriseMappingTest()` — founder keys match and `diagnostic_data.impact_profile` is present and matches `ImpactProfileSeed`.

---

## 5. What was not changed

- Backend contracts for `POST /api/clear/diagnostic/run`, `/diagnostic/result`, `/diagnostic/idea-stage` are unchanged.
- Legacy routes `/diagnostic/run`, `/diagnostic/msme`, and `/get-started` still work when the feature flag is off.
- No redirects are enabled by default.
