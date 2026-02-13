# CLEAR: Page inventory, design brackets, flows & persona design brief

**Purpose:** Before visual design, (1) know how many pages exist and group them so design can be uniform; (2) understand flow and links between pages/functions; (3) audit the site through four “heads” (MSME, Be Noor Capital founder, capital provider/startup founder, designer); (4) support role-based landing and clearer user journeys.

**Audience:** You (product), a hired designer, and anyone aligning flows to roles.

---

## 1. Page inventory (all routes)

Total: **~50 distinct routes** (some are dynamic, e.g. `[id]`).

| # | Route | Purpose (one line) |
|---|--------|---------------------|
| 1 | `/` | Landing (home) |
| 2 | `/about` | About |
| 3 | `/how-it-works` | How CLEAR works |
| 4 | `/who-we-help` | Who we help |
| 5 | `/why-exec-connect` | Why Exec-Connect |
| 6 | `/get-started` | Get started (quiz → diagnostic path) |
| 7 | `/book-call` | Book a call |
| 8 | `/book-diagnostic` | Book diagnostic (links to CFO/CMO/COO/CTO diagnostic) |
| 9 | `/case-studies` | Case studies |
| 10 | `/ecosystem` | Ecosystem |
| 11 | `/insights` | Insights (articles list) |
| 12 | `/cxos` | CXO cards / book CXO |
| 13 | `/cxos/[id]` | Single CXO profile |
| 14 | `/book-cxo/[id]` | Book a specific CXO |
| 15 | `/diagnostic` | Diagnostic entry (gate: “Start diagnostic” → run) |
| 16 | `/diagnostic/start` | Redirects to `/diagnostic` |
| 17 | `/diagnostic/run` | **CLEAR multi-step wizard** (operating gate, questions, generate snapshot) |
| 18 | `/diagnostic/idea-stage` | Idea-stage off-ramp (no full diagnostic) |
| 19 | `/diagnostic/result/[run_id]` | **Result page** (snapshot + “What next”: playbook, advisor, human review) |
| 20 | `/resources` | Playbooks / suggested resources (filter by decision_id, primary_domain) |
| 21 | `/human-review` | Request human review (form; decision_id in query) |
| 22 | `/decisions` | Decision list |
| 23 | `/decisions/new` | New decision (or “Create from diagnostic”) |
| 24 | `/decisions/[id]` | **Decision workspace** (Overview, Artifact, Execution, Chat, Timeline) |
| 25 | `/cfo` | Finance hub (diagnostic, history, chat) |
| 26 | `/cfo/diagnostic` | Single-agent CFO diagnostic form |
| 27 | `/cfo/analysis/[id]` | CFO analysis detail |
| 28 | `/cfo/history` | CFO analyses history |
| 29 | `/cfo/chat` | Finance chat |
| 30 | `/cmo` | Growth hub |
| 31 | `/cmo/diagnostic` | CMO diagnostic |
| 32 | `/cmo/analysis`, `/cmo/analysis/[id]` | CMO analyses list + detail |
| 33 | `/cmo/chat` | Growth chat |
| 34 | `/coo` | Ops hub |
| 35 | `/coo/diagnostic` | COO diagnostic |
| 36 | `/coo/analysis`, `/coo/analysis/[id]` | COO analyses + detail |
| 37 | `/coo/chat` | Ops chat |
| 38 | `/cto` | Tech hub |
| 39 | `/cto/diagnostic` | CTO diagnostic |
| 40 | `/cto/analysis`, `/cto/analysis/[id]` | CTO analyses + detail |
| 41 | `/cto/chat` | Tech chat |
| 42 | `/login` | Login |
| 43 | `/signup` | Sign up |
| 44 | `/auth/verify` | Auth verify (e.g. magic link) |
| 45 | `/dashboard` | **Logged-in home** (last decision, decisions list, domain chats) |
| 46 | `/institutional/portfolios` | Portfolio list |
| 47 | `/institutional/portfolios/[portfolioId]` | **Portfolio detail** (enriched enterprises, filters) |
| 48 | `/institutional/enterprises/[enterpriseId]` | Enterprise detail (institutional view) |
| 49 | `/enterprise/[enterpriseId]/dashboard` | Enterprise dashboard (readiness, etc.) |

---

## 2. Design brackets (group pages for uniform design)

Group pages so layout, components, and tone stay consistent within each bracket. A designer can treat each bracket as one “family” of screens.

