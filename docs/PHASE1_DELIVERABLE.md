# Phase 1 — Non-breaking implementation deliverable

## 1. Component tree

```
app/diagnostic/page.tsx
  └ Suspense
       ├ DiagnosticIntakePage (components/intake/DiagnosticIntakePage.tsx)
       │    ├ IntakeProgressBar (step X of Y)
       │    ├ StepIdentity (stepIndex === 0)
       │    ├ StepRoleSelect (stepIndex === 1)
       │    ├ StepFounderQuestions (role === startup_founder, stepId from sequence)
       │    ├ StepMSMEQuestions (role === msme_owner, stepId from sequence)
       │    └ Submit block (currentRoleStepId === 'submit') + Back/Next strip
       └ Footer links (book-diagnostic, legacy /diagnostic/run, /diagnostic/msme)
  └ (fallback: Loading…)

components/intake/
  ├ index.ts
  ├ DiagnosticIntakePage.tsx   (state, step sequencing, submit → runDiagnosticRun)
  ├ IntakeProgressBar.tsx
  ├ StepIdentity.tsx          (organization_name, country, sector, org_size_band, contact_email)
  ├ StepRoleSelect.tsx        (5 roles; only msme_owner & startup_founder advance in Phase 1)
  ├ StepFounderQuestions.tsx  (founder_operating | founder_stage | … | founder_horizon)
  └ StepMSMEQuestions.tsx     (msme_challenges | msme_focus | msme_docs)

lib/
  ├ intake-types.ts     (Role, IntakeIdentity, FounderAnswers, MSMEAnswers, UnifiedIntakeAnswers, DiagnosticDataOut, getStepSequence)
  ├ intake-constants.ts (countries, sectors, org size, role options, founder/MSME options)
  ├ intake-mapping.ts   (identityToOnboardingContext, intakeAnswersToDiagnosticData)
  └ intake-mapping.test.ts (runMappingTest() + expected legacy shape)
```

**Step sequencing:** Identity (0) → Role (1) → for `startup_founder`: founder_operating … founder_horizon → submit; for `msme_owner`: msme_challenges → msme_focus → msme_docs → submit.

---

## 2. Route diffs

**Changed:**

- **`frontend/src/app/diagnostic/page.tsx`**  
  - **Before:** Two-box “Who are you?” (Startup founder → `/diagnostic/run`, SME / MSME → `/diagnostic/msme`) with Shell and footer links.  
  - **After:** Renders `DiagnosticIntakePage` inside `Suspense`; footer still links to `/book-diagnostic`, plus explicit “Legacy flows: Founder wizard · MSME wizard” linking to `/diagnostic/run` and `/diagnostic/msme`.

**Unchanged (legacy flows kept):**

- **`/diagnostic/run`** — Still serves `DiagnosticWizard` (unchanged).
- **`/diagnostic/msme`** — Still serves `MSMEDiagnosticWizard` (unchanged).
- **`/diagnostic/idea-stage`** — Unchanged.
- **`/diagnostic/result/[run_id]`** — Unchanged.

**New files (no route changes):**

- `frontend/src/components/intake/*`
- `frontend/src/lib/intake-types.ts`
- `frontend/src/lib/intake-constants.ts`
- `frontend/src/lib/intake-mapping.ts`
- `frontend/src/lib/intake-mapping.test.ts`

---

## 3. Mapping test example (identical diagnostic_data for founder)

The following shows that `intakeAnswersToDiagnosticData("startup_founder", answers)` produces the **same** `diagnostic_data` shape as the legacy `DiagnosticWizard.buildDiagnosticData()` for an equivalent founder submission.

**Input (unified intake answers):**

```ts
const answers: UnifiedIntakeAnswers = {
  identity: { organization_name: "Acme Ltd", country: "US", sector: "tech" },
  role: "startup_founder",
  founder: {
    operatingAndRevenue: "yes",
    businessStage: "Early revenue, 5 people",
    businessStageDropdown: "early_revenue",
    situationDescription: "We're growing but cash is tight. Not sure whether to focus on cutting costs or pushing revenue.",
    primaryAreaAffected: "finance",
    situationClarifiers: ["cash flow", "hiring"],
    primaryTheme: "cash_flow",
    mostUrgent: "survive_cash",
    mostUrgentNotes: "Runway under 6 months",
    diagnosticGoal: "improve_cash_flow",
    diagnosticGoalNotes: "",
    documentNames: ["pitch.pdf"],
    decisionHorizon: "3 months",
    decisionHorizonDropdown: "3_months",
  },
};
```

**Output (diagnostic_data) — must match legacy wizard:**

```json
{
  "operatingAndRevenue": "yes",
  "businessStage": "Early revenue, 5 people",
  "businessStageDropdown": "early_revenue",
  "situationDescription": "We're growing but cash is tight. Not sure whether to focus on cutting costs or pushing revenue.",
  "primaryAreaAffected": "finance",
  "situationClarifiers": ["cash flow", "hiring"],
  "primaryTheme": "cash_flow",
  "mostUrgent": "survive_cash",
  "mostUrgentNotes": "Runway under 6 months",
  "diagnosticGoal": "improve_cash_flow",
  "diagnosticGoalNotes": undefined,
  "documentNames": ["pitch.pdf"],
  "decisionHorizon": "3 months",
  "decisionHorizonDropdown": "3_months",
  "clarityLevel": "some_clarity",
  "dataAvailable": ["qualitative"],
  "riskLevel": "medium"
}
```

**Verification:** `frontend/src/lib/intake-mapping.test.ts` exports `runMappingTest()` which compares `intakeAnswersToDiagnosticData("startup_founder", UNIFIED)` against the expected legacy shape above. All keys and values match the legacy `buildDiagnosticData()` output for the same inputs.

---

## 4. Confirmation checklist

- **runDiagnosticRun unchanged:** Intake calls `runDiagnosticRun({ onboarding_context, diagnostic_data })` with the same contract; no changes to `clear-api.ts` or backend.
- **Result routing identical:** On success, intake redirects to `router.push(\`/diagnostic/result/${res.decision_id}\`)`; if `res.idea_stage`, redirects to `/diagnostic/idea-stage`.
- **Legacy wizards not removed:** `/diagnostic/run` and `/diagnostic/msme` still render `DiagnosticWizard` and `MSMEDiagnosticWizard`; linked from the new `/diagnostic` footer.
