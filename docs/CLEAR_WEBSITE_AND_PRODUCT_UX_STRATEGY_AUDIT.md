# CLEAR Website & Product UX Strategy Audit

**Role:** Senior product strategist & UX systems architect (advisory only — no edits to the website).  
**Canonical definition:** CLEAR is a decision and execution governance platform that helps enterprises turn business problems into structured decisions, clear execution plans, and measurable outcomes while optionally enabling controlled visibility for capital providers.  
**Stakeholders:** (1) Enterprise operators / MSMEs, (2) Founder-led startups, (3) Capital partners (banks, VCs, grant providers, impact investors).

---

## Part A — Website Experience Architecture

### A.1 Homepage narrative flow

| Block | Current state | Purpose |
|-------|----------------|--------|
| **Hero** | Headline: “Turn messy business problems into a disciplined plan”; subline: “A repeatable way to diagnose, plan, and track execution — for founders and the people who back them.” | Value in one sentence; aligns with canonical “structured decisions, execution, outcomes.” |
| **Primary CTA** | “Get started in 10 minutes” → `/get-started` | **Gap:** Primary CTA goes to lead-capture form, not to diagnostic. Canonical “problem intake” suggests diagnostic should be the first product action. |
| **Secondary CTA** | “See how it works” → `/how-it-works` | Trust / education. |
| **Visual card** | 3-step strip: Diagnose (Complete), Plan (In Progress), Execute (Pending) | Communicates workflow; no click-through. |
| **Role selector** | “Who are you?” — Founder / Investor / Raising (3 cards) | **Present.** Founder → `/diagnostic?role=founder`, Investor → `/institutional/portfolios`, Raising → `/diagnostic?role=raising`. |
| **Who it’s for, CTA, Partners** | WhoItsForSection, CTASection, PartnersSection | Trust and conversion. |

**Summary:** Narrative is coherent. The only structural mismatch is hero CTA (“Get started”) leading to a form instead of problem intake (diagnostic). Topbar “Start diagnostic” correctly points to `/diagnostic`.

---

### A.2 Stakeholder entry paths

| Stakeholder | Intended entry | Current path | Notes |
|-------------|----------------|--------------|--------|
| **Enterprise operators (MSME)** | Problem intake → diagnostic → decision → execution | Home → “Get started” (form) or “Start diagnostic” (nav) → `/diagnostic` → “SME / MSME” → `/diagnostic/msme`; or Home → Role “Founder” → `/diagnostic` → Startup founder or MSME. Book-diagnostic → CFO/CMO/COO/CTO. | Two funnels: (1) CLEAR multi-step diagnostic (founder 8-step, MSME 4-step), (2) legacy single-agent (CFO/CMO/COO/CTO). MSME path exists; “by area” is via `/book-diagnostic`. |
| **Founder-led startups** | Separate onboarding funnel, same execution engine | Role card “Founder” or “Raising” → `/diagnostic` → “Startup founder” → `/diagnostic/run` (8-step wizard) → result → workspace. | Separate funnel is present (founder vs MSME choice on `/diagnostic`). Same execution engine (decisions, milestones, outcome reviews). |
| **Capital partners** | Portfolio visibility, governance, controlled sharing | Role card “Investor” → `/institutional/portfolios`. No nav link to institutional in marketing Topbar. | **Gap:** Capital partners land on `/institutional/portfolios` without a dedicated “For capital partners” story or login gate; experience is URL-known, not narrative-led. |

---

### A.3 Product explanation sections