| Bracket | Name | Pages (routes) | Design intent |
|---------|------|----------------|---------------|
| **A** | **Landing & marketing** | `/`, `/about`, `/how-it-works`, `/who-we-help`, `/why-exec-connect`, `/get-started`, `/book-call`, `/book-diagnostic`, `/case-studies`, `/ecosystem`, `/insights`, `/cxos`, `/cxos/[id]`, `/book-cxo/[id]` | Public, trust-building, conversion. One visual system: hero, sections, CTAs. |
| **B** | **CLEAR diagnostic flow** | `/diagnostic`, `/diagnostic/run`, `/diagnostic/idea-stage`, `/diagnostic/result/[run_id]` | Single linear journey: entry → wizard → result. Minimal chrome; focus on steps and outcome. |
| **C** | **Post-diagnostic actions** | `/resources`, `/human-review` | “What next” surfaces: playbooks and human review. Can reuse result-page card style or a simple list/form. |
| **D** | **Decision workspace** | `/decisions`, `/decisions/new`, `/decisions/[id]` | App-like: list, create, then workspace with tabs (Overview, Artifact, Execution, Chat, Timeline). Dense but structured. |
| **E** | **Single-agent (legacy) hubs** | `/cfo`, `/cfo/diagnostic`, `/cfo/analysis`, `/cfo/analysis/[id]`, `/cfo/history`, `/cfo/chat` (and same for cmo, coo, cto) | Per-domain hub + diagnostic + history + chat. Can be one pattern repeated for CFO/CMO/COO/CTO. |
| **F** | **Auth & account** | `/login`, `/signup`, `/auth/verify`, `/dashboard` | Auth forms + dashboard as “home” after login. |
| **G** | **Institutional (capital / portfolio)** | `/institutional/portfolios`, `/institutional/portfolios/[portfolioId]`, `/institutional/enterprises/[enterpriseId]`, `/enterprise/[enterpriseId]/dashboard` | Data-dense; tables, filters, links to decisions. Feels like “back office” or partner view. |

**Summary for designer**

- **A** = Marketing site (many pages, one system).
- **B + C** = CLEAR “diagnosis → what next” (short flow).
- **D** = Core product: decision and execution (tabs, forms, lists).
- **E** = Domain-specific paths (repeat one pattern × 4 domains).
- **F** = Sign-in and user home.
- **G** = Institutional/partner view (portfolios, enterprises).

---

## 3. Flow and links (how pages connect)

### 3.1 High-level flow (CLEAR wedge: diagnosis → execution)

```
Landing (/) or Get started (/get-started)
    → Diagnostic entry (/diagnostic)
        → Wizard (/diagnostic/run)
            → [Idea-stage?] → Off-ramp (/diagnostic/idea-stage)
            → [Operating]   → Result (/diagnostic/result/[run_id])
                                → Resources (/resources?decision_id=…)
                                → AI Advisor → Decision workspace Chat tab (/decisions/[id]?tab=chat)
                                → Human review → Form (/human-review?decision_id=…)
                                → Open workspace → (/decisions/[id])
                                        → Tabs: Overview, Artifact, Execution (EMR, commit, outcome reviews, invite, comments), Chat, Timeline
    → Decision list (/decisions) ↔ New decision (/decisions/new) ↔ Workspace (/decisions/[id])
    → Dashboard (/dashboard) → diagnostic, last decision, decisions, domain chats
```

### 3.2 Link map (key transitions)

| From | To (main links) |
|------|------------------|
| `/` | `/diagnostic`, `/get-started`, `/#how-it-works`, `/#why-clear`, `/#playbooks`, `/about` |
| `/get-started` | Single-agent diagnostic (e.g. `/cfo/diagnostic`) or `/book-call` |
| `/diagnostic` | `/diagnostic/run` |
| `/diagnostic/run` | `/diagnostic/idea-stage` (if idea-stage) or `/diagnostic/result/[id]` |
| `/diagnostic/result/[run_id]` | `/resources`, `/decisions/[id]?tab=chat`, `/human-review`, `/decisions/[id]`, `/diagnostic` |
| `/decisions/[id]` | `/decisions`, `/cfo/chat`, `/cmo/chat`, `/coo/chat`, `/cto/chat`, timeline item → `/decisions/[id]` |
| `/decisions` | `/decisions/new`, `/decisions/[id]` |
| `/decisions/new` | `/diagnostic` (create from diagnostic), `/decisions/[id]` after create |
| `/dashboard` | `/diagnostic`, `/decisions`, `/decisions/[id]`, `/resources`, domain chats |
| `/human-review` | `/decisions/[id]`, `/diagnostic` |
| `/resources` | `/diagnostic/result/[id]`, `/diagnostic` |
| `/institutional/portfolios` | `/institutional/portfolios/[portfolioId]` |
| `/institutional/portfolios/[portfolioId]` | `/institutional/enterprises/[enterpriseId]`, `/decisions/[decision_id]` |
| Topbar (global) | `/`, `/#…`, `/about`, `/login`, `/signup`, `/dashboard`, `/book-call`, `/diagnostic` |

