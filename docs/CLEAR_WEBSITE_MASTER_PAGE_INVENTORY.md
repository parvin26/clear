# CLEAR Website Master Page Inventory

Single source of truth for Figma design, Cursor implementation, and copy. Every page belongs to **one** archetype (A–F). Design effort follows the Visual Priority Rule (Step 4).

---

## Archetype reference

| Code | Archetype | Design focus |
|------|-----------|--------------|
| **A** | Conversion Landing (High-impact) | Premium visual storytelling, hero, lifecycle, CTA dominance, trust strip |
| **B** | Funnel / Activation | Clear next step, minimal distraction, progression, conversion UI |
| **C** | Product Workspace | Functional clarity, data hierarchy, institutional dashboard feel |
| **D** | Institutional / Trust | Simple editorial, minimal visuals, high-credibility typography |
| **E** | Evidence / Education | Structured reading, section anchors, download CTAs |
| **F** | Utility | Ultra-simple, form clarity, no design experimentation |

---

## Master layout templates (Step 3)

| # | Template name | Use for |
|---|----------------|--------|
| 1 | Marketing hero + lifecycle | Conversion landings (A) with hero + lifecycle strip |
| 2 | Conversion funnel | Start, diagnostic entry, guided-start, demo entry, pricing |
| 3 | Product dashboard | Dashboard, enterprise dashboard, decision list |
| 4 | Portfolio / table | Portfolios, cohorts, advisor tables |
| 5 | Editorial content | How it works, case studies, resources, governance narrative |
| 6 | Form / intake | Book-call, book-diagnostic, guided-start form, contact |
| 7 | Legal / trust | Terms, Privacy, Security, About (simple editorial) |

---

## Page inventory