| Section | Route | Content | Alignment |
|---------|--------|---------|-----------|
| How it works | `/how-it-works` | 4 steps: Share SME profile, Decision diagnostic (Option A general / Option B by area), AI analysis, Execute & impact | Describes both CLEAR diagnostic and legacy by-area flow; “Execute & impact” matches execution/outcomes. |
| Who we help | `/who-we-help` | Target audience | Supports positioning. |
| Why Exec-Connect | `/why-exec-connect` | Value proposition | Naming still “Exec-Connect” in places; CLEAR branding on logo/nav. |
| About | `/about` | AboutHero, TargetAudience, BeforeAfter, HowItWorks, SystemDiagram, Artifacts, UseCases, AboutCTA | Deep trust layer; “Built for the whole table” (Founders / Leadership / Investors) per `ABOUT_US_ROLE_FLOWS_REFERENCE.md`. |
| Case studies | `/case-studies` | Proof points | Trust. |
| Insights / Ecosystem | `/insights`, `/ecosystem` | Content | Awareness. |

---

### A.4 Trust and credibility layers

- **About:** Role-based value (Founders / Leadership / Investors) with flows and CTAs.
- **Case studies, Insights, Ecosystem:** Proof and context.
- **CXOs / Book CXO:** Human advisor layer (book-call, book-diagnostic, book-cxo).
- **No explicit:** Security, compliance, or “governance credibility” page (e.g. immutability, audit trail). Backend has proofs in `backend/docs/proofs/` and contract API; not surfaced on site.

---

### A.5 Conversion points

| Point | Location | Target | Current |
|-------|----------|--------|---------|
| Primary | Hero | Start problem intake | “Get started in 10 minutes” → `/get-started` (lead form). |
| Role-based | Role selector | Founder / Investor / Raising | Founder & Raising → `/diagnostic`; Investor → `/institutional/portfolios`. |
| Topbar | All marketing pages | Start diagnostic / Log in | “Start diagnostic” → `/diagnostic`; “Log in” → `/login`. |
| Get started submit | `/get-started` | Proceed to agent diagnostic | “Proceed to [Agent] diagnostic” → `/cfo|.../diagnostic`. |
| Diagnostic result | `/diagnostic/result/[run_id]` | Workspace, playbooks, advisor, human review | Three cards + “Open Decision Workspace.” |
| Decision workspace | Execution tab | Commit plan, outcome review, invite | Commit execution plan, add outcome review, invite advisor/capital partner. |

---

### A.6 Demo or onboarding pathways

- **No dedicated “demo” flow** (e.g. sandbox or guided tour).
- **Onboarding:** Optional context on `/diagnostic` (overlay: name, country, industry, size, email) stored in `localStorage`; Get Started form captures similar data and routes to single-agent diagnostic.
- **Post-diagnostic:** Result page clearly offers “Open Decision Workspace,” “Open playbooks,” “Open advisor chat,” “Request human review.”

---

### A.7 Capital partner entry experience

- **Entry:** Homepage role card “I invest in or support many businesses” → “View portfolios” → `/institutional/portfolios`.
- **No** dedicated “For capital partners” or “For investors” landing page explaining governance, readiness, portfolio view, and invite model.
- **No** capital-partner-specific nav item; institutional routes are URL-only (no Topbar link).
- **Flow once in:** Portfolios list → portfolio detail → enterprises → enterprise snapshot (decisions by domain, execution, exports). No in-app explanation of what “readiness” or “decision record” means for them.

---

### A.8 Founder entry experience

- **Entry:** Role card “I run a business…” or “I’m preparing to raise…” → `/diagnostic` → “Startup founder” → `/diagnostic/run` (8-step wizard).
- **Flow:** Wizard → result → playbooks / advisor chat / human review / Decision Workspace. Clear and aligned with “problem intake → diagnostic → decision → execution.”

---

### A.9 Enterprise operator entry experience

- **Entry:** Same role card as founder, or “Get started” → form → single-agent diagnostic; or `/diagnostic` → “SME / MSME” → `/diagnostic/msme` (4-step); or “Choose Finance, Growth, Ops, or Tech” → `/book-diagnostic` → agent diagnostic.
- **Fragmentation:** Three entry types (CLEAR general, CLEAR MSME, legacy by-area). All eventually feed decision/execution; by-area path goes through analysis then optional “bootstrap” to CLEAR decision.

---

## Part B — Product User Journey (Step-by-Step)

### B.1 Account creation and onboarding

