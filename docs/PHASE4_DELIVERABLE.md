# Phase 4 — Canonical intake, impact report, milestone–impact, products, role copy

Phase 4 makes the new conversational intake the default path (via redirects), adds impact report PDF/email, links execution milestones to impact metrics, introduces impact products for future accounting, refines role copy, and documents everything. All changes are **additive**; existing public APIs and flows remain backward compatible.

---

## 1. Redirects and telemetry (canonical intake)

### Flag

- **`NEXT_PUBLIC_USE_NEW_DIAGNOSTIC_REDIRECTS`** (default: `false`) controls whether legacy routes redirect to the new intake.
- When enabled:
  - **`/diagnostic/run`** → **`/diagnostic?role=startup_founder`**
  - **`/diagnostic/msme`** → **`/diagnostic?role=msme_owner`**
  - **`/get-started`** → **`/diagnostic`**
- Redirects run as early as possible in each legacy page’s client component (`router.replace`). Query params are preserved where it makes sense:
  - `/diagnostic/run?source=email` → `/diagnostic?role=startup_founder&source=email`
  - `/get-started?source=landing` → `/diagnostic?source=landing`

### Telemetry

- When a redirect runs, the frontend emits:
  - **Event:** `diagnostic_redirect_triggered`
  - **Properties:** `from_path`, `to_path`, `role_preselected` (if set), `intake_version: "conversational_v1"`, `source` (if carried).

### Files

- `frontend/src/app/diagnostic/run/page.tsx`, `frontend/src/app/diagnostic/msme/page.tsx`, `frontend/src/app/get-started/page.tsx` — redirect + telemetry.
- `frontend/src/lib/analytics.ts` — `diagnostic_redirect_triggered` in `ANALYTICS_EVENTS`.

---

## 2. Social enterprise pilot polish

- **Setup completion:** After completing `/impact/setup`, the completion card shows “Your impact dashboard is ready” and a short “what to do next” list:
  - Update metrics monthly
  - Generate reports for your board or investors
  - Log impact-related milestones as you execute decisions
- **Pilot banner** on `/impact/setup`: “Pilot mode: This is the first version of CLEAR’s impact setup. Your feedback helps shape the product.”
- **Dashboard tip** on `/impact/dashboard`: “Tip: Start by updating 1–3 key indicators regularly. You can keep the rest simple to begin with.”

---

## 3. Impact report PDF and email

### Endpoints

- **`POST /api/clear/impact/report`**
  - **Body:** `{ decision_id: string, period?: string }` (period default `"year_to_date"`).
  - **Response:** `application/pdf` (attachment `clear-impact-report.pdf`).
  - Fetches impact profile and run onboarding context for the decision, builds PDF (org name, country, sector, period label, key metrics table, SDG tags, generated timestamp), returns binary.

- **`POST /api/clear/impact/report/email`**
  - **Body:** `{ decision_id: string, recipient_email: string }`.
  - Generates the same PDF and sends it via existing email (Zepto) with attachment. Returns `{ ok: true, message }` or `{ ok: false, message }`.

### PDF content (MVP)

- **Organization:** `organization_name`, `country`, `sector` from onboarding context (or ImpactProfile).
- **Reporting period:** “Year to date (YYYY)” or “Last 12 months” (from `period`).
- **Key metrics:** For each org impact indicator: name, latest value, target (if set), status (On track / At risk / Off track).
- **SDG tags:** `ImpactProfile.primary_sdg_tags` as labels.
- **Summary:** Total beneficiaries (if that indicator is selected); 1–2 other key indicators with value vs target.

### Frontend

- On `/impact/dashboard`: **“Download impact report (PDF)”** (calls report API, triggers download) and **“Email this report”** (modal: recipient email, then call report/email API; “Sent!” or error).

---

## 4. Milestone–impact linkage

### Model

