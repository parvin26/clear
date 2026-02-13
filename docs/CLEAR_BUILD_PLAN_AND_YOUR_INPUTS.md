# CLEAR: Detailed Build Plan & What We Need From You

This document turns the Founder–CTO narrative (`CLEAR_FOUNDER_CTO_AND_VC_NARRATIVE.md`) into a **concrete build plan** for each component and, for each, **what is needed from your end** (decisions, content, access, priorities, pilots).

**How to use this doc:**  
- **Build plan:** Use as a roadmap and task breakdown for engineering/product.  
- **Your inputs:** Use the “Needed from you” sections and the summary table at the end to prepare decisions, content, and access so the team can execute.

---

## Current state vs to-build

| Component | Status | In this plan |
|-----------|--------|---------------|
| Diagnostic wizard + idea-stage off-ramp | Built | Minor improvements only |
| Multi-agent run (CFO/CMO/COO/CTO) | Built | Hardening + observability |
| Synthesis (rule-based, primary domain, snapshot) | Built | Harness + optional narrative tweaks |
| EMR (domain × profile matrix) | Built | Evaluation + optional labels |
| Decision ledger + immutability | Built | Keep; document runbook |
| Outcome reviews + readiness | Built | Longitudinal + dashboards (Phase 1) |
| Advisor chat (decision-scoped, full context) | Built | Quality gates + CI (Phase 0) |
| Knowledge base (knowledge_chunks + retrieval) | Scaffolding only | Full pipeline + content (Phase 2) |
| Evaluation harness + 10-persona in CI | Not built | Phase 0 |
| Tracing, prompt versioning, SLOs | Not built | Phase 0 |
| Multi-stakeholder UX (founder/advisor/investor) | Not built | Phase 1 |
| Dashboards + cohort + longitudinal readiness | Not built | Phase 1 |
| Richer diagnostic branching | Not built | Phase 1 |
| Partner APIs (portfolio, advisors) | Not built | Phase 2 |
| Privacy-safe learning loops | Not built | Phase 2 |
| Pricing / billing / packaging | Not built | Phase 1 (scope) or later |

---

## Phase 0: Hardening & reliability (Months 1–3)

Goal: Ship without regressing behaviour; know when synthesis or chat break.

### 0.1 Evaluation harness

**What we build**

- **Snapshot relevance:** Script or small service that, given a persona (situation + clarifiers) and a snapshot, scores “does the decision_statement and primary_domain match the situation?” (rule-based or simple LLM-as-judge).
- **EMR–domain match:** Check that EMR milestones and metrics belong to the stored primary_domain and profile (e.g. Finance A has runway/cash; Ops B has on-time %).
- **Advisor coherence:** Given a decision + EMR, send “What should I focus on first?” and assert: reply is non-empty, length in range, and (optional) contains at least one milestone id or title from the plan.
- **Outputs:** JSON or CSV per run (persona_id, snapshot_score, emr_match, advisor_ok, primary_domain). Baseline run stored; CI fails if regression (e.g. advisor_ok drops or primary_domain flips for a persona).

**Tasks**

1. Define evaluation schema (inputs: persona payload + decision_id or artifact; outputs: scores + pass/fail).  
2. Implement snapshot relevance scorer (rules or LLM judge with rubric).  
3. Implement EMR–domain checker (domain + profile vs milestone/metric templates).  
4. Implement advisor coherence check (call chat/message, parse reply, assert conditions).  
5. Add CLI or pytest entry point that runs all checks for the 10 personas (or a subset).  
6. Store baseline results (e.g. in repo or CI artifact); add CI step that fails on regression.

**Needed from you**

- **Definition of “good enough”:** For each persona (or segment), do you want a strict pass (e.g. “A1 must be CFO or COO and advisor must mention cash or runway”)? If yes, provide a short **acceptance matrix** (persona → expected primary_domain or allowed set, and whether advisor must cite EMR).  
- **Priority personas:** Which of the 10 personas are must-not-regress (e.g. A1, B1, D2)? We’ll run those in CI every time; others can be weekly or on-demand.  
- **Labels (optional):** If we use LLM-as-judge for snapshot relevance, do you have 20–50 “good” vs “bad” snapshot examples (or can you label them in a spreadsheet)? That improves consistency.