| Step | Current state | Gap / note |
|------|----------------|------------|
| Sign up | `/signup` exists | Auth exists; not required for diagnostic (guest can run). |
| Log in | `/login`; Topbar “Log in” | Clear. |
| Verify | `/auth/verify` (e.g. magic link) | Present. |
| Onboarding | Optional overlay on `/diagnostic`; Get Started form on `/get-started` | No single “onboarding” funnel; context is optional and stored client-side for diagnostic. |
| Post-login home | `/dashboard` (Workspace home: last decision, decisions list, domain chats) | Dashboard exists; no role-specific onboarding (e.g. “You’re a capital partner” vs “You’re a founder”). |

---

### B.2 Problem intake experience

| Path | Steps | Notes |
|------|--------|--------|
| **CLEAR founder** | `/diagnostic` → “Startup founder” → `/diagnostic/run` → 8 steps (operating gate, stage, situation, clarifiers, urgency, goal, horizon, generate) → submit | **Voice:** Optional voice input on some wizard fields (`VoiceInputButton` in DiagnosticWizard). |
| **CLEAR MSME** | `/diagnostic` → “SME / MSME” → `/diagnostic/msme` → 4 steps → generate | MSME-specific “which of these feel most true” style. |
| **By-area (legacy)** | `/book-diagnostic` or Get Started → choose agent → `/cfo|.../diagnostic` → form → POST diagnose | **Voice:** Voice input available on CFO/CMO/COO/CTO diagnostic forms and in agent chat. |
| **Idea-stage** | Wizard step 1 “operating/revenue” = no → off-ramp to `/diagnostic/idea-stage` | Clear off-ramp; no full diagnostic. |

**Canonical “problem intake (voice or text)”:** Text is primary; voice is available in wizard and agent forms/chats via `VoiceInputButton` and `/api/transcribe`. Not surfaced as a headline “start by voice” on homepage.

---

### B.3 Diagnostic interpretation screen

| Screen | Route | Content |
|--------|--------|--------|
| **CLEAR result** | `/diagnostic/result/[run_id]` | Decision snapshot (statement, why now, constraints, success metric, timeframe); three “what next” cards: Playbooks, AI advisor, Human review; “Open Decision Workspace.” |
| **Single-agent analysis** | `/cfo|.../analysis/[id]` | Summary, risks, recommendations, action plan; “Bootstrap from analysis” to CLEAR decision not always prominent (doc note: add on analysis page). |

Diagnostic interpretation is present; CLEAR result is well structured. Single-agent analysis → CLEAR decision could be more prominent.

---

### B.4 Decision creation workflow

| Step | Where | Current |
|------|--------|--------|
| From diagnostic | Result page “Open Decision Workspace” | Links to `/decisions/[id]` (decision already created by diagnostic run). |
| Blank decision | Sidebar “New decision” → `/decisions/new` | Copy says run diagnostic first then bootstrap; no direct “create from analysis” in nav. |
| From analysis | Backend: bootstrap-from-analysis API | Frontend: optional “Bootstrap from analysis” on analysis pages (inconsistent). |
| Decision workspace | `/decisions/[id]` | Tabs: Overview, Artifact, Execution, Chat, Timeline. Artifact = decision record (draft); finalize / sign-off available. |

Decision creation is supported; main gap is discoverability of “create from analysis” for users who came via single-agent path.

---

### B.5 Execution tracking workflow

| Element | Location | Current |
|---------|----------|--------|
| Execution plan (EMR) | Decision workspace → Execution tab | Cadence, next review date, expected outcome, outcome review reminder. |
| Commit plan | Same tab | “Commit execution plan” button; plan becomes committed. |
| Milestones / tasks | Same tab | List milestones; create/edit/delete; owner, due date, status, notes. |
| Progress | Dashboard + Decision workspace Timeline | Dashboard shows upcoming milestones; Timeline shows decision/domain/readiness and outcome review. |

Execution tracking is implemented (owners, timelines, milestones, commit, outcome review).

---