- **`decision_execution_milestones`** (Phase 4 columns):
  - **`linked_org_indicator_ids`** (JSONB, default `[]`) — list of `OrgImpactIndicator` IDs.
  - **`impact_expected_output_note`** (text, optional) — e.g. “Expected 30 trainees”.

### API

- **Create/update milestone** (existing `POST`/`PATCH` under `/api/clear/decisions/{decision_id}/milestones`) accept and return `linked_org_indicator_ids` and `impact_expected_output_note`.

### UI

- **Milestone edit (decision workspace):** “Impact” section:
  - “Does this milestone affect impact metrics?” Yes/No.
  - If Yes: multi-select of org impact indicators (by name, 1–3), optional “Expected output” note. Saved with the milestone.
- **Mark complete:** When the user marks a milestone complete and it has `linked_org_indicator_ids`:
  - A prompt/side panel appears: “Update impact metrics for this milestone” with value inputs per linked indicator (period default: current month). User can “Save & mark complete” (POST measurements then set status completed) or “Skip” (just mark complete).
- **Dashboard reminder:** On `/impact/dashboard`, if there are completed milestones with linked indicators, a line is shown: “You have N completed milestones with no impact data logged” with link to the decision workspace.

### Backend

- **`GET /api/clear/impact/completed-milestones-reminder?decision_id=`** returns `{ count, milestone_ids }` for completed milestones that have non-empty `linked_org_indicator_ids`.

---

## 5. Impact products and transactions preview (accounting hooks)

### Model

- **`impact_products`** table:
  - `id`, `created_at`, `updated_at`
  - `organization_id` (optional), `decision_id` (optional, indexed)
  - `name`, `sku` (optional)
  - `linked_indicator_ids` (JSONB array of org indicator IDs)
  - `impact_coefficients` (JSONB; at least `beneficiaries_per_unit`)

### Endpoints

- **`GET /api/clear/impact/products?decision_id=`** — list products for decision.
- **`POST /api/clear/impact/products`** — create: `decision_id`, `name`, `sku`, `linked_indicator_ids`, `beneficiaries_per_unit`.
- **`PATCH /api/clear/impact/products/{product_id}`** — update (partial).
- **`POST /api/clear/impact/transactions-preview`** — body: array of `{ sku, quantity?, date?, amount? }`; query: `decision_id`. For each transaction whose `sku` matches an impact product, computes `estimated_beneficiaries = quantity * beneficiaries_per_unit`. Returns `{ total_estimated_beneficiaries, by_indicator, by_period }`. No persistence.

### Frontend

- **`/impact/products?decision_id=`** — list impact products, form to add/edit (name, sku, select 1–3 indicators, beneficiaries per unit). Link from dashboard: “Manage impact products”.

---

## 6. Role copy and self-selection

- **StepRoleSelect** role subtexts (in `intake-constants.ts`):
  - **MSME Owner / Operator:** “Running an established small or medium business (retail, services, manufacturing, etc.).”
  - **Startup Founder:** “Building a new venture (pre-seed to scale-up), often tech-enabled or high-growth.”
  - **Social Enterprise Leader:** “Running a business or organization with a clear social or environmental mission that you report to funders or partners.”
  - **Aspiring Entrepreneur:** “Idea or validation stage, not yet operating.”
  - **Impact Investor / Capital Partner:** “Investors and funders seeking portfolio-level diagnostics, due diligence, and impact reporting.”
- **“Not sure which to choose?”** — helper link/tooltip in the role step explaining that Social Enterprise is appropriate when the user has an explicit impact mission and reports to funders or partners.

---

## 7. New and updated routes (summary)

| Route | Purpose |
|-------|--------|
| `/diagnostic` | Conversational intake (unchanged) |
| `/diagnostic/run`, `/diagnostic/msme`, `/get-started` | Legacy; redirect to `/diagnostic` when flag on |
| `/impact/setup` | Impact setup wizard (pilot banner, completion copy) |
| `/impact/dashboard` | Dashboard (tip, report PDF/email, reminder, link to products) |
| `/impact/products` | Impact products list + add/edit (Phase 4) |
| `/admin/impact-intake` | Admin analytics (unchanged) |