### 3.3 Two main “product” flows today

1. **CLEAR flow (multi-agent):**  
   `/diagnostic` → `/diagnostic/run` → `/diagnostic/result/[id]` → (playbook | advisor | human review) → `/decisions/[id]` (workspace with EMR, commit, reviews, chat).

2. **Legacy single-agent flow:**  
   `/get-started` or `/cfo` (etc.) → `/cfo/diagnostic` → analysis → chat; or Dashboard → domain chats / decisions.

Institutional flow is separate: portfolios → portfolio detail → enterprises → decisions (for Be Noor Capital / partner use).

---

## 4. Audit through four “heads”

### 4.1 Head 1: MSME (no human capital; needs to understand challenges and get guidance)

**Who:** Founder/owner of a small operating business (e.g. 5–50 people), limited internal expertise, wants to understand “what’s wrong” and “what to do next.”

**Value CLEAR provides**

- **Diagnosis:** One place to describe the situation (wizard) and get a structured snapshot: decision statement, why now, first actions, risks, success metric (no jargon overload).
- **Three ways to act:** Playbooks (self-serve), AI advisor (quick guidance tied to the plan), Human review (expert touch when needed).
- **Execution tracking:** One workspace per decision: milestones, metrics, commit plan, outcome reviews, so progress is visible and reviewable.

**Current flow (MSME)**

1. Lands on `/` or `/get-started`.
2. May not know to go to “Start Diagnostic” (CLEAR) vs “Get started” (quiz → single-agent). **Gap:** Two entry points; CLEAR value is clearer if diagnostic is the single “start here.”
3. Runs diagnostic (`/diagnostic/run`) → result (`/diagnostic/result/[id]`).
4. Chooses: Resources, Talk to AI advisor, or Request human review.
5. Opens workspace (`/decisions/[id]`) to track execution (EMR, commit, reviews, chat).

**Pain points for this head**

- Role is not selected up front; messaging is generic.
- “Get started” sends to single-agent diagnostic, not CLEAR multi-agent; so two different journeys.
- After result, “what next” is three cards; not framed as “Pick one path: playbook, advisor, or human.”

**Design implication:** For “I’m an MSME,” the ideal path is: **Landing → “I need help understanding my challenges” → Diagnostic → Result → Choose one (playbook / AI / human) → Workspace.** All other links (CXO, book call, single-agent) can be secondary or role-specific.

---

### 4.2 Head 2: Be Noor Capital (founder) / Be Noor Foundation (building CLEAR)

**Who:** You as founder of Be Noor Capital (ethical/Islamic financing: profit-sharing, co-creation) under Be Noor Foundation, and you are also building CLEAR. You need to scale capital deployment while ensuring governance and capability in each invested MSME.

**Value CLEAR provides**

- **Portfolio view:** See all enterprises (invested or in pipeline) in one place: readiness band, last decision domain, last review date, whether they’ve committed a plan. Filters (e.g. no review in 60 days) to prioritise follow-up.
- **Governance and audit:** Each decision has an immutable record (what was decided, when, artifact, EMR). You can show investors or Shariah oversight that governance is embedded.
- **Capability signal:** Readiness (Nascent → Emerging → Institutionalizing) and outcome reviews show whether the MSME is building discipline (cash, ops) or just taking advice. Informs follow-on financing or support.
- **Invite and roles:** You (or your team) can be invited as “capital partner” or “advisor” to a decision workspace (magic link); view-only or comment, so you see progress without taking over.

**Current flow (Be Noor Capital)**

1. Log in (or use institutional entry if you add one).
2. Go to `/institutional/portfolios` → select a portfolio → `/institutional/portfolios/[portfolioId]`.
3. See table of enterprises (readiness, last decision, last review, link to decision).
4. Filter by readiness, domain, no_review_days.
5. Click into enterprise or decision → `/decisions/[id]` (with token for role) or `/institutional/enterprises/[enterpriseId]`.

**Pain points for this head**

- No “role selector” on landing that says “I’m a capital provider” and shows this journey.
- Institutional pages are under `/institutional/...` but not surfaced in main nav for this persona; discovery is by URL or internal knowledge.
- Value proposition for “why CLEAR for Be Noor Capital” (governance, capability, scale) is not told on a dedicated path.

