# CLEAR Conversational Diagnostic Intake — Component Architecture & Types

**Status:** Design for approval; no code changes yet.  
**Goal:** Replace fragmented founder/MSME wizards with a single conversational intake at `/diagnostic`, compatible with identity, 5 roles, impact taxonomy, and future impact/investor modules.

---

## Part 1 — Identity & Role (Intake Foundation)

### 1.1 Identity (Mandatory – Step 1)

**Required fields:**

| Field | Type | Notes |
|-------|------|--------|
| `organization_name` | `string` | Required. |
| `country` | `string` | Required; dropdown (same country list as existing get-started). |
| `sector` | `string` | Required; searchable dropdown (align with existing industry/sector options where possible). |

**Optional / progressive:**

| Field | Type | Notes |
|-------|------|--------|
| `org_size_band` | `OrgSizeBand` | enum: `'solo' \| '2-10' \| '11-50' \| '51-200' \| '200+'`. |
| `contact_email` | `string` | Optional. |
| `allow_sign_in_later` | `boolean` | When true, show a gentle sign-in prompt after value is delivered (e.g. on result page), not upfront. |

**Persistence:** Same key and shape as today’s `onboarding_context` (localStorage), extended with the new field names. Backend `POST /api/clear/diagnostic/run` already receives `onboarding_context`; we map identity → existing keys (`company_name`, `country`, `industry`/sector, `company_size_band`, `email`) so no backend contract change.

---

### 1.2 Role selector (Step 2 – all 5 roles)

**Role enum (canonical):**

```ts
type Role =
  | 'msme_owner'
  | 'startup_founder'
  | 'social_enterprise_leader'
  | 'aspiring_entrepreneur'
  | 'impact_investor';
```

**Visible options and behavior:**

| Option | Role value | Behavior |
|--------|------------|----------|
| MSME Owner / Operator | `msme_owner` | Uses current MSME question set (challenges, primary focus, docs). |
| Startup Founder | `startup_founder` | Uses current Founder question set (operating Y/N, stage, situation, themes, urgency, goal, docs, horizon). |
| Social Enterprise Leader | `social_enterprise_leader` | Founder-style diagnostic **plus** impact mini-setup (categories, metric focus, tracking, capital). |
| Aspiring Entrepreneur | `aspiring_entrepreneur` | No diagnostic run; idea-stage email capture only (`/diagnostic/idea-stage`). |
| Impact Investor / Capital Partner | `impact_investor` | New light investor-profile diagnostic; no decision snapshot; “portfolio coming soon” result. |

Role is part of intake state and is passed into step sequencing and `intakeAnswersToDiagnosticData`.

---

## Part 2 — Impact-aligned architecture (for social enterprises)

### 2.1 Universal Impact Categories (taxonomy)

**Type and list:**

```ts
/** Universal Impact Category (8 categories). */
interface ImpactCategory {
  id: ImpactCategoryId;
  name: string;
  description: string;
  default_sdg_tags: string[];  // e.g. ["SDG 1", "SDG 8"]
  /** Metadata only; mapping to IRIS+ / thematic areas. */
  iris_thematic_metadata?: Record<string, string>;
}

type ImpactCategoryId =
  | 'livelihoods_income'
  | 'education_skills'
  | 'health_wellbeing'
  | 'environment_climate'
  | 'financial_inclusion'
  | 'gender_inclusion'
  | 'community_development'
  | 'governance_rights';
```

**Constant list (8 categories):**

| id | name |
|----|------|
| `livelihoods_income` | Livelihoods & Income |
| `education_skills` | Education & Skills |
| `health_wellbeing` | Health & Wellbeing |
| `environment_climate` | Environment & Climate |
| `financial_inclusion` | Financial Inclusion |
| `gender_inclusion` | Gender & Inclusion |
| `community_development` | Community Development |
| `governance_rights` | Governance & Rights |

Each has `description`, `default_sdg_tags[]`, and optional `iris_thematic_metadata`.

---

### 2.2 Universal Indicator set (20 core metrics)

**Indicator template type:**