### B.6 Review and outcome learning workflow

| Element | Where | Current |
|---------|--------|--------|
| Outcome review | Decision workspace → Execution tab | “Outcome reviews” section: add review (summary, what worked, what didn’t, learnings, assumptions validated/broken, readiness impact, keep/raise/reduce/stop). List of past reviews. |
| Next review date | EMR config | “Next review” date; UI prompts when passed. |
| Institutional memory | Ledger, artifact versions, evidence | Ledger is append-only; artifact history; evidence links. Backend stores outcome reviews. |

Review and outcome learning are present and aligned with “measurable outcomes” and “institutional memory.”

---

### B.7 Sharing and permission controls

| Feature | Where | Current |
|---------|--------|--------|
| Invite advisor | Decision workspace → Execution tab | “Invite an advisor”: name, email, role label; sends invite; shareable link. Advisor can review decision and leave structured review. |
| Invite capital partner | Same card | Role selector “advisor” vs “capital_partner”; capital partner gets enterprise-level invite (member) with link. |
| Viewing role | Workspace | `getViewingRole`; UI can show read-only vs edit. |
| Enterprise-controlled sharing | Backend + invite flows | Enterprise controls who is invited to which decision; capital partner sees what they’re granted. |

Sharing is enterprise-controlled; invite flows exist. No explicit “sharing settings” or “permission matrix” page—controls are per-decision invite.

---

### B.8 Capital provider portfolio dashboard flow

| Step | Route | Current |
|------|--------|--------|
| List portfolios | `/institutional/portfolios` | Table: name, # enterprises, average readiness, last activity. Row → portfolio detail. |
| Portfolio detail | `/institutional/portfolios/[portfolioId]` | Enterprises in portfolio; filters (readiness, domain, no_review_days per docs). |
| Enterprise snapshot | `/institutional/enterprises/[enterpriseId]` | Decisions by domain, execution, outcomes, capability trend, financing; export enterprise (JSON/CSV), export per-decision. |
| Enterprise dashboard (Phase 3) | `/enterprise/[enterpriseId]/dashboard` | Financing readiness (latest), capability scores table. URL-only; no nav. |

Portfolio visibility and enterprise snapshot are implemented. Gaps: no Topbar entry for capital partners; no “empty state” or “Log in to see portfolios” on `/institutional/portfolios` for unauthenticated users (behavior depends on API).

---

## Part C — Functional Alignment Audit

| Core platform function | Stakeholder(s) | Problem it solves | In CLEAR concept? | In current build? | Missing / gap |
|------------------------|---------------|--------------------|-------------------|-------------------|---------------|
| Problem intake (voice or text) | Enterprise, Founder | Capture situation so system can interpret | Yes | Yes (text primary; voice in wizard + agent forms/chats) | Voice not promoted as primary entry on marketing. |
| Diagnostic interpretation across domains | Enterprise, Founder | Structured snapshot, constraints, next steps | Yes | Yes (CLEAR run + synthesis; single-agent analysis) | Two paths (CLEAR vs by-area); by-area bootstrap to decision under-promoted. |
| Decision workspace (commit to path) | Enterprise, Founder | Single place to record, evidence, finalize, sign off | Yes | Yes (`/decisions/[id]`, artifact, ledger, finalize, sign-off) | — |
| Execution planning (owners, timelines, milestones) | Enterprise, Founder | Clear plan and accountability | Yes | Yes (EMR, milestones, commit plan) | — |
| Progress tracking and outcome review | Enterprise, Founder | Measure results and learn | Yes | Yes (milestones, outcome reviews, next review date) | — |
| Institutional memory (decisions and results) | All | Audit trail, replay, learning | Yes | Yes (ledger, artifact history, evidence, outcome reviews) | Not explained on marketing. |
| Enterprise-controlled sharing for capital partners | Enterprise, Capital | Enterprise chooses what to share | Yes | Yes (invite advisor / capital partner per decision) | No “sharing dashboard” or permission summary. |
| Portfolio visibility dashboard | Capital | See portfolio health, readiness, last decision | Yes | Yes (`/institutional/portfolios`, detail, enterprise snapshot) | No nav entry; no capital-partner landing; auth/empty state for `/institutional/portfolios` not clearly designed. |
| Founder-specific funnel | Founder | Separate path, same engine | Yes | Yes (`/diagnostic` → Startup founder → 8-step) | — |
| Capital partner entry and narrative | Capital | Trust and adoption | Yes | Partial (role card → portfolios; no “For investors” page) | Dedicated capital-partner story and nav. |