**Design implication:** A **capital provider / partner** path: Landing → “I’m a capital provider” → short value story (governance, capability, portfolio) → Login/dashboard → Portfolios → Portfolio detail → Enterprise/decision. Optional: “Partner” or “Capital” area in nav when logged in as this role.

---

### 4.3 Head 3: Capital provider & startup founder (combined view)

**Who:** (a) A financing provider (like Be Noor but generic), or (b) a startup founder who will later need to report to investors. Both care about: “Is this company building real capability?” and “Can I trust the record?”

**Value CLEAR provides**

- **For capital provider:** Same as Head 2 (portfolio, readiness, governance, invite). Optional API (read-only portfolio) for their own dashboards.
- **For startup founder:** Same as MSME (diagnosis, three methods, execution). Plus: when they go to raise, they have a clear record (decisions, EMR, outcome reviews) to show discipline and progress.

**Current flow**

- Capital provider: same as Head 2 (institutional).
- Startup founder: same as MSME; “investor-ready” is a goal in the diagnostic (e.g. “Get investor-ready”) but not a separate entry.

**Pain points**

- No single “I’m raising / I’m a fund” selector that branches the journey.
- Design brackets D (workspace) and G (institutional) serve different users; linking them (e.g. “View as capital partner”) is in the workspace but not explained from the landing.

**Design implication:** Role selector on landing (see §5) can include “I’m an MSME / founder” and “I’m a capital provider / investor” (and optionally “I’m raising funding”). Each shows a short journey and primary CTAs.

---

### 4.4 Head 4: Designer (you or hired)

**Who:** Someone defining or applying a uniform design system.

**What they need**

- **Page count and brackets:** §1 and §2: ~50 routes, 7 brackets (A–G). So they know scope and where to reuse components.
- **Flow and links:** §3: so they know which screens lead where and where “back” goes.
- **Personas and journeys:** §4.1–4.3: so they know who sees which bracket and what the primary path is per role.
- **Consistency rules per bracket:**  
  - A: one marketing system (hero, sections, CTAs).  
  - B–C: minimal chrome, step-by-step.  
  - D: app shell (tabs, list/detail).  
  - E: one “hub + diagnostic + history + chat” pattern × 4.  
  - F: forms + dashboard.  
  - G: tables, filters, links.

**Design implication:** Hand off this doc plus a simple **sitemap (by bracket)** and **one flowchart per persona** (MSME, capital provider). Then designer can propose nav and layout changes so each role’s path is obvious.

---

## 5. Role-based landing and journeys

**Idea:** On the landing page (or a “Start” page), the user **selects their role** first. The next screen then shows **how CLEAR helps that role** and the **primary path** (with one clear CTA).

Suggested roles (you can rename):

| Role | Label (example) | Primary message | Primary CTA | Main journey |
|------|-----------------|-----------------|-------------|--------------|
| **MSME / Founder** | “I run a business and need to understand my challenges” | Diagnosis → one snapshot → choose playbook, AI advisor, or human review → track execution. | “Start diagnostic” | `/diagnostic` → run → result → (playbook | advisor | human) → workspace |
| **Capital provider / Investor** | “I invest in or support SMEs and need governance and visibility” | Portfolio view, readiness, immutable record, invite to workspace. | “View portfolios” or “Log in” | Login → `/institutional/portfolios` → portfolio detail → enterprises / decisions |
| **Raising funding** (optional) | “I’m preparing to raise or report to investors” | Same as MSME + “build a record that shows discipline and progress.” | “Start diagnostic” | Same as MSME; messaging emphasises investor readiness |

**Implementation (concept)**

- Add a **role selector** on `/` (e.g. three cards: “I’m an MSME / founder,” “I’m a capital provider,” “I’m raising funding”).
- On choose:
  - **MSME / Raising:** Show 3–4 bullets (diagnosis, 3 methods, execution) + one button → `/diagnostic`.
  - **Capital provider:** Show 3–4 bullets (portfolio, readiness, governance, invite) + one button → `/login` or `/institutional/portfolios` (or a dedicated “Partner” landing).
- Keep existing nav (How CLEAR works, Why CLEAR, etc.) so both roles can dig deeper; but **first CTA is role-specific**.

---

## 6. Rearranging pages and nav to fit each user’s flow

Once the map is agreed:

1. **Landing:** Add role selector (§5); keep current sections (Why CLEAR, How it works, Playbooks, Ecosystem) for both roles.
2. **Primary nav (topbar):** Consider role-aware items, e.g.:
   - For guest / MSME: Home, How CLEAR works, Why CLEAR, Playbooks, About, **Start diagnostic**, Login, Book a call.
   - For logged-in capital provider: Home, **Portfolios**, Dashboard, Log out (and optionally hide “Start diagnostic” or show it as secondary).
