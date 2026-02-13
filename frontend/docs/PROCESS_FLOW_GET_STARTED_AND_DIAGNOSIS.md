# Process flow: Get Started vs Diagnosis

## Current (intended) flows

### 1. Get Started page (`/get-started`)
- **Purpose:** Lead capture / qualification (company, industry, employees, stage, biggest challenge, name, email, phone).
- **On submit (before fix):** Only showed an alert: "We'll contact you within 24 hours." No API call, no redirect to diagnosis.
- **On submit (after fix):** Same thank-you message, then **redirect to the relevant AI diagnostic** so the user can proceed with diagnosis immediately.

### 2. AI diagnostic flow (actual diagnosis)
- **Routes:** `/cfo/diagnostic`, `/cmo/diagnostic`, `/coo/diagnostic`, `/cto/diagnostic`.
- **Purpose:** Run the AI agent (CFO/CMO/COO/CTO) and get an analysis.
- **Flow:**
  1. User opens e.g. `/cfo/diagnostic`.
  2. Fills the **agent-specific** form (CFO has financial fields, CMO marketing, etc.).
  3. Submits → frontend calls `POST /api/cfo/diagnose` (or respective agent).
  4. Backend runs the diagnostic, saves analysis, returns analysis id.
  5. Frontend redirects to e.g. `/cfo/analysis/[id]` to show the result.
- **Creating a decision from analysis:** From the analysis page, user can use "Bootstrap from analysis" (CLEAR) to create a governed decision.

### 3. New decision page (`/decisions/new`)
- **Purpose:** Create a **blank** draft decision (no diagnostic). For bootstrapping from an analysis, the flow is: run diagnostic → open analysis → use "Bootstrap from analysis" there.
- **Not** the page for "filling diagnostic details" or running a diagnosis.

### 4. Enterprise dashboard (`/enterprise/[id]/dashboard`) and Institutional (`/institutional/portfolios`)
- **Purpose:** Read-only governance views (Phase 3/4). Require backend running and existing data.
- **Not** part of the "Get Started → diagnosis" flow.

## Where correction was made

- **Get Started:** After submit, user is now redirected to the diagnostic page that matches their "Biggest Challenge" so they can **proceed with diagnosis** instead of only seeing the alert.