### New API routes

- `POST /api/clear/impact/report`
- `POST /api/clear/impact/report/email`
- `GET /api/clear/impact/completed-milestones-reminder`
- `GET /api/clear/impact/products`
- `POST /api/clear/impact/products`
- `PATCH /api/clear/impact/products/{product_id}`
- `POST /api/clear/impact/transactions-preview`

---

## 8. Tests and checks

- Intake-mapping tests remain passing with `intake_version` present.
- Manual or automated tests recommended for:
  - Report: `POST /api/clear/impact/report` (returns PDF), `POST /api/clear/impact/report/email` (sends or returns error).
  - Products: CRUD and `POST /api/clear/impact/transactions-preview` (preview shape).

---

## 9. Migration

- **`q5c6d7e8f9a0_phase4_milestone_impact_products`**: adds `linked_org_indicator_ids` and `impact_expected_output_note` to `decision_execution_milestones`; creates `impact_products` table.

---

## 10. Addendum: Conversational diagnostic UX refinements

This addendum documents frontend-only refinements to the conversational diagnostic (no backend contract changes).

### 10.1 Guided Start CTAs and role pre-selection

- **Generic entry points:** Links such as “Get started” and “Start diagnostic” on the Guided Start page (`/guided-start`) point to `/diagnostic` with an optional `source=guided_start` query param only. They do **not** pass a `role` query param, so the user always sees the full flow: Step 1 Identity (About your organization), Step 2 Role selector (Who best describes you?) with all five roles.
- **Segment-specific pages:** Pages that target a specific audience (e.g. `/for-investors`, `/for-enterprises`, `/for-founders`) may pass `role=<value>` so that role is pre-selected on the Role step. The Role step is still **shown** with that value selected; it is never skipped.
- **Session and URL:** When `/diagnostic` is opened **without** a `role` query param, session storage is not used to restore `role` or `stepIndex`. The flow always starts at Identity (step 0) then Role (step 1). When opened **with** `role=...`, that role is applied and step index may be restored from session so returning users can resume.

### 10.2 Impact Investor: identity review and error handling

- **Identity review on submit:** On the final step of the Impact Investor flow (“Submit your profile”), a “Review your organization details” panel shows organization name, country, sector, and contact email (if provided). An “Edit” control returns the user to Step 1 (Identity); after editing, they can advance again to the submit step. Submit uses the current (possibly updated) identity for both `onboarding_context` and the investor profile.
- **Network error handling:** If the `POST /api/intake/investor-profile` request fails, the user sees a clear message: “We couldn’t save your investor profile. Please check your connection and try again. If the error persists, contact us at hello@clearcommons.com.” The user remains on the same step and their answers are not cleared.

### 10.3 Country list and dropdown usage

- **Country list:** The intake uses a full, alphabetically sorted list of countries in `intake-constants.ts` (`INTAKE_COUNTRIES`). It includes Asia, Middle East and North Africa, Africa, Europe, Americas, and Oceania (ISO 3166-1 alpha-2 style), with “Other” at the end.
- **Where used:**
  - **StepIdentity (About your organization):** Country is a **single-select dropdown** (Select), options in ascending alphabetical order.
  - **Get-started page:** Country selector uses the same `INTAKE_COUNTRIES` list for consistency.
  - **StepInvestorProfile (Investment thesis – Geographies):** Multi-select; uses a **scrollable checkbox list** (no long chip grid) so the full country list is usable.
- **Single-choice fields:** Identity sector and org size are dropdowns. Other single-choice fields with few options (e.g. portfolio stage, primary needs) keep their current UI; impact categories and metric focus remain chip/button grids for multi-select where visual grouping helps.