```ts
type IndicatorValueType = 'count' | 'percentage' | 'currency' | 'score';

interface IndicatorTemplate {
  id: string;
  name: string;
  category_id: ImpactCategoryId;
  unit: string;
  default_frequency: 'monthly' | 'quarterly';
  type: IndicatorValueType;
  sdg_tags: string[];
  iris_id?: string;
  notes?: string;
}
```

**Logical groups (20 indicators) — id and category:**

| id | category_id | name (example) |
|----|-------------|----------------|
| `total_beneficiaries` | livelihoods_income | Total beneficiaries |
| `active_beneficiaries` | livelihoods_income | Active beneficiaries |
| `geographic_coverage` | community_development | Geographic coverage |
| `jobs_created_fte` | livelihoods_income | Jobs created (FTE) |
| `people_trained` | education_skills | People trained |
| `income_generated_for_beneficiaries` | livelihoods_income | Income generated for beneficiaries |
| `students_educated` | education_skills | Students educated |
| `learning_hours_delivered` | education_skills | Learning hours delivered |
| `people_with_healthcare_access` | health_wellbeing | People with healthcare access |
| `nutrition_support_provided` | health_wellbeing | Nutrition support provided |
| `co2_avoided` | environment_climate | CO₂ avoided |
| `clean_energy_generated_or_access` | environment_climate | Clean energy generated or access |
| `waste_diverted_from_landfill` | environment_climate | Waste diverted from landfill |
| `people_with_financial_services_access` | financial_inclusion | People with financial services access |
| `savings_mobilized` | financial_inclusion | Savings mobilized |
| `pct_women_beneficiaries` | gender_inclusion | % women beneficiaries |
| `pct_marginalized_group_beneficiaries` | gender_inclusion | % marginalized group beneficiaries |
| `beneficiary_satisfaction_score` | governance_rights | Beneficiary satisfaction score |
| `repeat_beneficiaries_pct` | livelihoods_income | Repeat beneficiaries % |
| `income_change_for_beneficiaries_pct` | livelihoods_income | Income change for beneficiaries % |

Each has `category_id` (from the 8 categories), `unit`, `default_frequency`, `type` (count | percentage | currency | score), `sdg_tags`, optional `iris_id`, `notes`. Define the type and a constant array for the library; no need to expose all 20 in intake UI initially.

---

### 2.3 Impact data model (target – TypeScript interfaces)

**ImpactProfile (minimal seed from intake):**

```ts
interface ImpactProfileSeed {
  /** From social enterprise add-on: 2–4 categories. */
  categories: ImpactCategoryId[];
  /** From add-on: e.g. 'reach' | 'jobs_and_income' | 'education' | 'health' | 'environment' | 'financial_inclusion' | 'gender_inclusion'. */
  metric_focus_areas: MetricFocusArea[];
  tracking_existing: boolean;
  tracking_notes?: string;
  seeking_impact_capital: boolean;
}

/** Full profile (future module). */
interface ImpactProfile {
  organization_id: string;
  impact_categories: ImpactCategoryId[];
  primary_sdg_tags: string[];
  theory_of_change: {
    problem: string;
    solution: string;
    beneficiaries: string;
    change_sought: string;
  };
  active_indicators: OrgImpactIndicator[];
}

type MetricFocusArea =
  | 'reach'
  | 'jobs_and_income'
  | 'education'
  | 'health'
  | 'environment'
  | 'financial_inclusion'
  | 'gender_inclusion';
```

**ImpactActivity (future):**

```ts
interface ImpactActivity {
  organization_id: string;
  name: string;
  category_id: ImpactCategoryId;
  date_or_period: string;
  locations: string[];
  target_beneficiaries: string;
  partners: string[];
  linked_decision_id?: string;
  linked_milestone_id?: string;
}
```

**IndicatorMeasurement (future):**

```ts
type VerificationStatus = 'self_reported' | 'verified' | 'audited';

interface IndicatorMeasurement {
  org_indicator_id: string;
  period_start: string;
  period_end: string;
  value: number;
  target?: number;
  data_source: string;
  notes?: string;
  verification_status: VerificationStatus;
}
```

