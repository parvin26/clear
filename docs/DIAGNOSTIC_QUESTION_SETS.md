# Diagnostic question sets by persona

This document lists all steps and questions for each diagnostic path, with step IDs, field names in code, and storage keys. The richer MSME question set (§6) and full SDG-based Impact Investor themes (§7) are implemented. **The MSME flow is live** with the user-facing wording below.

---

## 1. MSME Owner / Operator

**Flow:** Identity → Role → MSME steps → Submit.

**Step sequence (code):** `MSME_STEP_IDS` = `["msme_challenges", "msme_context", "msme_focus", "msme_horizon", "msme_docs", "submit"]`.

Identity and Role are shared; see §4 for Identity, §5 for Role.

### 1.1 Step: msme_challenges (Challenges)

| # | Label / question | Short description | Field in code | Stored in |
|---|------------------|------------------|---------------|-----------|
| 1 | "Which of these feel most true right now?" | Multi-select challenges | `challenges` (string[]) | `msme.challenges` |
| 2 | "Anything else? (optional)" | Free text | `challengesNotes` | `msme.challengesNotes` |

**Options (value → label):** From `MSME_CHALLENGE_OPTIONS`: `cash_tight`, `customers_late`, `sales_declining`, `costs_rising`, `decisions_on_me`, `ops_messy`, `not_sure`.

### 1.2 Step: msme_context (Context)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "How long has this business been running?" | Dropdown | `years_operating` | `msme.years_operating` |
| 2 | "What's the single biggest constraint right now?" | Helper: time, cash, people, or market. Dropdown | `primary_constraint` | `msme.primary_constraint` |
| 3 | "How would you describe demand for your product or service right now?" | Helper: stable, growing, declining, or unpredictable. Dropdown | `demand_sentiment` | `msme.demand_sentiment` |

**Options:** `MSME_YEARS_OPERATING_OPTIONS` (<1, 1–3, 3–5, 5+), `MSME_PRIMARY_CONSTRAINT_OPTIONS` (time, cash, people, market), `MSME_DEMAND_SENTIMENT_OPTIONS` (stable, growing, declining, unpredictable).

### 1.3 Step: msme_focus (Focus)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Which area do you MOST want help with?" | Hint: Finance (cash flow, working capital) · Sales & marketing (demand, retention) · Operations · Technology. Single select | `primaryFocus` | `msme.primaryFocus` |
| 2 | "Describe in your own words (optional)" | Free text | `primaryFocusNotes` | `msme.primaryFocusNotes` |

**Options:** `MSME_PRIMARY_FOCUS_OPTIONS`: `cfo`, `cmo`, `coo`, `cto`.

### 1.4 Step: msme_horizon (Horizon & priority)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "When do you need to see results or make the call?" | Dropdown (aligned with founder horizon) | `decision_horizon` | `msme.decision_horizon` |
| 2 | "In one sentence, what would help most right now?" | Optional but helpful; placeholder e.g. "e.g. get a clear plan to fix cash flow". Free text | `priority_sentence` | `msme.priority_sentence` |

**Options:** `MSME_DECISION_HORIZON_OPTIONS`: 1_month, 3_months, 6_months, 12_months, other.

### 1.5 Step: msme_docs (Documents)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Upload documents for assessment (optional)" | e.g. audit reports, financial statements. File upload | `documentNames` (derived from files) | `msme.documentNames` |

### 1.6 Submit

No additional questions; user confirms and submits. Diagnostic data is built by `msmeToDiagnosticData(answers.msme)` → `diagnostic_data` for `POST /api/clear/diagnostic/run`.

**diagnostic_data keys sent (MSME):** `intake_version`, `flow` ("msme"), `challenges`, `challengesNotes`, `primaryFocus`, `primaryFocusNotes`, `documentNames`, `operatingAndRevenue` ("yes"), `situationDescription` (derived from challenges, challengesNotes, priority_sentence, years_operating, primary_constraint, demand_sentiment; see intake-mapping), and optionally `decisionHorizon` when `msme.decision_horizon` is set.

---

## 2. Startup Founder

**Flow:** Identity → Role → Founder steps → Submit.

**Step sequence:** `FOUNDER_STEP_IDS` = `["founder_operating", "founder_stage", "founder_situation", "founder_themes", "founder_urgency", "founder_goal", "founder_docs", "founder_horizon", "submit"]`.