| # | Page name | Route | Archetype | Priority | CTA type | Template |
|---|-----------|--------|-----------|----------|----------|----------|
| 1 | Homepage | `/` | A | High | Start diagnostic / How CLEAR works | Marketing hero + lifecycle |
| 2 | For Enterprises | `/for-enterprises` | A | High | Start / Book call | Marketing hero + lifecycle |
| 3 | For Founders | `/for-founders` | A | High | Diagnostic / Get started | Marketing hero + lifecycle |
| 4 | For Partners | `/for-partners` | A | High | Partner onboarding / Login | Marketing hero + lifecycle |
| 5 | For Institutions | `/for-institutions` | A | High | Partner inquiry / Login | Marketing hero + lifecycle |
| 6 | How CLEAR Works | `/how-it-works` | A | High | Start diagnostic / Next step | Marketing hero + lifecycle |
| 7 | Start | `/start` | B | High | Diagnostic / Guided start / New decision | Conversion funnel |
| 8 | Get Started | `/get-started` | B | High | Diagnostic / Book call | Conversion funnel |
| 9 | Diagnostic (hub) | `/diagnostic` | B | High | Run diagnostic / Idea-stage / MSME | Conversion funnel |
| 10 | Diagnostic Start | `/diagnostic/start` | B | High | Begin diagnostic flow | Conversion funnel |
| 11 | Diagnostic Run | `/diagnostic/run` | B | High | Submit / Next step | Conversion funnel |
| 12 | Diagnostic Idea-stage | `/diagnostic/idea-stage` | B | Medium | Submit idea-stage | Conversion funnel |
| 13 | Diagnostic MSME | `/diagnostic/msme` | B | Medium | Submit MSME | Conversion funnel |
| 14 | Diagnostic Result | `/diagnostic/result/[run_id]` | B | High | Create decision / View workspace | Conversion funnel |
| 15 | Guided Start | `/guided-start` | B | High | Book call / Diagnostic | Conversion funnel |
| 16 | Demo | `/demo` | B | High | Enter demo / Portfolio demo | Conversion funnel |
| 17 | Demo Enterprise | `/demo/enterprise/[id]` | B | Medium | Explore demo workspace | Conversion funnel |
| 18 | Demo Portfolio | `/demo/portfolio` | B | Medium | Explore portfolio demo | Conversion funnel |
| 19 | Pricing | `/pricing` | B | High | Choose plan / Book call / Partner inquiry | Conversion funnel |
| 20 | Book Call | `/book-call` | B | Medium | Submit contact form | Form / intake |
| 21 | Book Diagnostic | `/book-diagnostic` | B | Medium | Submit / Schedule | Form / intake |
| 22 | Dashboard | `/dashboard` | C | Medium | New decision / View decisions | Product dashboard |
| 23 | Decisions List | `/decisions` | C | Medium | New decision / Open decision | Product dashboard |
| 24 | Decision New | `/decisions/new` | C | Medium | Create decision | Product dashboard |
| 25 | Decision Workspace | `/decisions/[id]` | C | Medium | Milestones / Review / Share | Product dashboard |
| 26 | Enterprise Dashboard | `/enterprise/[enterpriseId]/dashboard` | C | Medium | Decisions / Activation | Product dashboard |
| 27 | Institutional Portfolios | `/institutional/portfolios` | C | Medium | Open portfolio / Cohorts | Portfolio / table |
| 28 | Institutional Portfolio Detail | `/institutional/portfolios/[portfolioId]` | C | Medium | Enterprises / Cohorts | Portfolio / table |
| 29 | Institutional Cohorts | `/institutional/cohorts` | C | Medium | Open cohort / Activation | Portfolio / table |
| 30 | Institutional Cohort Detail | `/institutional/cohorts/[id]` | C | Medium | Enterprises / Activation | Portfolio / table |
| 31 | Cohort Activation | `/institutional/cohort-activation` | C | Medium | Activate / Configure | Portfolio / table |
| 32 | Institutional Enterprise | `/institutional/enterprises/[enterpriseId]` | C | Medium | Dashboard / Decisions | Product dashboard |
| 33 | Advisor | `/advisor` | C | Medium | Enterprises / Decisions | Product dashboard |
| 34 | Advisor Enterprises | `/advisor/enterprises` | C | Medium | Open enterprise | Portfolio / table |
| 35 | Advisor Enterprise Detail | `/advisor/enterprises/[id]` | C | Medium | Decisions / Review | Product dashboard |
| 36 | Advisor Decision | `/advisor/decisions/[id]` | C | Medium | Review / Approve | Product dashboard |
| 37 | Human Review | `/human-review` | C | Medium | Approve / Request changes | Product dashboard |
| 38 | Insights | `/insights` | C | Low | Filters / Export | Product dashboard |
| 39 | CFO Role Hub | `/cfo` | A | High | CFO diagnostic / Chat | Marketing hero + lifecycle |
| 40 | CFO Diagnostic | `/cfo/diagnostic` | B | High | Run diagnostic / Submit | Conversion funnel |
| 41 | CFO Chat | `/cfo/chat` | C | Medium | Send message / Analysis | Product dashboard |
| 42 | CFO Analysis List | `/cfo/analysis` | C | Medium | Open analysis | Product dashboard |
| 43 | CFO Analysis Detail | `/cfo/analysis/[id]` | C | Medium | View / Export | Product dashboard |
| 44 | CFO History | `/cfo/history` | C | Low | Open past run | Product dashboard |
| 45 | CMO Role Hub | `/cmo` | A | High | CMO diagnostic / Chat | Marketing hero + lifecycle |
| 46 | CMO Diagnostic | `/cmo/diagnostic` | B | High | Run diagnostic / Submit | Conversion funnel |
| 47 | CMO Chat | `/cmo/chat` | C | Medium | Send message / Analysis | Product dashboard |
| 48 | CMO Analysis List | `/cmo/analysis` | C | Medium | Open analysis | Product dashboard |
| 49 | CMO Analysis Detail | `/cmo/analysis/[id]` | C | Medium | View / Export | Product dashboard |
| 50 | COO Role Hub | `/coo` | A | High | COO diagnostic / Chat | Marketing hero + lifecycle |
| 51 | COO Diagnostic | `/coo/diagnostic` | B | High | Run diagnostic / Submit | Conversion funnel |
| 52 | COO Chat | `/coo/chat` | C | Medium | Send message / Analysis | Product dashboard |
| 53 | COO Analysis List | `/coo/analysis` | C | Medium | Open analysis | Product dashboard |
| 54 | COO Analysis Detail | `/coo/analysis/[id]` | C | Medium | View / Export | Product dashboard |
| 55 | CTO Role Hub | `/cto` | A | High | CTO diagnostic / Chat | Marketing hero + lifecycle |
| 56 | CTO Diagnostic | `/cto/diagnostic` | B | High | Run diagnostic / Submit | Conversion funnel |
| 57 | CTO Chat | `/cto/chat` | C | Medium | Send message / Analysis | Product dashboard |
| 58 | CTO Analysis List | `/cto/analysis` | C | Medium | Open analysis | Product dashboard |
| 59 | CTO Analysis Detail | `/cto/analysis/[id]` | C | Medium | View / Export | Product dashboard |
| 60 | CxOs Hub | `/cxos` | A | High | Choose role / Diagnostic | Marketing hero + lifecycle |
| 61 | CxO Detail (book) | `/book-cxo/[id]` | B | Medium | Book / Submit | Form / intake |
| 62 | CxO by ID | `/cxos/[id]` | A | Medium | Role diagnostic / Chat | Marketing hero + lifecycle |
| 63 | Governance | `/governance` | D | Medium | Next step / Security | Editorial content |
| 64 | Security | `/security` | D | Low | — | Legal / trust |
| 65 | Privacy | `/privacy` | D | Low | — | Legal / trust |
| 66 | Terms | `/terms` | D | Low | — | Legal / trust |
| 67 | About | `/about` | D | Medium | Contact / Governance | Legal / trust |
| 68 | Case Studies | `/case-studies` | E | Medium | Start diagnostic / Download | Editorial content |
| 69 | Resources | `/resources` | E | Medium | Download / Read more | Editorial content |
| 70 | Who We Help | `/who-we-help` | E | Medium | Start / By role | Editorial content |
| 71 | Why Exec Connect | `/why-exec-connect` | A | Medium | Get started / Diagnostic | Marketing hero + lifecycle |
| 72 | Ecosystem | `/ecosystem` | E | Low | Learn more / Partners | Editorial content |
| 73 | Contact | `/contact` | F | Low | (Redirects to book-call) | Form / intake |
| 74 | Login | `/login` | F | High | Sign in / Sign up | Form / intake |
| 75 | Signup | `/signup` | F | High | Create account | Form / intake |
| 76 | Auth Verify | `/auth/verify` | F | Low | Continue / Resend | Form / intake |