---

## Part D — Missing Layer Detection

### D.1 Enterprise trust

- **Present:** About, case studies, role-based value, human review and book-call.
- **Missing or weak:** No explicit “Security” or “Governance” page. Immutability, contract API, and proof artifacts exist in backend/docs but are not surfaced. A short “How we protect your decisions” or “Governance and audit” section would support enterprise trust.

### D.2 Capital partner adoption

- **Missing:** (1) Dedicated “For capital partners” or “For investors” page (value: portfolio view, readiness, decision record, no heavy reporting). (2) Nav or footer entry to institutional/portfolios or “Partner login.” (3) Clear behavior when an unauthenticated user hits “View portfolios” (login wall vs empty state). (4) In-app explanation of readiness bands and what “decision record” means for them.

### D.3 Long-term engagement

- **Present:** Dashboard, decision list, milestones, outcome reviews, next review date, resources/playbooks.
- **Missing:** No explicit “retention” loop on the website (e.g. “Review due” in Topbar, or email reminder copy). No product-led “come back” narrative on marketing pages.

### D.4 Data learning loops

- **Present:** Outcome reviews (what worked, learnings, assumptions, readiness impact); stored and listed per decision; capability/readiness backend.
- **Missing:** No user-facing “Your insights over time” or “Portfolio learnings” view. Data is there; learning loop is not surfaced as a product feature on site or in app.

### D.5 Governance credibility

- **Present:** Ledger, append-only artifact, evidence, finalize/sign-off, contract API, proofs in backend.
- **Missing:** No public or partner-facing statement of governance (e.g. “Decisions are immutable,” “Evidence is linked,” “Audit trail available”). Would support capital partners and compliance-minded enterprises.

### D.6 Revenue model alignment

- **Not visible:** No pricing, “Contact sales,” or “For teams” page found in the mapped routes. If CLEAR is B2B or tiered, a clear conversion path (e.g. “Talk to us” or “See plans”) is missing from the mapped experience.

---

## Part E — Recommended Website Structure

### E.1 Recommended sitemap (high level)

```
/ (Home)
├── Role selector → /diagnostic (founder/raising) or /institutional/portfolios (investor)
├── How it works (/how-it-works)
├── Who we help (/who-we-help)
├── Why CLEAR (/why-exec-connect)        ← align naming
├── Case studies (/case-studies)
├── Insights (/insights)
├── Ecosystem (/ecosystem)
├── About (/about)
├── For capital partners (/for-partners)  ← NEW: value + CTA to login/portfolios
├── Get started (/get-started)           ← keep; consider secondary to “Start diagnostic”
├── Book a call (/book-call)
├── Book diagnostic (/book-diagnostic)
├── CXOs (/cxos, /cxos/[id], /book-cxo/[id])
│
├── Diagnostic (gate)
│   ├── /diagnostic                     → Who are you? (Founder / MSME)
│   ├── /diagnostic/run                 → Founder 8-step
│   ├── /diagnostic/msme                → MSME 4-step
│   ├── /diagnostic/idea-stage          → Off-ramp
│   └── /diagnostic/result/[run_id]    → Snapshot + next actions
│
├── Auth
│   ├── /login, /signup, /auth/verify
│
├── App (sidebar)
│   ├── /dashboard
│   ├── /decisions, /decisions/new, /decisions/[id]
│   ├── /resources
│   ├── /human-review
│   ├── /cfo|/cmo|/coo|/cto (hub, diagnostic, analysis, chat)
│   └── /advisor, /advisor/enterprises, /advisor/decisions/[id], /advisor/enterprises/[id]
│
└── Institutional (capital; URL or post-login nav)
    ├── /institutional/portfolios
    ├── /institutional/portfolios/[portfolioId]
    ├── /institutional/enterprises/[enterpriseId]
    └── /enterprise/[enterpriseId]/dashboard
```