---

### 0.2 10-persona stress test in CI

**What we build**

- Run `backend/scripts/run_10_persona_stress_test.py` in CI (e.g. on every PR or nightly).
- Env: `STRESS_TEST_OUTPUT_JSON=1`; artifact: `CLEAR_STRESS_TEST_10_RESULTS.json`.
- Assertions: (1) D1 is idea_stage, no decision_id. (2) All other operating personas (A1–A3, B1–B3, C1–C2, D2) have non-null decision_id, non-empty primary_domain, non-empty sample_advisor_reply. (3) Optional: primary_domain in allowed set per persona (from your acceptance matrix).
- If backend is not available in CI, document “run locally before release” and add a small smoke test that doesn’t need full backend (e.g. synthesis unit tests only).

**Tasks**

1. Add CI job (e.g. GitHub Actions) that starts backend, runs script, collects JSON.  
2. Add assertion step (parse JSON, check D1 + operating personas + advisor reply).  
3. Document: how to run locally, how to update baseline if you intentionally change behaviour.  
4. Fix D2 if still 500 in your environment (ensure synthesis fix is deployed; re-run and commit new JSON).

**Needed from you**

- **CI access:** Permission to add a workflow that runs the backend (or use a hosted backend URL and API key for nightly run).  
- **Baseline ownership:** Who decides when to update the baseline (e.g. “all personas COO” is not acceptable; “we changed A1 to COO by design” is).  
- **Backend availability:** If CI cannot run a real backend, confirm that “run 10-persona locally before release” is acceptable and who runs it.

---

### 0.3 Structured tracing (trace_id)

**What we build**

- Generate a single `trace_id` (e.g. UUID) at the entry of `POST /api/clear/diagnostic/run` and `POST .../chat/message`.
- Pass trace_id through: run_service → agents, synthesis, create_decision; chat routes → decision_chat.
- Log trace_id in every log line for that request (structured logging: `trace_id=...`).
- Optionally: add trace_id to response headers or JSON so the frontend can display it for support.

**Tasks**

1. Add trace_id to FastAPI middleware or request state; generate at first touch.  
2. Thread trace_id through run_service, synthesis, ledger_service, decision_chat.  
3. Ensure all log calls in that path include trace_id (logger adapter or context var).  
4. Add trace_id to diagnostic run response and/or chat response (optional).  
5. Document: how to search logs by trace_id for a given user session or decision.

**Needed from you**

- **Log retention:** How long do you need to keep logs (for support/debug)? Affects whether we add trace_id to a logging aggregator or keep it local only.  
- **Support process:** Will support ever say “paste your trace_id” to users? If yes, we surface it in the UI (e.g. “Reference: …” in footer or error message).

---

### 0.4 Prompt versioning / registry

**What we build**

- Move prompts (or their keys) out of raw strings in code into a **prompt registry**: e.g. YAML/JSON files or a small DB table (id, name, body, version, created_at).
- Agents and decision_chat load prompt by name + optional version (default: latest).
- Each deploy or prompt change bumps version or adds a new row; we can revert by version.
- Optional: store “which prompt version was used” in DiagnosticRun or artifact metadata for debugging.

**Tasks**

1. Design registry format (file-based vs DB).  
2. Extract current system prompts from cfo_agent, cmo_agent, coo_agent, cto_agent, decision_chat into registry.  
3. Change agents and decision_chat to load from registry.  
4. Add version or hash to run/artifact metadata (optional).  
5. Document: how to edit prompts, how to roll back.

**Needed from you**

- **Ownership:** Who is allowed to change prompts (only eng, or product/ops too)? If non-eng, we need a simple UI or process (e.g. PR that only touches YAML).  
- **Rollback policy:** If a prompt change degrades quality, do we auto-rollback (e.g. evaluation harness fails) or manual?

---

### 0.5 Production SLOs and error budget

**What we build**

- Define SLOs: e.g. diagnostic run p95 &lt; 120s, chat message p95 &lt; 15s, error rate &lt; 1% (5xx + failed runs).
- Instrument: add timing and status to logs or metrics (e.g. Prometheus); expose /metrics or use existing health.
- Dashboard (e.g. Grafana or provider): p95 latency, error rate, optionally per endpoint.
- Error budget: e.g. “allow 0.5% of requests to fail per week”; if exceeded, freeze features and fix.