**OrgImpactIndicator:** Links an organization to an indicator template (e.g. selected from the 20); full CRUD later.

---

### 2.4 Social enterprise add-on in intake

For `role === 'social_enterprise_leader'`, after the core founder-style questions, add 4 steps:

| Step | Question | Store in |
|------|----------|----------|
| 1 | “What change do you create in the world?” — Multi-select from 8 categories (2–4 recommended). | `diagnostic_data.impact_profile.categories` |
| 2 | “Which types of metrics are most relevant?” — Multi-select from focus areas (reach, jobs_and_income, education, health, environment, financial_inclusion, gender_inclusion). | `diagnostic_data.impact_profile.metric_focus_areas` |
| 3 | “Are you tracking impact data today?” — Yes/No + short text. | `diagnostic_data.impact_profile.tracking_existing`, `tracking_notes` |
| 4 | “Are you seeking impact capital in the next 12–24 months?” — Yes/No. | `diagnostic_data.impact_profile.seeking_impact_capital` |

Result page for Social Enterprise: add a CTA block “Set up your Impact Dashboard (5–10 minutes)” that will later launch the full impact setup wizard (8 categories, 20 indicators).

---

## Part 3 — Impact investor / capital partner flow

For `role === 'impact_investor'`:

**Investor profile (stored in diagnostic_data):**

```ts
interface InvestorProfile {
  sectors: string[];
  geographies: string[];
  themes: ImpactCategoryId[];
  portfolio_stage: PortfolioStage;
  primary_needs: InvestorNeed[];
}

type PortfolioStage =
  | 'evaluating_opportunities'
  | 'active_portfolio'
  | 'reporting_phase'
  | 'mixed';

type InvestorNeed =
  | 'due_diligence_support'
  | 'portfolio_monitoring'
  | 'impact_measurement_and_reporting'
  | 'exit_and_realization_planning';
```

**Conversational steps:**

1. Investment thesis: sectors (multi-select, aligned to enterprise sectors), geographies (multi-select), impact themes (multi-select from 8 categories).
2. Portfolio stage: single select from `PortfolioStage`.
3. Primary needs from CLEAR: multi-select from `InvestorNeed`.

**Result:** Do not call `POST /api/clear/diagnostic/run` for this role (or call a future investor endpoint). Show “Portfolio dashboards coming soon” and CTAs: Book a call / demo; Join early-access for portfolio impact dashboards.

---

## Part 4 — Conversational intake UX & redirects

### 4.1 UX requirements (recap)

- **Single-page flow:** Identity → Role → Role-specific questions → (if social enterprise) impact add-on → submit.
- **Progressive reveal:** One question at a time; on answer, collapse to a one-line summary card (clickable to edit); progress bar “Step X of Y”.
- **Back and edit:** Back goes to previous step; clicking a summary re-opens that step; changing role resets downstream steps.
- **Validation:** Per-step validation before “Next”; required identity + all fields needed for `diagnostic_data` mapping.
- **Loading/errors:** On submit, “Generating your decision snapshot…” + spinner, disable navigation; API errors inline with retry, preserve answers.

### 4.2 Redirect strategy

| Route | Behavior |
|-------|----------|
| `/diagnostic` | New conversational intake (canonical). |
| `/diagnostic/run` | Redirect → `/diagnostic?role=startup_founder` (pre-select `startup_founder`). |
| `/diagnostic/msme` | Redirect → `/diagnostic?role=msme_owner` (pre-select `msme_owner`). |
| `/get-started` | Redirect → `/diagnostic` (canonical; no separate quick assessment). |
| `/start` | Keep as orientation page; CTAs point to `/diagnostic`. |
| `/book-diagnostic` | Keep as legacy by-area landing; add banner: “For a general diagnostic and decision snapshot, try our new streamlined intake” → link to `/diagnostic`. |
| `/cfo/diagnostic`, `/cmo/diagnostic`, `/coo/diagnostic`, `/cto/diagnostic` | Keep as-is; add small banner linking to `/diagnostic`. |

**Optional (60-day deprecation):**

- Old wizards at `/diagnostic/legacy/run` and `/diagnostic/legacy/msme` with minimal shell and “Looking for the old flow?” link from `/diagnostic`.

