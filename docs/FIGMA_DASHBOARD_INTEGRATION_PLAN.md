# Figma Decision Flow Dashboard — Integration Plan (plan only, no implementation)

**Design source:** [Figma Make – decisionflowdashboard](https://www.figma.com/make/WY27MnLFuroV6RdS51lUAq/decisionflowdashboard)  
**Scope:** Copy/merge the dashboard design with the current app; identify gaps and a plan to integrate. **Plan first; no code changes in this doc.**

---

## 1. How to “copy” the design from Figma Make

- **Figma Make vs Figma Design:** The link is a **Figma Make** file (AI-generated). The Cursor Figma MCP can pull **design context/code** and **screenshots** from standard Figma Design files (`figma.com/design/...`) and FigJam (`figma.com/board/...`). For **Make** files, the MCP may return an image or limited metadata; full code generation from Make is not guaranteed.
- **Practical options to copy the design:**
  1. **Screenshot/export:** Export key frames from Figma Make (PNG/SVG) and share them so layout, sections, and components can be matched in code.
  2. **Recreate in Design file:** If you duplicate the Make canvas into a normal Figma Design file, we can use `get_design_context` / `get_screenshot` with `fileKey` and `nodeId` to get UI code and assets.
  3. **Describe + map:** Describe the main blocks (e.g. “header with greeting”, “decision list with status”, “flow diagram”) and we map them to existing components and add missing ones.

**Recommendation:** Prefer (2) or (3) so we can reliably map every section to routes/components and APIs below.

---

## 2. Current app vs “decision flow dashboard” (what exists today)

| Area | Current implementation | Route(s) | Data / API |
|------|------------------------|----------|------------|
| **Logged-in home** | Welcome, onboarding snippet, capital readiness for last decision | `/dashboard` | `listDecisions`, `getDecision`, `getReadiness`, `listMilestones`, `listOutcomeReviews`, onboarding from `localStorage` |
| **Quick actions** | Start diagnostic, Open last decision, Browse playbooks, Talk to AI advisor | `/dashboard` | Links to `/diagnostic`, `/decisions/[id]`, `/resources`, `/decisions/[id]?tab=chat` |
| **Latest decisions** | List of up to 5 decisions with title, approval status, date; “All decisions →” | `/dashboard` | `listDecisions(limit: 5)`, `getDecision` per item |
| **Execution snapshot** | Open milestones count, due in 7/30 days | `/dashboard` | `listMilestones(lastDecisionId)`, derived counts |
| **Outcome reviews** | Latest review summary + key learning; “View all reviews” | `/dashboard` | `listOutcomeReviews(lastDecisionId)` |
| **Domain chats** | 4 tiles: Finance, Growth, Ops, Tech → `/cfo/chat`, etc. | `/dashboard` | Links only |
| **Decision list (full)** | Table: Decision, Enterprise, Primary domain, Created, Readiness, Last review | `/decisions` | `listDecisions(limit: 50)`; *primary domain, readiness, last review* are placeholders (not yet from API) |
| **Decision detail** | Tabs: Overview, Artifact, Execution (EMR, commit, outcome reviews, invite, comments), Chat, Timeline | `/decisions/[id]` | Full CLEAR APIs: artifact, ledger, evidence, milestones, outcome reviews, readiness, chat, timeline, comments |
| **Enterprise dashboard** | Financing readiness (latest) + capability scores table | `/enterprise/[enterpriseId]/dashboard` | `getCapabilityFinancingReadiness`, `getCapabilityScores`, `getEnterprise` |
| **Shell / nav** | Topbar, Sidebar (Home + Decision areas: Decision Workspace, Advisor, CFO, CMO, COO, CTO), Footer | All app pages | — |

So today we already have: a **dashboard** (welcome + last decision + execution + reviews + domain chips), a **decisions list** page, and a **decision workspace** with tabs. The design you have in Figma can be merged into this by aligning each design section to one of these surfaces or to a new section we add.

---

## 3. Likely design elements and where they map (assumptions)

Without seeing the exact frames, a “decision flow dashboard” often includes:

| Design element (assumed) | Map to current app | Notes |
|--------------------------|--------------------|--------|
| Header / greeting | `/dashboard` — “Welcome back” + name | Already there; can restyle to match Figma. |
| Primary CTA (e.g. “New decision” / “Start diagnostic”) | Same card “Start a new diagnostic” | Already there; can make it the main button per design. |
| List of decisions (cards or rows) | `/dashboard` “Your latest decision” + `/decisions` table | Merge: either keep both (dashboard = preview, /decisions = full list) or make dashboard the “main” list and link to full table. |
| Status / stage per decision | `Badge` with `approval_status` / `current_status` | Exists; ensure status set matches design (e.g. Draft, In progress, Done). |
| Flow / pipeline view (e.g. columns: To do → In progress → Done) | **Not implemented** | Would be a new view (dashboard or `/decisions`) with status-based columns; backend already has `current_status`. |
| Milestones / execution summary | “Execution snapshot” on dashboard | Exists; can add due-soon list or mini timeline per design. |
| Readiness (e.g. band or score) | Shown for “last decision” on dashboard; column on `/decisions` is placeholder | Backend: `getReadiness(decision_id)`. List view needs either per-row readiness in API or N+1 calls. |
| Charts (e.g. readiness over time, milestone completion) | **Not implemented** | Docs mention “readiness over time” as deferred; would need API (e.g. readiness history) + chart component. |
| Filters (by status, date, domain) | **Not implemented** on decisions list | `listDecisions` supports `status`, `enterprise_id`; frontend doesn’t expose filters yet. |
| “Primary domain” / “Last review date” in list | Placeholder in `/decisions` table | Backend: need list endpoint to return or join these, or extra calls. |
| Sidebar / nav layout | Sidebar + Topbar | Exists; can align items and styling with Figma. |

---

## 4. Gap list (missing or partial)

- **Backend / API**
  - **Decisions list enrichment:** `GET /api/clear/decisions` returns list items; it does not currently expose **primary_domain**, **readiness_band**, or **last_review_date** per row. Either extend list response or add a “list with summary” endpoint so the table isn’t N+1.
  - **Readiness over time:** No endpoint like `GET /api/clear/enterprises/{id}/readiness-history` or per-decision history; needed for any “readiness over time” chart.
  - **Status values:** Confirm `current_status` / approval values match the design (e.g. same labels and flow).

- **Frontend – dashboard**
  - **Layout/sections:** Restyle dashboard to match Figma (grid, cards, order, typography).
  - **Flow/pipeline view:** If design has a Kanban-style “decision flow” (e.g. by status), new component + optional new route or dashboard section.
  - **Charts:** If design has charts (readiness over time, milestones), add a small chart library and wire to APIs above once they exist.

- **Frontend – decisions list**
  - **Filters:** Add filters (status, date range, maybe enterprise/domain) using existing `listDecisions` params where available.
  - **Columns:** Replace placeholder “Primary domain”, “Readiness”, “Last review date” with real data when API supports it.

- **Design system**
  - **Components:** Reuse or add components to match Figma (buttons, cards, badges, tables). If you share the Design file (or screenshots), we can align tokens (colors, spacing, radii).

---

## 5. Phased integration plan (no implementation yet)

**Phase 1 – Align with design (visual + structure)**  
- Get design into a format we can use: screenshots or a normal Figma Design file.  
- Map each Figma section to a dashboard block or to `/decisions` / `/decisions/[id]`.  
- Adjust dashboard layout and Shell (sidebar/topbar) to match (layout, order of sections, primary CTA).  
- No new backend; use existing APIs.

**Phase 2 – Enrich decisions list**  
- Backend: Extend decisions list (or add summary endpoint) to include primary_domain, readiness_band, last_review_date per decision where available.  
- Frontend: Replace placeholders in `/decisions` table with real data; add filters (status, maybe date) using existing API params.

**Phase 3 – Optional “flow” view and charts**  
- If design includes a pipeline/Kanban view: add a view (dashboard or `/decisions`) that groups decisions by status; backend already has status.  
- If design includes “readiness over time” or similar: add backend readiness-history (or equivalent), then a small chart on dashboard or enterprise view.

**Phase 4 – Polish and design system**  
- Apply Figma tokens (color, type, spacing) consistently.  
- Add any missing components (e.g. status pills, empty states) to match design.

---

## 6. What you can do next

1. **Share the design:** Export 1–2 screens from Figma Make (or copy to a Design file and share `fileKey` + `nodeId`) so we can align sections and components precisely.  
2. **Confirm scope:** Say which of the above you want in v1 (e.g. “only Phase 1”, or “Phase 1 + 2 and skip charts”).  
3. **Confirm “flow” view:** Do you want a Kanban-style decision flow on the dashboard or on `/decisions`? If yes, we’ll add it in Phase 3.  
4. **Backend priority:** If you want “Primary domain”, “Readiness”, “Last review date” in the decisions table soon, we’ll prioritise the list-enrichment API in Phase 2.

Once you confirm (and optionally share the design), implementation can follow this plan step by step.