**Tasks**

1. Agree SLO targets (see “Needed from you”).  
2. Add timing and status logging (or Prometheus metrics) for diagnostic/run and chat/message.  
3. Set up dashboard (or document how to use existing APM).  
4. Document error-budget policy (who decides freeze, how to report).

**Needed from you**

- **SLO targets:** Concrete numbers: e.g. diagnostic p95 &lt; 120s, chat p95 &lt; 15s, error rate &lt; 1%.  
- **Infra:** Do you already have Prometheus/Grafana, Datadog, or similar? If not, we use simple logging + manual review until you add a provider.  
- **Owner:** Who is responsible for reacting when SLOs are breached (on-call, or you)?

---

## Phase 1: Product depth (Months 4–9)

Goal: CLEAR used in real programs with advisors; single-enterprise and cohort visibility.

### 1.1 Richer diagnostic branching (by segment or goal)

**What we build**

- Optional “path” or “goal” early in the wizard: e.g. “Stabilise cash” vs “Scale growth” vs “Improve operations” vs “General.”  
- Branching: slightly different wizard steps or clarifiers by path (e.g. cash path asks runway, payables; growth path asks pipeline, ICP).  
- Backend: diagnostic_data carries path/goal; mapping and synthesis can use it to bias primary_domain or snapshot framing (still one primary domain, but narrative tailored).  
- No new agents; only wizard logic and mapping/synthesis tweaks.

**Tasks**

1. Define paths (list + short description).  
2. Frontend: add one step or dropdown for path; conditional follow-up questions by path.  
3. Backend: mapping.py accepts path; optionally add path to agent notes.  
4. Synthesis: optional bias (e.g. path “cash” + CFO in top two → prefer CFO).  
5. Test with 2–3 personas per path.

**Needed from you**

- **Path definitions:** Exact list and labels (e.g. “Stabilise cash”, “Scale growth”, “Improve operations”, “General”).  
- **Path-specific questions:** For each path, which extra or different wizard questions (and copy)?  
- **Priority:** Is this must-have for Phase 1 or “nice to have”? If nice, we can ship multi-stakeholder and dashboards first.

---

### 1.2 Multi-stakeholder UX (founder / advisor / investor)

**What we build**

- **Roles:** Founder (full access), Advisor (view decision + EMR + outcome reviews; optional “add comment” or “acknowledge”), Investor (view-only: snapshot + readiness + last outcome summary).  
- **Share links:** Generate a link (or token) that grants view-only or advisor access to a decision; link can expire or be revoked.  
- **Backend:** Optional `decision_collaborators` or `decision_links` table (decision_id, role, token_or_email, expires_at). Resolve token in middleware; attach role to request.  
- **Frontend:** Decision workspace checks role; show/hide commit, edit EMR, add outcome review, chat. Advisor view: read-only + optional comment thread or “acknowledged at …”.

**Tasks**

1. Design role model and permission matrix (who can do what).  
2. Backend: table + API to create share link (role, optional expiry), resolve token, return decision with role.  
3. Frontend: “Share” button → modal (copy link for advisor / investor); open decision by link → load with role.  
4. UI: conditional rendering by role (founder vs advisor vs investor).  
5. Optional: “Request human review” ties to advisor; advisor sees list of “pending review” and can open via link.

**Needed from you**

- **Roles:** Confirm exactly three: founder (full), advisor (view + comment/ack?), investor (view-only). Any other role (e.g. program manager)?  
- **Advisor actions:** Can advisor edit EMR or only comment? Can they “approve” or “acknowledge” a review?  
- **Pilot:** One program or advisor to pilot share links and give feedback.  
- **Auth:** Share links can be unauthenticated (token in URL) or require login; which do you want for v1?

---

### 1.3 Dashboards (single-enterprise + cohort)

**What we build**