---

## Part 5 — Backend compatibility & mapping

### 5.1 Backend contract (unchanged)

- **POST /api/clear/diagnostic/run:** Receives `onboarding_context` (optional) and `diagnostic_data` (required). We do not change this.
- **POST /api/clear/diagnostic/idea-stage:** For aspiring entrepreneur; email (and optional short_text). No diagnostic run.

### 5.2 onboarding_context from identity

Map new identity step → existing keys so backend and existing code keep working:

| New identity field | onboarding_context key (existing) |
|--------------------|------------------------------------|
| `organization_name` | `company_name` |
| `country` | `country` |
| `sector` | `industry` |
| `org_size_band` | `company_size_band` |
| `contact_email` | `email` |

Optional: persist both a richer “identity” type in state and a derived `onboarding_context` for the API.

### 5.3 diagnostic_data shape (current backend expectations)

From existing wizards and backend mapping/synthesis:

- **Common:** `situationDescription` (string), `situationClarifiers` (string[]), `operatingAndRevenue` ('yes' | 'no'), `documentNames` (string[]).
- **Founder path:** `businessStage`, `businessStageDropdown?`, `primaryAreaAffected?`, `primaryTheme?`, `mostUrgent`, `mostUrgentNotes?`, `diagnosticGoal`, `diagnosticGoalNotes?`, `decisionHorizon`, `decisionHorizonDropdown?`; plus optional `clarityLevel`, `dataAvailable`, `riskLevel` for defaults.
- **MSME path:** `flow: "msme"`, `challenges` (string[]), `challengesNotes?`, `primaryFocus?`, `primaryFocusNotes?`; `situationDescription` can be derived from challenges.
- **Idea-stage:** Backend checks `businessStage` against `IDEA_STAGE_BUSINESS_STAGES`; if match, returns `idea_stage: true` and does not create a decision.

New keys (backend can ignore until used):

- `diagnostic_data.impact_profile` (for social enterprise).
- `diagnostic_data.investor_profile` (for impact investor; backend may not create a decision for this role in Phase 1).

### 5.4 Mapping function design

**Signature:**

```ts
function intakeAnswersToDiagnosticData(
  role: Role,
  answers: UnifiedIntakeAnswers
): DiagnosticDataOut;
```

**Input type (unified intake state):**

```ts
interface UnifiedIntakeAnswers {
  identity: IntakeIdentity;
  role: Role;
  /** Founder-style (and social enterprise core) answers. */
  founder?: FounderAnswers;
  /** MSME-style answers. */
  msme?: MSMEAnswers;
  /** Social enterprise add-on. */
  impact_profile?: ImpactProfileSeed;
  /** Impact investor only. */
  investor_profile?: InvestorProfile;
}

interface IntakeIdentity {
  organization_name: string;
  country: string;
  sector: string;
  org_size_band?: OrgSizeBand;
  contact_email?: string;
  allow_sign_in_later?: boolean;
}

type OrgSizeBand = 'solo' | '2-10' | '11-50' | '51-200' | '200+';
```

**Output type:** Same shape as current `diagnostic_data` sent to `POST /api/clear/diagnostic/run` (e.g. `Record<string, unknown>` or a typed `DiagnosticDataOut` that includes known keys plus optional `impact_profile` and `investor_profile`).

**Behavior by role:**

| Role | Behavior |
|------|----------|
| `msme_owner` | Build from `answers.msme`: `flow: "msme"`, `challenges`, `primaryFocus`, `situationDescription` (derived), etc. Set `operatingAndRevenue: "yes"`. |
| `startup_founder` | Build from `answers.founder`: all founder keys (`operatingAndRevenue`, `businessStage`, `situationDescription`, `situationClarifiers`, `primaryAreaAffected`, `primaryTheme`, `mostUrgent`, `diagnosticGoal`, `decisionHorizon`, `documentNames`, defaults for `clarityLevel`, `dataAvailable`, `riskLevel`). |
| `social_enterprise_leader` | Same as founder for core keys, plus `answers.impact_profile` → `diagnostic_data.impact_profile`. |
| `aspiring_entrepreneur` | Do not call run; redirect to idea-stage and call `POST /api/clear/diagnostic/idea-stage`. If we ever send a minimal run for analytics, `businessStage` should be in `IDEA_STAGE_BUSINESS_STAGES` so backend returns `idea_stage: true`. |
| `impact_investor` | Build `diagnostic_data` with `investor_profile`; optionally do not call run (show “coming soon” result) or call a future investor endpoint. |

