# CLEAR runbook — guest flow (decision governance, EMR, outcome review, readiness, chat)

**Purpose:** Step-by-step verification that the extended CLEAR flow works end-to-end for a guest user.

---

## Primary ICP and wedge

- **ICP:** Operating companies with **5–100 people**, **RM1m–RM20m** equivalent revenue, needing **cash and operations discipline** (SMEs or tech-enabled SMEs, founder-led).
- **Wedge:** **Cash and execution discipline** for founder-led businesses. Product and content (diagnostic, EMR, advisor, knowledge) are tuned for this wedge first.

---

## As a guest user

1. **Run diagnostic**
   - Go to `/diagnostic`.
   - Optionally click “Add context” and fill name, industry, etc.; Save or Skip.
   - Click “Begin diagnostic” → `/diagnostic/run`.
   - Complete the wizard and “Generate snapshot”.
   - On success you are redirected to `/diagnostic/result/{decision_id}`.

2. **See Decision Snapshot**
   - On the result page you see the **Decision Snapshot** block (decision_statement, why_now, first_actions, risks, success_metric, timeframe).
   - Use “Open Decision Workspace” (or equivalent) to go to `/decisions/{decision_id}`.

3. **View governance**
   - In the Decision Workspace, open the **Artifact** tab.
   - The **Governance** card shows: decision_type, risk_tier, required_approvers, approval_status.
   - Use “Cycle approval: draft → next” to move status: draft → pending_approval → approved (no auth; current user can change for now).

4. **View and tweak EMR**
   - Open the **Execution** tab.
   - **EMR — Milestones**: list of milestones from the artifact (title, owner, due_date) with status dropdown (pending / in_progress / done). Change status to update the artifact.
   - **EMR — Metrics**: name, target+unit, actual (editable); source label.
   - **EMR — Config**: cadence and next_review_date; you can change the next review date.
   - All EMR edits are saved via PATCH to the decision artifact.

5. **Readiness to approve (soft warning)**
   - On Execution, if the decision has no capability gaps, or no EMR milestones, or no EMR metrics, a **warning** is shown: “Readiness to approve: add at least one capability gap, one milestone, and one metric …”. This is informational only; saving is not blocked.

6. **Capital readiness**
   - At the top of the Decision Workspace you see: “Capital readiness for this decision: **Nascent** | **Emerging** | **Institutionalizing**” with a short tooltip (“Based on milestones, reviews, and approvals”).

7. **Add an Outcome Review (when review date is reached)**
   - When today’s date is **≥** `emr.config.next_review_date`, the Execution tab shows an “Add outcome review” button.
   - Click it to open the outcome review form (summary, what_worked, what_did_not_work, key_learnings, assumptions_validated, assumptions_broken, readiness_impact −1/0/+1).
   - Submit → POST `/api/clear/decisions/{id}/outcome-review`; the new review appears in the list below. Previous reviews are always listed with date and summary.

8. **Chat tab — seeded first message**
   - Open the **Chat** tab (e.g. from result page: “Talk to AI advisor” → `/decisions/{id}?tab=chat&from_diagnostic=1`).
   - The app calls `POST /api/clear/decisions/{id}/chat/start` once; you see the **initial assistant message** (greeting, restated decision, one next question).
   - Type in the input and Send → `POST .../chat/message` with session_id and message; the assistant reply appears in the thread. Domain chat links (Finance, Growth, Ops, Tech) remain available.

---

## Quick checklist

- [ ] Diagnostic run → result page → Decision Snapshot visible  
- [ ] Decision Workspace → Artifact tab → Governance card (type, risk, approvers, status) and cycle approval  
- [ ] Execution tab → EMR milestones/metrics/config visible and editable; PATCH updates artifact  
- [ ] Execution tab → “Readiness to approve” warning when gaps/milestones/metrics missing  
- [ ] Header → Capital readiness band + tooltip  
- [ ] When next_review_date ≤ today → “Add outcome review” → form → submit → review in list  
- [ ] Chat tab → first message from backend; send message → assistant reply in decision context  

---

## Portfolio and roles (v0)

- **Create org (portfolio):** Portfolios are created outside CLEAR (e.g. admin or script). Use the same Portfolio/Institution model your app uses; CLEAR does not add a separate "Organisation" table. Enterprises are linked to a portfolio via your existing schema.
- **Attach enterprises:** When a user runs a diagnostic with onboarding (name, country, industry), the run service may get-or-create an Enterprise and attach it to the run’s decision. Decisions then have `enterprise_id`; portfolio enriched view lists enterprises that have at least one decision.
- **Portfolio dashboard:** Go to `/institutional/portfolios/{portfolioId}`. The page calls GET `/api/clear/orgs/{portfolioId}/portfolio` and shows a table: enterprise, country, industry, readiness_band, last_primary_domain, last_review_date, has_committed_plan, link to decision. Use filters: readiness band, primary domain, no review in N days.
- **Invite advisor or capital partner:** In the Decision Workspace (Execution tab), when viewing as founder and the decision has `enterprise_id`, use the "Invite to workspace" card: enter email, choose role (Advisor / Capital partner), click Invite. Copy the magic-link URL and share it; the invitee opens the decision with `?token=...` and sees "Viewing as: advisor" or "capital_partner". Advisor can add outcome reviews and comments; capital partner is read-only; only founder can commit plan and invite.
- **Timeline and readiness:** In the Decision Workspace, open the "Timeline" tab (when the decision has an enterprise) to see other decisions for that enterprise (date, domain, readiness, statement, has review). Readiness band (Nascent / Emerging / Institutionalizing) is shown in the header and reflects milestones, outcome reviews, and approval.

---

## Notes

- **Guest mode:** No login required; all flows work without authentication.
- **Onboarding:** Optional and non-blocking; used in synthesis narrative and chat context when provided.
- **Homepage / single-agent:** Unchanged; no removal of the single-agent diagnostic route or flag.