### 2.1 founder_operating

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Are you running an operating business?" | Yes / No (idea or validation stage) | `operatingAndRevenue` | `founder.operatingAndRevenue` |

Options: `"yes"` | `"no"`.

### 2.2 founder_stage

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Stage (select closest)" | Dropdown | `businessStageDropdown` | `founder.businessStageDropdown` |
| 2 | "Or describe in your own words" | Free text | `businessStage` | `founder.businessStage` |

**Dropdown options:** `BUSINESS_STAGE_OPTIONS`: `pre_revenue`, `early_revenue`, `scaling`, `growth`, `other`.

### 2.3 founder_situation

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Primary area affected (select)" | Single select | `primaryAreaAffected` | `founder.primaryAreaAffected` |
| 2 | "Describe in your own words *" | Free text (required) | `situationDescription` | `founder.situationDescription` |

**Primary area options:** `PRIMARY_AREA_OPTIONS`: finance, operations, growth, tech, multiple.

### 2.4 founder_themes

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Primary theme (select)" | Single select | `primaryTheme` | `founder.primaryTheme` |
| 2 | "Or add themes in your own words (comma-separated)" | Free text | `situationClarifiers` (array) | `founder.situationClarifiers` |

**Theme options:** `PRIMARY_THEME_OPTIONS`: cash_flow, hiring, fundraising, product_market, supply_chain, other.

### 2.5 founder_urgency

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "What feels most urgent?" | Single select (radio) | `mostUrgent` | `founder.mostUrgent` |
| 2 | "Anything else about what's urgent? (optional)" | Free text | `mostUrgentNotes` | `founder.mostUrgentNotes` |

**Options:** `MOST_URGENT_OPTIONS`: survive_cash, fix_ops, grow_demand, tech.

### 2.6 founder_goal

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "What's your main goal for this decision?" | Single select (radio) | `diagnosticGoal` | `founder.diagnosticGoal` |
| 2 | "Anything else about your goal? (optional)" | Free text | `diagnosticGoalNotes` | `founder.diagnosticGoalNotes` |

**Options:** `DIAGNOSTIC_GOAL_OPTIONS`: improve_cash_flow, scale_operations, investor_ready, "" (Just clarify and plan).

### 2.7 founder_docs

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Upload documents for assessment (optional)" | File upload | `documentNames` | `founder.documentNames` |

### 2.8 founder_horizon

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Time horizon (select)" | Dropdown | `decisionHorizonDropdown` | `founder.decisionHorizonDropdown` |
| 2 | "Or describe in your own words" | Free text | `decisionHorizon` | `founder.decisionHorizon` |

**Options:** `DECISION_HORIZON_OPTIONS`: 1_month, 3_months, 6_months, 12_months, other.

### 2.9 Submit

Diagnostic data built by `founderToDiagnosticData(answers.founder)`; see DIAGNOSTIC_GENERATION_MAPPING.md for full mapping.

---

## 3. Social Enterprise Leader

**Flow:** Identity → Role → Founder steps (same as §2) → Impact add-on steps → Submit.

**Step sequence:** `SOCIAL_ENTERPRISE_STEP_IDS` = founder steps (excluding submit) + `IMPACT_ADDON_STEP_IDS` = `["impact_categories", "impact_metric_focus", "impact_tracking", "impact_capital", "submit"]`.

### 3.1 Founder subset

Same as §2 (founder_operating through founder_horizon). Stored in `founder`; diagnostic_data includes founder mapping plus `impact_profile` when present.

### 3.2 impact_categories

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "What change do you create in the world?" | Select 2–4 categories | `categories` (ImpactCategoryId[]) | `impact_profile.categories` |

**Options:** `IMPACT_CATEGORIES` (8): livelihoods_income, education_skills, health_wellbeing, environment_climate, financial_inclusion, gender_inclusion, community_development, governance_rights.

### 3.3 impact_metric_focus

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "What types of metrics matter most to you right now?" | Multi-select | `metric_focus_areas` (MetricFocusArea[]) | `impact_profile.metric_focus_areas` |

**Options:** `METRIC_FOCUS_AREAS`: reach, jobs_and_income, education, health, environment, financial_inclusion, gender_inclusion.

### 3.4 impact_tracking

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Are you already tracking impact data today?" | Yes / No | `tracking_existing` | `impact_profile.tracking_existing` |
| 2 | "How are you tracking it? (optional)" | Free text | `tracking_notes` | `impact_profile.tracking_notes` |