**Where it plugs in:**

- Intake page on “Submit”:
  1. Build `onboarding_context` from `answers.identity` (via a small `identityToOnboardingContext(answers.identity)`).
  2. If role is `aspiring_entrepreneur`: redirect to `/diagnostic/idea-stage`, submit email via idea-stage API; return.
  3. If role is `impact_investor`: build `diagnostic_data` with `investor_profile`; show investor result page (no run, or future endpoint); return.
  4. Otherwise: `diagnostic_data = intakeAnswersToDiagnosticData(role, answers)`; call `runDiagnosticRun({ onboarding_context, diagnostic_data })`; on success redirect to `/diagnostic/result/${decision_id}` (or social enterprise result with Impact Dashboard CTA).

---

## Deliverable 1 — Component and route architecture

### High-level component tree

```
app/diagnostic/page.tsx                    ← Route: /diagnostic (conversational intake)
  └ DiagnosticIntakePage (client)
       ├ useIntakeState()                  ← Central state: identity, role, stepIndex, answers, collapsedSummaries
       ├ IntakeProgressBar                 ← "Step X of Y" + bar
       ├ IntakeStepContainer               ← Wraps current step; handles back/next and collapse-to-summary
       │    ├ StepIdentity                 ← Step 1: organization_name, country, sector (+ optional org_size_band, contact_email, allow_sign_in_later)
       │    ├ StepRoleSelect               ← Step 2: 5-option role selector
       │    ├ StepFounderQuestions          ← Founder flow: operating Y/N, stage, situation, themes, urgency, goal, docs, horizon
       │    ├ StepMSMEQuestions            ← MSME flow: challenges, primary focus, docs (same UX pattern as founder, different questions)
       │    ├ StepImpactAddOn              ← Social enterprise only: 4 impact questions
       │    ├ StepInvestorProfile          ← Impact investor only: thesis, portfolio stage, primary needs
       │    └ StepIdeaStageEmail           ← Aspiring only: email capture (then redirect to idea-stage)
       ├ IntakeSummaryStrip                ← Collapsed one-line cards for completed steps (click to edit)
       └ IntakeSubmit                      ← Final submit: loading, runDiagnosticRun or idea-stage / investor result
```

**Step sequencing:** Driven by a function `getStepSequence(role, answers) => StepDef[]` that returns an array of step identifiers (e.g. `['identity', 'role', 'founder_operating', 'founder_stage', ...]` or `['identity', 'role', 'msme_challenges', ...]`). Current step is `stepSequence[stepIndex]`. Changing role resets `stepIndex` and clears role-specific answers so downstream steps are re-entered.

**Branching model:**

- Steps are not separate routes; they are logical “steps” inside one page.
- Sequence depends on `role`: after `identity` and `role`, the next steps are either founder set, MSME set, impact add-on (if social enterprise), investor set, or idea-stage email.
- “Back” decrements `stepIndex`; “Edit” on a summary sets `stepIndex` to that step and optionally expands the step (same component, different step id).

---

## Deliverable 2 — TypeScript types (consolidated)