3. **Dashboard:** Already branches (last decision, list, domain chats). Could add a “Portfolios” block when user has institutional access.
4. **Institutional:** Keep under `/institutional/...` but add a clear entry (role selector → “Capital provider” → login → Portfolios). Optional: “Partner” or “Capital” in main nav when relevant.
5. **Single-agent (CFO/CMO/COO/CTO):** Either keep as “legacy” path from Get started / book-diagnostic, or gradually fold into “Start diagnostic” (CLEAR) and use domain only to personalise result. Designer can treat bracket E as one repeatable pattern.

**Flowchart (next step):** Draw one diagram per persona (e.g. Mermaid or Figma):

- **MSME:** Landing → Role: MSME → Diagnostic → Result → (Playbook | Advisor | Human) → Workspace (with optional “Back to result”).
- **Capital provider:** Landing → Role: Capital provider → Login → Portfolios → Portfolio detail → Enterprise / Decision (with “View as partner” link).

Then rearrange nav and CTAs so these paths are the default for each role.

---

## 7. Summary table for designer

| Bracket | Page count (approx) | Primary user(s) | Design rule |
|---------|----------------------|------------------|-------------|
| A – Landing & marketing | 14 | Everyone (MSME, capital, casual) | One marketing system; role selector on landing. |
| B – CLEAR diagnostic | 4 | MSME, founder | Linear; minimal chrome; clear steps and result. |
| C – Post-diagnostic | 2 | MSME | Cards or list; one primary CTA each (playbook, human review). |
| D – Decision workspace | 3 | MSME, advisor, capital (view) | App shell; tabs; forms and lists. |
| E – Single-agent hubs | 16 (4×4) | Legacy / “book diagnostic” | One pattern × 4 domains. |
| F – Auth & dashboard | 4 | Logged-in user | Forms + dashboard. |
| G – Institutional | 4 | Capital provider, partner | Tables, filters, links to decisions. |

**Total routes:** ~50. **Design families:** 7. **Primary flows:** 2 (MSME: diagnosis → execution; Capital: portfolios → enterprises → decisions).

---

---

## 8. Mermaid flowcharts (for diagrams)

### MSME / Founder journey

```mermaid
flowchart LR
  subgraph Landing
    A[/] --> B[Role: MSME]
  end
  subgraph Diagnostic
    B --> C[/diagnostic]
    C --> D[/diagnostic/run]
    D --> E{Idea-stage?}
    E -->|Yes| F[/diagnostic/idea-stage]
    E -->|No| G[/diagnostic/result/run_id]
  end
  subgraph What next
    G --> H[Playbooks]
    G --> I[AI Advisor]
    G --> J[Human review]
    H --> K[/resources]
    I --> L[/decisions/id?tab=chat]
    J --> M[/human-review]
  end
  subgraph Execution
    G --> N[/decisions/id]
    K --> N
    L --> N
    M --> N
    N --> O[Overview | Artifact | Execution | Chat | Timeline]
  end
```

### Capital provider / Be Noor journey

```mermaid
flowchart LR
  subgraph Landing
    A[/] --> B[Role: Capital provider]
  end
  B --> C[Login]
  C --> D[/dashboard]
  D --> E[/institutional/portfolios]
  E --> F[/institutional/portfolios/portfolioId]
  F --> G[Filter: readiness, domain, no_review_days]
  G --> H[Enterprise row]
  H --> I[/institutional/enterprises/enterpriseId]
  H --> J[/decisions/decision_id with token]
  I --> J
  J --> K[View as advisor/capital partner]
```

### Role selector (landing) → path

```mermaid
flowchart TD
  L[Landing /] --> R{Select role}
  R -->|MSME / Founder| M[How CLEAR helps: diagnosis, 3 methods, execution]
  R -->|Capital provider| P[How CLEAR helps: portfolio, readiness, governance]
  R -->|Raising funding| M
  M --> CTA1[Start diagnostic]
  P --> CTA2[Log in / View portfolios]
  CTA1 --> D[/diagnostic]
  CTA2 --> I[/institutional/portfolios or /login]
```

---

**Document version:** 1.0  
**Date:** 2026-02-11  
**Next:** (1) Add role selector on landing and role-specific “how CLEAR helps” + CTA. (2) Use or export the Mermaid flowcharts above for Figma/slides. (3) Adjust nav and dashboard so each role’s path is the default for them.