- **Single-enterprise dashboard:** For one “enterprise” (or guest: one device/session): list of decisions, EMR status (e.g. % milestones done), readiness band over time, last outcome review summary. Requires enterprise_id or a stable anonymous id (e.g. localStorage + backend “link decisions to this id”).  
- **Cohort dashboard (anonymised):** Aggregate by segment (e.g. industry, size band, primary_domain): count of decisions, average milestones completed, readiness distribution. No PII; optional “export for research” with your approval.  
- **Backend:** APIs: GET /api/clear/enterprises/me/decisions (or /api/clear/decisions?enterprise_id=), GET /api/clear/cohort/stats (filters: segment, date range).  
- **Frontend:** New routes e.g. /dashboard (single), /cohort (admin or partner only); charts (e.g. readiness over time, milestone completion).

**Tasks**

1. Define “enterprise” for guest users (e.g. email if provided, or anonymous_id).  
2. Backend: persist enterprise_id on decisions where possible; list decisions by enterprise.  
3. Backend: cohort stats (aggregate by segment); ensure no PII.  
4. Frontend: dashboard page(s); charts (use a small library or static tables).  
5. Access control: cohort dashboard only for admin or API key.

**Needed from you**

- **Enterprise identity:** For guests, how do we group decisions? (e.g. “same browser + optional email” vs “must sign up to see dashboard”).  
- **Cohort segments:** Which dimensions (industry, size, country, primary_domain)? And who is allowed to see cohort stats (you only, or partners)?  
- **Design:** Do you have a reference dashboard (e.g. Notion, Airtable) or should we keep it minimal (tables + one or two charts)?

---

### 1.4 Longitudinal readiness (same enterprise, multiple decisions)

**What we build**

- Readiness is already per decision. We add: “readiness over time” for an enterprise = sequence of (decision_id, readiness_band, date) ordered by created_at.  
- Single-enterprise dashboard shows a simple timeline or table: Decision 1 → Nascent; Decision 2 (after review) → Emerging; etc.  
- Optional: “composite” or “current” readiness = latest decision’s band, or max over last N decisions (you choose rule).

**Tasks**

1. API: GET /api/clear/enterprises/{id}/readiness-history (or embedded in dashboard response).  
2. Compute: for each decision, store or derive readiness at creation and after each outcome review.  
3. Frontend: show on dashboard as timeline or list.

**Needed from you**

- **Rule:** “Current” readiness = latest decision only, or “best of last 3,” or something else?  
- **Use case:** Is this for the founder (“my progress”) or for an investor (“portfolio readiness trend”)? Drives where we put it in the UI.

---

### 1.5 Onboarding in synthesis narrative

**What we build**

- Use onboarding (industry, company size, country) inside synthesis to tailor the **emerging_decision** and **decision_statement** (e.g. “For a 12-person agency in Jakarta, …”).  
- No new APIs; only synthesis.py: when building emerging_decision and snapshot, inject 1–2 lines from onboarding (e.g. “&lt;stage&gt; company in &lt;industry&gt;, &lt;country&gt;”).  
- Keep it short so we don’t leak PII or make the snapshot too long.

**Tasks**

1. Add helper in synthesis: format_onboarding_line(onboarding_context) → one sentence.  
2. Use it in _emerging_decision and in decision_statement prefix.  
3. Test with a few onboarding combinations; ensure no “null” or “undefined” in output.

**Needed from you**

- **Tone:** Formal (“A growth-stage company in e-commerce in Malaysia”) or casual (“You’re running a small e-commerce business in Malaysia”)?  
- **Privacy:** Any field we must never put in the snapshot (e.g. email)? We’ll only use industry, size, country, stage.

---

### 1.6 Pricing / packaging (scope only in Phase 1)

**What we build in Phase 1**

- **Scope only:** Document pricing model (e.g. free tier = N runs/month; paid = unlimited + dashboard; program = white-label). No implementation yet unless you prioritise it.  
- Optional: add “usage” counters (e.g. diagnostic runs per enterprise per month) so that when we add billing, we can enforce limits.

**Tasks**

1. Document: tiers, limits, who pays (founder vs program).  
2. Optional: backend counter (runs per enterprise_id per month); no paywall yet.  
3. Frontend: no change unless you want “X runs left” for a free tier.

**Needed from you**