### 3.5 impact_capital

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Are you seeking impact capital in the next 12–24 months?" | Yes / No | `seeking_impact_capital` | `impact_profile.seeking_impact_capital` |

### 3.6 Submit

Diagnostic data = founder mapping + `impact_profile` (categories, metric_focus_areas, tracking_existing, tracking_notes, seeking_impact_capital). Backend receives `diagnostic_data.impact_profile`; see DIAGNOSTIC_GENERATION_MAPPING.md for current use.

---

## 4. Impact Investor / Capital Partner

**Flow:** Identity → Role → Investor steps → Submit. No diagnostic run; profile is submitted to `POST /api/intake/investor-profile`.

**Step sequence:** `INVESTOR_STEP_IDS` = `["investor_thesis", "investor_stage", "investor_needs", "submit"]`.

### 4.1 investor_thesis

| # | Label | Description | Field | Stored in (investor_profile JSON) |
|---|------|--------------|-------|-----------------------------------|
| 1 | "Sectors" | Multi-select (all that apply) | `sectors` (string[]) | `investor_profile.sectors` |
| 2 | "Geographies" | Multi-select (countries) | `geographies` (string[], ISO codes) | `investor_profile.geographies` |
| 3 | "Impact themes" | Multi-select (8 categories) | `themes` (ImpactCategoryId[]) | `investor_profile.themes` |

**Sectors (current):** `INTAKE_SECTORS`: retail, manufacturing, services, tech, f&b, healthcare, other.

**Geographies:** Full country list `INTAKE_COUNTRIES` (ISO 3166-1 alpha-2).

**Themes:** Same 8 as `IMPACT_CATEGORIES` (ImpactCategoryId).

### 4.2 investor_stage

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Portfolio stage" | Single select (radio) | `portfolio_stage` | `investor_profile.portfolio_stage` |

**Options:** `PORTFOLIO_STAGE_OPTIONS`: evaluating_opportunities, active_portfolio, reporting_phase, mixed.

### 4.3 investor_needs

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Primary needs from CLEAR" | Multi-select | `primary_needs` (InvestorNeed[]) | `investor_profile.primary_needs` |

**Options:** `INVESTOR_NEED_OPTIONS`: due_diligence_support, portfolio_monitoring, impact_measurement_and_reporting, exit_and_realization_planning.

### 4.4 Submit

Payload: `onboarding_context` (from identity) + `investor_profile`: sectors, geographies, themes, portfolio_stage, primary_needs. Stored in `investor_profiles` table (JSONB).

---

## 5. Shared: Identity & Role

### 5.1 Step: identity (step_id not in role sequence; stepIndex === 0)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Organization name *" | Text | `organization_name` | `identity.organization_name` |
| 2 | "Country *" | Select | `country` | `identity.country` |
| 3 | "Sector *" | Select | `sector` | `identity.sector` |
| 4 | "Team size (optional)" | Select | `org_size_band` | `identity.org_size_band` |
| 5 | "Contact email (optional)" | Email | `contact_email` | `identity.contact_email` |

**Storage:** `identity` (IntakeIdentity). Used for `onboarding_context` (company_name, country, industry, company_size_band, email).

### 5.2 Step: role (stepIndex === 1)

| # | Label | Description | Field | Stored in |
|---|------|--------------|-------|-----------|
| 1 | "Who are you?" | Single select (card) | `role` | `role` (Role) |

**Options:** `ROLE_OPTIONS`: msme_owner, startup_founder, social_enterprise_leader, aspiring_entrepreneur, impact_investor. Only the first four and impact_investor have full intake; aspiring_entrepreneur shows "Coming soon".

---

## 6. Richer MSME question set (implemented)

**Target:** ~10–12 questions total (including identity/role), while keeping backend compatibility. **Implemented:** steps msme_context and msme_horizon plus optional fields years_operating, primary_constraint, demand_sentiment, decision_horizon, priority_sentence.

**MSME flow now:** 5 role steps (challenges, context, focus, horizon, docs) + identity + role. situationDescription is derived from challenges, challengesNotes, priority_sentence, years_operating, primary_constraint, demand_sentiment.

### 6.1 Compatibility constraints