---

## Summary by archetype

| Archetype | Count | Priority mix |
|-----------|-------|----------------|
| A – Conversion Landing | 12 | Mostly High |
| B – Funnel / Activation | 14 | High + Medium |
| C – Product Workspace | 32 | Medium + Low |
| D – Institutional / Trust | 5 | Medium + Low |
| E – Evidence / Education | 5 | Medium + Low |
| F – Utility | 4 | High (login/signup) + Low |

---

## Summary by template

| Template | Pages using it |
|----------|----------------|
| Marketing hero + lifecycle | Homepage, For Enterprises, For Founders, For Partners, For Institutions, How CLEAR Works, CFO/CMO/COO/CTO hubs, CxOs, Why Exec Connect |
| Conversion funnel | Start, Get Started, Diagnostic (hub + start/run/result), Guided Start, Demo, Pricing, CFO/CMO/COO/CTO diagnostics |
| Product dashboard | Dashboard, Decisions (list/new/[id]), Enterprise dashboard, Advisor, Human Review, Insights, CxO chat/analysis |
| Portfolio / table | Institutional portfolios & cohort pages, Advisor enterprises |
| Editorial content | Governance, Case Studies, Resources, Who We Help, Ecosystem |
| Form / intake | Book Call, Book Diagnostic, Book CxO, Contact, Login, Signup, Auth Verify |
| Legal / trust | Security, Privacy, Terms, About |

---

## First impression rule (Step 5) — Homepage checklist

Within 5 seconds the homepage must communicate:

| Signal | Content |
|--------|---------|
| **CLEAR** | Brand name visible |
| **What it does** | “Decision and execution governance infrastructure” — turns business problems into governed decisions and measurable execution |
| **Who it is for** | Enterprises, founders, institutions, capital partners |
| **What to do next** | Start diagnostic (primary CTA) |

---

## Design system tokens to lock first (Step 2)

Before page design, lock in Figma:

- **Typography:** H1, H2, H3, Body, Caption, CTA
- **Spacing:** Section padding, Block spacing, Card padding
- **Color:** Primary brand, Accent, Neutral scale, Success / Warning / Risk
- **Buttons:** Primary, Secondary, Ghost
- **Cards:** Dashboard card, Marketing card, Data card

All pages then inherit; no token changes without approval.

---

## Cursor instruction (Step 7)

- Create **layout components** matching the 7 archetype templates.
- Convert pages to use these **shared components**.
- Replace page-specific layouts with **standardized templates**.
- Do not design pages individually; apply archetype + template consistently.

---

*Use this inventory for: Figma design scope, Cursor implementation order, and copy/messaging alignment.*