```ts
// ----- Identity & role -----
type Role =
  | 'msme_owner'
  | 'startup_founder'
  | 'social_enterprise_leader'
  | 'aspiring_entrepreneur'
  | 'impact_investor';

type OrgSizeBand = 'solo' | '2-10' | '11-50' | '51-200' | '200+';

interface IntakeIdentity {
  organization_name: string;
  country: string;
  sector: string;
  org_size_band?: OrgSizeBand;
  contact_email?: string;
  allow_sign_in_later?: boolean;
}

// ----- Question schema (for step definitions) -----
type StepId = string;  // e.g. 'identity' | 'role' | 'founder_operating' | ...

interface StepDef {
  id: StepId;
  role?: Role;           // if set, only for this role
  roles?: Role[];        // if set, only for these roles
  title?: string;
  optional?: boolean;
}
// Step sequencing: getStepSequence(role) returns StepId[].

// ----- Impact (8 categories, 20 indicators) -----
type ImpactCategoryId =
  | 'livelihoods_income'
  | 'education_skills'
  | 'health_wellbeing'
  | 'environment_climate'
  | 'financial_inclusion'
  | 'gender_inclusion'
  | 'community_development'
  | 'governance_rights';

interface ImpactCategory {
  id: ImpactCategoryId;
  name: string;
  description: string;
  default_sdg_tags: string[];
  iris_thematic_metadata?: Record<string, string>;
}

type IndicatorValueType = 'count' | 'percentage' | 'currency' | 'score';

interface IndicatorTemplate {
  id: string;
  name: string;
  category_id: ImpactCategoryId;
  unit: string;
  default_frequency: 'monthly' | 'quarterly';
  type: IndicatorValueType;
  sdg_tags: string[];
  iris_id?: string;
  notes?: string;
}

// ----- Impact profile (seed from intake) -----
type MetricFocusArea =
  | 'reach'
  | 'jobs_and_income'
  | 'education'
  | 'health'
  | 'environment'
  | 'financial_inclusion'
  | 'gender_inclusion';

interface ImpactProfileSeed {
  categories: ImpactCategoryId[];
  metric_focus_areas: MetricFocusArea[];
  tracking_existing: boolean;
  tracking_notes?: string;
  seeking_impact_capital: boolean;
}

// ----- Investor profile -----
type PortfolioStage =
  | 'evaluating_opportunities'
  | 'active_portfolio'
  | 'reporting_phase'
  | 'mixed';

type InvestorNeed =
  | 'due_diligence_support'
  | 'portfolio_monitoring'
  | 'impact_measurement_and_reporting'
  | 'exit_and_realization_planning';

interface InvestorProfile {
  sectors: string[];
  geographies: string[];
  themes: ImpactCategoryId[];
  portfolio_stage: PortfolioStage;
  primary_needs: InvestorNeed[];
}

// ----- Founder / MSME answers (for mapping) -----
interface FounderAnswers {
  operatingAndRevenue: 'yes' | 'no';
  businessStage: string;
  businessStageDropdown?: string;
  situationDescription: string;
  primaryAreaAffected?: string;
  situationClarifiers: string[];
  primaryTheme?: string;
  mostUrgent: string;
  mostUrgentNotes?: string;
  diagnosticGoal: string;
  diagnosticGoalNotes?: string;
  documentNames: string[];
  decisionHorizon: string;
  decisionHorizonDropdown?: string;
}

interface MSMEAnswers {
  challenges: string[];
  challengesNotes?: string;
  primaryFocus?: string;
  primaryFocusNotes?: string;
  documentNames: string[];
}

// ----- Unified intake state -----
interface UnifiedIntakeAnswers {
  identity: IntakeIdentity;
  role: Role;
  founder?: FounderAnswers;
  msme?: MSMEAnswers;
  impact_profile?: ImpactProfileSeed;
  investor_profile?: InvestorProfile;
}

// ----- Output of mapping (backend diagnostic_data) -----
interface DiagnosticDataOut {
  operatingAndRevenue?: 'yes' | 'no';
  businessStage?: string;
  businessStageDropdown?: string;
  situationDescription: string;
  primaryAreaAffected?: string;
  situationClarifiers?: string[];
  primaryTheme?: string;
  mostUrgent?: string;
  mostUrgentNotes?: string;
  diagnosticGoal?: string;
  diagnosticGoalNotes?: string;
  documentNames?: string[];
  decisionHorizon?: string;
  decisionHorizonDropdown?: string;
  clarityLevel?: string;
  dataAvailable?: string[];
  riskLevel?: string;
  flow?: 'msme';
  challenges?: string[];
  challengesNotes?: string;
  primaryFocus?: string;
  primaryFocusNotes?: string;
  impact_profile?: ImpactProfileSeed;
  investor_profile?: InvestorProfile;
  [key: string]: unknown;
}
```