- **Model:** Free vs paid vs program; rough limits (e.g. 3 runs/month free).  
- **Priority:** Is “usage counter only” enough for Phase 1, or do you need a real paywall (stripe, etc.)? If paywall, that’s a separate workstream.

---

## Phase 2: Learning & ecosystem (Months 10–18)

Goal: Knowledge base filled and maintainable; partners can integrate; learning from usage without PII.

### 2.1 Full knowledge base (content + pipeline)

**What we build**

- **Ingestion pipeline:** Script or small app to ingest content (markdown, PDF, or structured JSON) → chunk → embed → upsert into knowledge_chunks. Metadata: source_type, title, tags (domain, industry, country), created_at.  
- **Tagging:** Each chunk has tags so retrieve_knowledge_snippets(primary_domain, industry, country, topic_keywords) returns relevant snippets.  
- **Content:** You (or a contractor) produce or curate content: frameworks, playbooks, local context (e.g. Malaysia tax, Indonesia labour), sector nuance (F&B, logistics, clinic).  
- **Chat integration:** Decision chat already can call retrieve_knowledge_snippets; we ensure it’s used and that snippets are injected into the advisor prompt.  
- **Refresh:** Pipeline can be run periodically (e.g. weekly); version or “last updated” so we can invalidate old content.

**Tasks**

1. Design chunk schema and tags (domain, industry, country, topic).  
2. Build ingestion script: input = file or URL list; output = knowledge_chunks rows.  
3. Improve retrieval: ensure filters (domain, industry, country) work and return relevant snippets.  
4. Wire chat: pass industry/country from onboarding or artifact into retrieve_knowledge_snippets; add snippets to advisor context.  
5. Document: how to add new content, how to run pipeline.

**Needed from you**

- **Content ownership:** Who produces or curates content (you, contractor, partners)?  
- **Initial content:** List of sources: e.g. “5 playbooks per domain”, “Malaysia SME guide”, “Indonesia labour summary”. We can start with 20–30 chunks and grow.  
- **Licensing:** Are all sources allowed to be ingested and shown in-app (no copyright issues)?  
- **Refresh:** How often do you want to update (e.g. quarterly)?

---

### 2.2 Partner APIs (portfolio, advisors)

**What we build**

- **Portfolio API (read-only):** For a “partner” (e.g. fund, accelerator): list enterprises (or decision_ids) they have access to; per enterprise: latest readiness, last outcome summary, decision count. No full artifact; only summary fields. Auth: API key or OAuth per partner.  
- **Advisor API (optional):** List “pending human review” requests for decisions they’re linked to; GET decision summary + EMR summary so they can prepare.  
- **Data model:** Partners table (id, name, api_key_hash, scope); partner_enterprises or partner_decisions (which partner can see which). You or an admin assigns enterprises/decisions to partners.

**Tasks**

1. Design partner model and scopes (portfolio_read, advisor_read, etc.).  
2. Implement API key generation and validation (middleware).  
3. Implement GET /api/clear/partners/portfolio (or similar): list enterprises + readiness + last outcome.  
4. Implement GET /api/clear/partners/advisor/pending-reviews (if needed).  
5. Admin or script: assign enterprises to partners.  
6. Document API for partners (auth, endpoints, rate limits).

**Needed from you**

- **Pilot partner:** One fund, bank, or accelerator willing to integrate. We need their requirements (which fields, how often they poll, do they need webhooks).  
- **Who assigns:** Do you assign “this partner sees these enterprises” manually, or do enterprises “join” a program (e.g. by code)?  
- **Legal:** Any data-sharing agreement or consent flow (e.g. “enterprise agrees to share with partner X”)?

---

### 2.3 Privacy-safe learning (signals → templates/prompts)

**What we build**

- **Signals:** Aggregate, anonymised: e.g. “primary_domain distribution by segment”, “most completed milestones by domain”, “outcome review keep/raise/reduce distribution”. No PII; no decision content.  
- **Use:** Periodic review (e.g. monthly): use signals to adjust EMR templates (e.g. “we see Ops B milestones X,Y often done; add similar”) or prompt tweaks (e.g. “users in segment Z often need clearer first_actions”).  
- **Implementation:** Script or cron that computes aggregates; outputs a report or a config diff. Human decides what to change; no automatic prompt push.