### E.2 Navigation structure (recommendations)

| Area | Current | Recommendation |
|------|--------|----------------|
| **Topbar (marketing)** | Home, How it works, Who we help, Case studies, Insights, About; Log in, Start diagnostic | Keep. Consider: (1) “Start diagnostic” as primary CTA. (2) Add “For partners” linking to `/for-partners` or `/institutional/portfolios` with brief copy. |
| **Topbar (app)** | CLEAR, DecisionFlow; Workspace, My Decisions, Reports; Search, Notifications, Profile | Keep. For capital-partner role: add “Portfolios” to app nav when user has institutional access. |
| **Sidebar** | Home, Decision areas (Decision Workspace, Advisor, Finance, Growth, Ops, Tech); context-specific (e.g. CFO: Diagnostic, History, Chat) | Keep. Consider “Decision Workspace” as first item for clarity. |
| **Footer** | Per current | Add “For capital partners” and “Governance & security” (if you add that page). |

### E.3 Conversion-optimized flows

1. **Homepage hero:** Option A — Primary CTA = “Start diagnostic” → `/diagnostic` (problem intake first). Option B — Keep “Get started” but add a clear secondary “Start diagnostic” so both lead capture and product entry are obvious.
2. **Role selector:** Keep; ensure “View portfolios” for investors either (a) goes to a “For partners” page first, then login/portfolios, or (b) goes to login when unauthenticated with return URL to portfolios.
3. **After diagnostic result:** Current three cards + “Open Decision Workspace” are clear; no change required except ensuring “Open advisor chat” tags the session to the decision (backend supports; frontend to verify).
4. **Capital partner:** One clear path: Home → “For partners” (or role card) → short value story → Log in → Portfolios → Portfolio detail → Enterprise snapshot. Add “Portfolios” to app Topbar when user has institutional role.

### E.4 Clarity and trust

- **Single “start” for product:** Prefer one primary product CTA: “Start diagnostic” (problem intake). Keep “Get started” for lead capture but position as secondary or “Get a guided intro.”
- **Naming:** Use “CLEAR” consistently (Why CLEAR, not only Exec-Connect) where the product is CLEAR.
- **Governance:** Add a short “Governance & audit” or “How CLEAR protects your decisions” section (About or dedicated page) linking immutability, evidence, and audit trail without exposing implementation detail.
- **Capital partners:** One “For capital partners” page + one nav or footer entry + clear login/empty state for portfolios.

---

## Summary

- **Website experience:** Homepage narrative and role selector align with CLEAR’s purpose. Main gaps: hero CTA goes to lead form instead of diagnostic; capital partners have no dedicated story or nav; governance/trust is under-surfaced.
- **Product journey:** Problem intake (text + optional voice), diagnostic interpretation, decision workspace, execution with owners/milestones, outcome review, and institutional memory are implemented. Sharing and invite are enterprise-controlled; portfolio dashboard exists but is URL-only and not narrative-led for investors.
- **Functional alignment:** All canonical capabilities are present; gaps are discoverability (bootstrap from analysis, voice as first-class), capital partner narrative and entry, and explicit governance/trust and revenue conversion on the site.
- **Recommended focus:** (1) Align hero CTA with “Start diagnostic” or make both CTAs explicit. (2) Add “For capital partners” page and nav/footer entry; clarify login/empty state for portfolios. (3) Add a short governance/trust layer. (4) Optionally add “Portfolios” to app nav for institutional users and a “Governance & security” or “How we protect your decisions” section.

This audit is advisory only; no changes have been made to the website or codebase.