---

## Deliverable 3 — Step sequencing and redirects (detailed)

### Step sequencing per role

**All roles:**  
Step 1: Identity  
Step 2: Role select  

**msme_owner:**  
3. MSME challenges (multi-select + notes)  
4. MSME primary focus (+ notes)  
5. MSME document upload (optional)  
6. Submit  

**startup_founder:**  
3. Operating business? (Y/N)  
4. Business stage  
5. What’s going on? (situation + primary area)  
6. Themes  
7. Most urgent  
8. Diagnostic goal  
9. Document upload (optional)  
10. Decision horizon  
11. Submit  

**social_enterprise_leader:**  
3–10. Same as startup_founder (steps 3–10)  
11. Impact: What change do you create? (2–4 categories)  
12. Impact: Which metrics are most relevant? (focus areas)  
13. Impact: Tracking impact data today? (Y/N + notes)  
14. Impact: Seeking impact capital 12–24 months? (Y/N)  
15. Submit  

**aspiring_entrepreneur:**  
3. Idea-stage email capture  
4. Redirect to `/diagnostic/idea-stage` and call idea-stage API (no run)  

**impact_investor:**  
3. Investment thesis (sectors, geographies, themes)  
4. Portfolio stage  
5. Primary needs  
6. Show investor result page (no decision run)  

### Redirect behavior (implementation notes)

- `/diagnostic/run` → `redirect('/diagnostic?role=startup_founder')`.
- `/diagnostic/msme` → `redirect('/diagnostic?role=msme_owner')`.
- `/get-started` → `redirect('/diagnostic')`.
- On load of `/diagnostic`, read `searchParams.role`; if valid role, set initial `role` in state and optionally skip rendering the role step (or pre-select and allow change).
- `/book-diagnostic` and CXO routes: add banner + link to `/diagnostic`; no redirect.

---

## Deliverable 4 — intakeAnswersToDiagnosticData integration

**Location:** e.g. `lib/intake-mapping.ts` (or alongside existing `diagnostic-mapping.ts`).

**Responsibilities:**

1. **identityToOnboardingContext(identity: IntakeIdentity): OnboardingContext**  
   Map `organization_name` → `company_name`, `sector` → `industry`, `org_size_band` → `company_size_band`, `contact_email` → `email`, `country` → `country`. Used when calling `runDiagnosticRun`.

2. **intakeAnswersToDiagnosticData(role: Role, answers: UnifiedIntakeAnswers): DiagnosticDataOut**  
   - `msme_owner`: from `answers.msme` build `flow: "msme"`, `challenges`, `primaryFocus`, `situationDescription` (e.g. `MSME assessment: ${challenges.join(", ")}. ${notes}`), `operatingAndRevenue: "yes"`, `documentNames`.  
   - `startup_founder`: from `answers.founder` build all founder keys; set defaults for `clarityLevel`, `dataAvailable`, `riskLevel` if missing.  
   - `social_enterprise_leader`: same as founder, plus `impact_profile: answers.impact_profile`.  
   - `aspiring_entrepreneur`: not used for run; caller redirects to idea-stage.  
   - `impact_investor`: return object with `investor_profile: answers.investor_profile`; caller does not call run or uses future endpoint.

3. **Call site (intake submit handler):**  
   - Persist identity to `onboarding_context` (setOnboardingContext(identityToOnboardingContext(answers.identity))).  
   - If role is aspiring: redirect + idea-stage API.  
   - If role is impact_investor: build diagnostic_data with investor_profile; show investor result UI.  
   - Else: `diagnostic_data = intakeAnswersToDiagnosticData(role, answers)`; `runDiagnosticRun({ onboarding_context: getOnboardingContext(), diagnostic_data })`; redirect to `/diagnostic/result/${decision_id}` (or social enterprise variant with Impact Dashboard CTA).

This keeps existing `runDiagnosticRun` and backend unchanged while supporting all five roles and future impact/investor features.

---

**End of design document.** Ready for your review and approval before implementation.