**Tasks**

1. Define signal set (what we aggregate).  
2. Implement aggregation job (run weekly/monthly); store or export report.  
3. Document: how to read the report and how to propose prompt/template changes from it.  
4. Optional: A/B test framework (e.g. 10% of users get variant prompt) if you want to experiment.

**Needed from you**

- **Signals:** Which aggregates matter most (e.g. “milestone completion rate by domain”, “readiness progression rate”)?  
- **Process:** Who reviews the report and who is allowed to change prompts/templates (you, product, eng)?  
- **Ethics:** Confirm we never use decision text or PII in learning; only counts and bands.

---

## Summary: What we need from you (checklist)

Use this to track your inputs. Mark when done and who owns it.

### Phase 0 (Months 1–3)

| # | Input | Owner | Done |
|---|--------|--------|------|
| 0.1 | Acceptance matrix (persona → primary_domain / advisor rules) | Product/you | ☐ |
| 0.1 | Priority personas for CI (must-not-regress list) | Product/you | ☐ |
| 0.1 | Optional: 20–50 labelled snapshot examples for LLM judge | You/contractor | ☐ |
| 0.2 | CI access (workflow, backend or hosted URL) | Eng/you | ☐ |
| 0.2 | Baseline ownership (who can update 10-persona baseline) | You | ☐ |
| 0.3 | Log retention policy; whether to show trace_id to users | You/ops | ☐ |
| 0.4 | Who can change prompts; rollback policy | You | ☐ |
| 0.5 | SLO targets (p95 latency, error rate) | You/ops | ☐ |
| 0.5 | Infra for metrics (Prometheus/Grafana or other) | You/ops | ☐ |
| 0.5 | Owner for SLO breach response | You | ☐ |

### Phase 1 (Months 4–9)

| # | Input | Owner | Done |
|---|--------|--------|------|
| 1.1 | Path definitions + path-specific wizard copy | Product/you | ☐ |
| 1.1 | Priority: branching vs multi-stakeholder first | You | ☐ |
| 1.2 | Role model (founder/advisor/investor + actions) | You | ☐ |
| 1.2 | Pilot program/advisor for share links | You | ☐ |
| 1.2 | Auth for share links (token-only vs login) | You | ☐ |
| 1.3 | How to identify “enterprise” for guests | Product/you | ☐ |
| 1.3 | Cohort dimensions + who can see cohort dashboard | You | ☐ |
| 1.3 | Dashboard design reference (optional) | You | ☐ |
| 1.4 | Rule for “current” readiness (latest vs best of N) | You | ☐ |
| 1.5 | Tone for onboarding in narrative; privacy (no email in snapshot) | You | ☐ |
| 1.6 | Pricing model (tiers, limits); paywall in Phase 1? | You | ☐ |

### Phase 2 (Months 10–18)

| # | Input | Owner | Done |
|---|--------|--------|------|
| 2.1 | Content owner + initial content list (playbooks, local context) | You | ☐ |
| 2.1 | Licensing confirmation for ingested content | You | ☐ |
| 2.2 | Pilot partner + their API requirements | You | ☐ |
| 2.2 | How partners get access (you assign vs enterprise joins) | You | ☐ |
| 2.2 | Data-sharing / consent if required | You/legal | ☐ |
| 2.3 | Which aggregate signals matter most | Product/you | ☐ |
| 2.3 | Who reviews learning report and changes prompts | You | ☐ |

---

## Suggested order of execution (your end)

1. **Week 1–2:** Lock Phase 0 inputs (acceptance matrix, priority personas, SLO targets, CI access, prompt ownership). Without these, we can still build the harness and CI, but assertions may be generic.  
2. **Month 2:** Lock Phase 1 role model and pilot (multi-stakeholder); path definitions if you want branching in Phase 1.  
3. **Month 3:** Lock enterprise identity and cohort dimensions for dashboards.  
4. **Before Phase 2:** Pilot partner and content list so we don’t build APIs or pipeline in a vacuum.

---

**Document version:** 1.0  
**Parent:** `CLEAR_FOUNDER_CTO_AND_VC_NARRATIVE.md`  
**Date:** 2025-02-11