- Keep `flow: "msme"` and existing `diagnostic_data` keys: `challenges`, `challengesNotes`, `primaryFocus`, `primaryFocusNotes`, `documentNames`, `situationDescription` (derived).
- Backend does not require new required keys; any new fields should be optional or folded into derivation of `situationDescription` / existing keys.

### 6.2 Proposed additional questions (design)

1. **Business context (new step or part of challenges)**  
   - "How long have you been operating?"  
   - **Field:** e.g. `msme.years_operating` or `msme.operating_band` (e.g. "&lt;1", "1–3", "3–5", "5+").  
   - **Storage:** `msme.years_operating` (optional).  
   - **Backend:** Optional; can be appended to `situationDescription` in intake-mapping for richer context, or stored only in frontend/session for now.

2. **Primary constraint**  
   - "What's the single biggest constraint right now? (time, cash, people, or market)"  
   - **Field:** `msme.primary_constraint` (optional).  
   - **Storage:** `msme.primary_constraint`.  
   - **Backend:** Optional key in diagnostic_data; synthesis can use for narrative if we extend backend later.

3. **Revenue / demand**  
   - "How would you describe demand for your product or service right now?" (stable / growing / declining / unpredictable)  
   - **Field:** `msme.demand_sentiment`.  
   - **Storage:** `msme.demand_sentiment`.  
   - **Backend:** Optional; can be included in derived `situationDescription`.

4. **Decision horizon (align with founder)**  
   - "When do you need to see results or make the call?" (1 month, 3 months, 6 months, 12 months, other)  
   - **Field:** `msme.decision_horizon` or reuse `decisionHorizon` in diagnostic_data for MSME.  
   - **Storage:** `msme.decision_horizon`.  
   - **Backend:** Optional; if sent as `decisionHorizon` in diagnostic_data, existing synthesis/EMR can use it.

5. **One-sentence priority**  
   - "In one sentence, what would help most right now?"  
   - **Field:** `msme.priority_sentence` (optional).  
   - **Storage:** `msme.priority_sentence`.  
   - **Backend:** Can be appended to `situationDescription` in `msmeToDiagnosticData` so backend gets one richer narrative string without contract change.

### 6.3 Implementation notes (when implementing)

- Add new optional fields to `MSMEAnswers` in `intake-types.ts`.
- In `msmeToDiagnosticData`, build `situationDescription` from: challenges + challengesNotes + (optional) years_operating, primary_constraint, demand_sentiment, priority_sentence, e.g.  
  `MSME assessment: {challenges}. {challengesNotes}. {priority_sentence}. Operating: {years_operating}. Constraint: {primary_constraint}. Demand: {demand_sentiment}.`
- Add new step(s) or sub-questions in `StepMSMEQuestions` (e.g. `msme_context` before or after focus). Keep `msme_challenges`, `msme_focus`, `msme_docs` and add e.g. `msme_context` and/or `msme_horizon` in `MSME_STEP_IDS`.
- No backend API change required; only extend diagnostic_data with optional keys if backend is later updated to use them.

---

## 7. Impact Investor: SDG-based themes (full SDG 1–17)

Impact themes in the UI use **`INVESTOR_SDG_THEMES`** in `intake-constants.ts`: a multi-select of all 17 SDGs. Each entry has `id` (InvestorThemeId: sdg_1 … sdg_17), `sdgNumber`, `title`, `shortLabel`, and `description`.

- **Stored:** Selections are stored as **`sdg_themes: InvestorThemeId[]`** in the investor profile (and in the payload to `POST /api/intake/investor-profile`).
- **Derived:** **`themes: ImpactCategoryId[]`** is derived from `sdg_themes` via **`SDG_TO_IMPACT_CATEGORY`** (flatten + dedupe) so existing analytics and aggregations that use the 8 internal categories continue to work.
- **Submit:** The frontend sends both `sdg_themes` and `themes`; the backend stores both in the `investor_profiles` JSONB.
- **Load:** When loading an existing profile, if `sdg_themes` is present it is used to pre-select SDGs in the UI; if only `themes` exists (legacy), SDG checkboxes are not pre-selected.

**Mapping (SDG → ImpactCategoryId[]):** See `SDG_TO_IMPACT_CATEGORY` in `intake-constants.ts`. Examples: SDG 1 → livelihoods_income, financial_inclusion; SDG 3 → health_wellbeing; SDG 4 → education_skills; SDG 13 → environment_climate; etc. All 17 SDGs are mapped to one or more of the 8 internal categories.
