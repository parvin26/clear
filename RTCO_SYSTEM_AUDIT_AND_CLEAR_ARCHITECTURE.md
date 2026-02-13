# RTCO — System Structure Audit + Target CLEAR Architecture

**Role:** Senior system architecture auditor and implementation planner for CLEAR decision governance infrastructure migration.

**Constraints applied:** Reuse ExecConnect infrastructure; identify Reuse / Refactor / Build New; avoid destructive changes; preserve diagnostic engines and RAG; prioritize governance-layer additions over UI redesign.

---

## PART A — CURRENT SYSTEM STRUCTURE

### 1. Current Backend Architecture

#### Service structure
```
backend/
├── app/
│   ├── main.py                 # FastAPI app, lifespan, CORS, router registration
│   ├── config.py               # pydantic-settings (DATABASE_URL, OPENAI, RAG, CORS)
│   ├── agents/                 # AI orchestration (one module per CXO)
│   │   ├── cfo_agent.py
│   │   ├── cmo_agent.py
│   │   ├── coo_agent.py
│   │   └── cto_agent.py
│   ├── routes/                 # API layer (per-agent + health)
│   │   ├── health.py
│   │   ├── cfo_routes.py
│   │   ├── cmo_routes.py
│   │   ├── cmo_chat_routes.py
│   │   ├── coo_routes.py
│   │   ├── coo_chat_routes.py
│   │   ├── cto_routes.py
│   │   └── cto_chat_routes.py
│   ├── db/
│   │   ├── database.py        # engine, SessionLocal, get_db, init_pgvector_extension
│   │   └── models.py          # SQLAlchemy models (User, *Analysis, *Document, *ChatMessage)
│   ├── rag/
│   │   └── vectorstore.py     # get_embedding, upsert_*_document, search_*_docs
│   ├── schemas/               # Pydantic (input, analysis, chat) per agent
│   │   ├── cfo/, cmo/, coo/, cto/
│   └── tools/                 # Domain “diagnostic” calculators
│       ├── financial_tools.py
│       ├── marketing_tools.py
│       ├── operational_tools.py
│       └── tech_tools.py
├── alembic/
│   ├── env.py
│   └── versions/              # Migrations (initial schema, chat tables, embedding fix)
└── requirements.txt
```

#### API endpoint organization
| Prefix | Endpoints | Purpose |
|--------|-----------|--------|
| (none) | `GET /`, `GET /health` | Root, health check |
| `/api/cfo` | `POST /diagnose`, `GET /analyses`, `GET /analyses/{id}`, `POST /chat` | CFO diagnostic, list, detail, chat |
| `/api/cmo` | `POST /diagnose`, `GET /analyses`, `GET /analyses/{analysis_id}` | CMO diagnostic, list, detail |
| `/api/cmo/chat` | `POST ""`, `GET /messages` | CMO chat send, list messages |
| `/api/coo` | `POST /diagnose`, `GET /analyses`, `GET /analyses/{analysis_id}` | COO diagnostic, list, detail |
| `/api/coo/chat` | `POST /message`, `GET /history` | COO chat message, history by session |
| `/api/cto` | `POST /diagnose`, `GET /analyses`, `GET /analyses/{analysis_id}` | CTO diagnostic, list, detail |
| `/api/cto/chat` | `POST ""`, `GET /history` | CTO chat send, history |

#### Orchestration logic
- **Diagnostic flow (per agent):** Route receives Pydantic input → tools compute metrics/scores → optional RAG search (trigger-based or always) → agent builds prompt (input + tools + RAG snippets) → OpenAI chat completion with `response_format={"type": "json_object"}` → parse JSON → persist to `*_analyses` → return analysis DTO.
- **Chat flow:** Route receives message (and optional session_id / analysis_id) → optional RAG on message (CMO/CTO) or history (COO) → agent chat completion → persist to `*_chat_messages` → return reply.
- **No central “decision” orchestrator:** each agent is independent; no shared decision lifecycle or versioning.

#### Database schema overview
| Table | Purpose |
|-------|--------|
| `users` | Optional identity (id, email, name); referenced by analyses and chat; no auth yet. |
| `cfo_analyses`, `cmo_analyses`, `coo_analyses`, `cto_analyses` | Diagnostic runs: `user_id`, `input_payload` (JSON), `analysis_json` (JSON), `risk_level`; COO has `priority_area`. No versioning or “decision” semantics. |
| `finance_documents`, `marketing_documents`, `ops_documents`, `tech_documents` | RAG: `title`, `content`, `embedding` (Vector(1536)). |
| `cfo_chat_messages`, `cmo_chat_messages`, `coo_chat_messages`, `cto_chat_messages` | Chat: session/user/analysis linkage, role, content, optional sources (CMO). |

#### Existing diagnostic engines
- **CFO:** `financial_tools.compute_financial_summary` (revenue, expenses, cash, payments) → gross margin, burn, runway, cash flow risk, unit economics hint. RAG trigger: challenges `cash_flow_management`, `forecasting_budgeting`, `financial_risk_management`.
- **CMO:** `basic_marketing_hint`, `detect_risk_level`. RAG always when `RAG_ENABLED`; query from primary_challenge, channels, strategy_alignment.
- **COO:** `calculate_throughput_trend`, `calculate_average_ops_cost`, `estimate_capacity_utilization`, `classify_service_reliability`, `basic_ops_hint`. RAG for `scaling_operations`, `supply_chain_inefficiencies`.
- **CTO:** `calculate_all_tools` (infra score, DevOps maturity, risk level, cloud efficiency, hints). RAG from biggest_challenge, tech_stack_maturity, notes.

#### Authentication flow
- **Not implemented.** `user_id` is optional (often `None`). CMO/CTO chat routes have placeholder `user_email`/`user_id` for future auth. No login/signup, no JWT/session.

#### Decision storage logic
- **No explicit “decision” abstraction.** Stored artifacts are “analyses”: one record per diagnostic run with `input_payload` and `analysis_json` (summary, risks, recommendations, action_plan, risk_level). No immutable ledger, no versioning, no decision ID or lineage.

---

### 2. Current Frontend Architecture

#### Routing structure
```
app/
├── page.tsx                    # Landing
├── layout.tsx                   # Root layout (metadata, globals.css)
├── globals.css
├── get-started/, how-it-works/, who-we-help/, why-exec-connect/
├── about/, case-studies/, insights/, ecosystem/
├── book-call/, book-diagnostic/, book-cxo/[id]/
├── cxos/, cxos/[id]/
├── cfo/
│   ├── page.tsx
│   ├── diagnostic/page.tsx
│   ├── chat/page.tsx
│   ├── history/page.tsx
│   └── analysis/[id]/page.tsx
├── cmo/
│   ├── page.tsx
│   ├── diagnostic/page.tsx
│   ├── chat/page.tsx
│   ├── analysis/page.tsx
│   └── analysis/[id]/page.tsx
├── coo/
│   ├── page.tsx
│   ├── diagnostic/page.tsx
│   ├── chat/page.tsx
│   ├── analysis/page.tsx
│   └── analysis/[id]/page.tsx
└── cto/
    ├── page.tsx
    ├── diagnostic/page.tsx
    ├── chat/page.tsx
    ├── analysis/page.tsx
    └── analysis/[id]/page.tsx
```

#### Major UI modules
- **Layout:** `Shell` (Topbar + conditional Sidebar), `Topbar`, `Sidebar` (agent-aware nav: Diagnostic, Analyses/History, Chat).
- **UI primitives:** `components/ui/*` (Card, Button, Input, Label, Select, Textarea, Checkbox, RadioGroup, Slider, Tabs, Badge, Progress).
- **Agent-specific:** `components/cfo/`, `cmo/`, `coo/`, `cto/` — each: DiagnosticForm, AnalysisSummary, RecommendationsList, ActionPlanTimeline; CMO/COO/CTO: ChatInterface; CTO: RisksList.

#### Decision flow screens
- **Flow:** Choose agent → Diagnostic (form) → Submit → Redirect to analysis/[id] → AnalysisSummary + RecommendationsList + ActionPlanTimeline. No “decision” framing; UX is “run diagnostic → view analysis.”

#### Agent interaction modules
- **Diagnostic:** Agent-specific form → `post*Diagnostic()` → redirect to `/cfo|cmo|coo|cto/analysis/[id]`.
- **Chat:** ChatInterface → `post*Chat` / `sendChatMessage` / `getChatHistory` / `getChatMessages` (per agent).

#### State management approach
- **Local React state only:** `useState`, `useEffect` for fetch; `useRouter`/`useParams` for navigation and IDs. No Redux/Zustand/global store.

#### Document upload handling
- **None in UI.** RAG documents are ingested via backend/scripts (e.g. calling `upsert_*_document`). No public upload API or frontend upload component.

---

### 3. Integration Components

#### AI orchestration pipelines
- **Single provider:** OpenAI (chat completions + text-embedding-3-small).
- **Per-agent pipeline:** Input → tools → optional RAG → single LLM call → structured JSON (diagnostic) or free-form text (chat). No multi-step or cross-agent orchestration.

#### RAG system components
- **Embedding:** `get_embedding(text)` → OpenAI text-embedding-3-small, 1536-d.
- **Storage:** Four document tables (finance, marketing, ops, tech); `upsert_*_document(db, title, content)` (no public API).
- **Retrieval:** `search_*_docs(db, query, top_k)` → pgvector cosine similarity → top-k snippets injected into prompt.

#### External integrations
- **OpenAI API** (required).
- **PostgreSQL (Supabase)** + pgvector (required).
- **No other external systems** (no auth provider, no document store, no reporting export).

---

### Current Architecture Tree (Structured Map)

```
ExecConnect (current)
├── Backend (FastAPI)
│   ├── Entry & config
│   │   ├── main.py (lifespan, CORS, routers)
│   │   └── config.py (DB, OpenAI, RAG, CORS)
│   ├── Routes (API)
│   │   ├── health
│   │   ├── cfo_routes (diagnose, analyses, chat)
│   │   ├── cmo_routes + cmo_chat_routes
│   │   ├── coo_routes + coo_chat_routes
│   │   └── cto_routes + cto_chat_routes
│   ├── Agents (orchestration)
│   │   ├── cfo_agent (run_ai_cfo_agent, run_ai_cfo_chat)
│   │   ├── cmo_agent
│   │   ├── coo_agent
│   │   └── cto_agent
│   ├── Tools (diagnostic engines)
│   │   ├── financial_tools
│   │   ├── marketing_tools
│   │   ├── operational_tools
│   │   └── tech_tools
│   ├── RAG
│   │   └── vectorstore (get_embedding, upsert_*_document, search_*_docs)
│   ├── DB
│   │   ├── database.py (engine, get_db, pgvector init)
│   │   └── models.py (User, *Analysis, *Document, *ChatMessage)
│   └── Schemas (Pydantic)
│       └── cfo/, cmo/, coo/, cto/ (input, analysis, chat)
├── Frontend (Next.js 14)
│   ├── App router (pages above)
│   ├── Layout (Shell, Topbar, Sidebar)
│   ├── Components (ui/, cfo/, cmo/, coo/, cto/)
│   └── lib (api.ts, types*, utils)
└── External
    ├── OpenAI (chat + embeddings)
    └── PostgreSQL + pgvector (Supabase)
```

---

## PART B — TARGET CLEAR ARCHITECTURE (Governance-Aligned Structure)

Target structure organized by CLEAR decision governance layers, reusing ExecConnect where possible.

### Target CLEAR Architecture Tree

```
CLEAR (target)
├── 1. Enterprise Input Layer
│   ├── Enterprise profile module
│   │   └── (org context, industry, region, size — extend User/org or new entity)
│   ├── Decision initiation module
│   │   └── (trigger from diagnostic / explicit “decision request” — refactor from current diagnose entry)
│   └── Context document module
│       └── (RAG docs + optional user upload — extend existing RAG + add upload API)
├── 2. Decision Governance Engine
│   ├── Problem reformulation engine
│   │   └── (structured problem statement from raw input — refactor/extend agent prompts + optional dedicated service)
│   ├── Constraint detection engine
│   │   └── (regulatory, resource, policy constraints — extend tools + RAG)
│   ├── Trade-off structuring engine
│   │   └── (options, criteria, trade-offs — extend analysis JSON schema + agent output)
│   └── Decision artifact generator
│       └── (formal decision record: rationale, options, chosen path — new schema + generator)
├── 3. Decision Ledger Layer
│   ├── Immutable decision storage
│   │   └── (append-only decision records, link to analyses — new tables + service)
│   ├── Versioning logic
│   │   └── (decision_id, version, supersedes — new)
│   └── Decision history management
│       └── (list/filter by enterprise, agent, time — new APIs + reuse list patterns)
├── 4. Execution and Outcome Layer
│   ├── Implementation tracking
│   │   └── (link action_plan items to tasks/milestones — new or extend analysis)
│   ├── Milestone logging
│   │   └── (dates, status, evidence — new tables/APIs)
│   └── Outcome capture module
│       └── (results, metrics, lessons — new)
├── 5. Capability Intelligence Layer
│   ├── Capability scoring engine
│   │   └── (reuse/refactor existing tools + add cross-domain aggregation)
│   ├── Benchmarking engine
│   │   └── (compare to norms/benchmarks — new, optional RAG)
│   └── Financing-readiness indicators
│       └── (extend CFO tools + optional new module)
├── 6. Institutional Interface Layer (future-ready)
│   ├── Portfolio dashboards
│   │   └── (multi-enterprise / multi-decision views — new frontend + APIs)
│   └── Governance reporting exports
│       └── (audit trail, compliance reports — new export APIs + formats)
├── Backend (existing preserved + new modules)
│   ├── Existing: main, config, routes (cfo/cmo/coo/cto), agents, tools, rag, db, schemas
│   ├── New/refactored: enterprise_input/, governance_engine/, ledger/, execution_outcome/, capability_intelligence/, institutional/
│   └── Shared: auth (when added), decision_id/version semantics
└── Frontend (existing preserved + additive)
    ├── Existing: agent hubs, diagnostic forms, analysis/chat/history
    └── New: enterprise profile UI, decision ledger views, execution/milestone UI, portfolio/reporting (later)
```

---

## Gap Analysis Table

| Existing component | Required CLEAR function | Reuse / Refactor / Build New |
|--------------------|-------------------------|-------------------------------|
| Agent diagnostic routes (POST diagnose) | Decision initiation entry point | **Refactor** — add decision_id, optional enterprise_id; keep same UX initially. |
| Pydantic input schemas (CFO/CMO/COO/CTO) | Enterprise + context for decision | **Refactor** — add optional enterprise/profile fields; align with enterprise profile module. |
| tools/* (financial, marketing, ops, tech) | Capability scoring + constraint hints | **Reuse** — keep as-is; **Refactor** — expose as capability scoring engine interface; add constraint detection where needed. |
| RAG vectorstore + document tables | Context document module | **Reuse** — keep embedding/search; **Refactor** — add document upload API, optional link to enterprise/decision. |
| agents/* (prompts + single LLM call) | Problem reformulation, trade-off structuring, artifact generator | **Refactor** — extend prompts for problem statement, constraints, trade-offs; **Build new** — decision artifact generator (structured output schema). |
| *analyses tables (input_payload, analysis_json) | Decision artifact storage | **Refactor** — keep for backward compatibility; **Build new** — decision_ledger (immutable rows) + versioning, link analysis_id → decision_id. |
| GET analyses list/detail | Decision history management | **Reuse** — list/detail patterns; **Build new** — decision ledger list/filter APIs and version history. |
| Chat routes + *chat_messages | Continuation of decision conversation | **Reuse** — no change for CLEAR governance; optional link to decision_id later. |
| users table | Enterprise profile / identity | **Refactor** — add org/enterprise fields or new enterprise table; **Build new** when auth added. |
| Frontend: diagnostic form → analysis | Decision flow screens | **Reuse** — same flow; **Refactor** — add “decision” framing (labels, decision ID in UI) when ledger exists. |
| Frontend: Shell, Sidebar, agent pages | Institutional navigation | **Reuse** — no structural change; **Build new** — portfolio dashboards, reporting views (Phase 3). |
| No implementation/milestone tracking | Execution and outcome layer | **Build new** — implementation tracking, milestone logging, outcome capture (tables + APIs). |
| No benchmarking/financing-readiness aggregation | Benchmarking engine; financing-readiness | **Build new** — optional modules; refactor CFO tools for financing-readiness if needed. |
| No auth | Future institutional interface | **Build new** — when required (Phase 2/3). |

---

## Recommended Phased Migration Plan

### Phase 1 — Governance layer without breaking changes (minimal change)

**Goal:** Introduce decision ledger and governance semantics while keeping all existing APIs and UX working.

1. **Decision ledger (backend)**  
   - Add `decisions` table: id, decision_id (UUID), version, enterprise_id (nullable), agent_domain (cfo/cmo/coo/cto), analysis_id (FK to existing *analyses), artifact_json (problem_statement, constraints, trade_offs, chosen_option, rationale), created_at, supersedes_id (nullable).  
   - Add `decision_ledger` service: create_decision_from_analysis(analysis_id, domain, artifact_json), get_decision(decision_id), list_decisions(filters).  
   - **No change** to existing diagnose response or analysis tables; one decision record created per new analysis (or backfill script for existing analyses).

2. **Decision artifact generator (backend)**  
   - Add governance_engine module: from existing analysis_json produce a canonical “decision artifact” (problem reformulation, constraints, trade-offs, chosen path). Can be rule-based from existing JSON first; later add LLM step if needed.  
   - Wire diagnose flow: after saving *analysis, call decision_ledger.create_decision_from_analysis(...) with generated artifact.

3. **Versioning logic (backend)**  
   - When an analysis is “revised” (e.g. re-run with same context), create new decision row with same decision_id, increment version, set supersedes_id to previous version.  
   - Optional: add PATCH or “revise” endpoint that creates new analysis + new decision version.

4. **APIs (additive only)**  
   - GET /api/decisions (list with filters: enterprise_id, agent_domain, date range).  
   - GET /api/decisions/{decision_id} (single decision with version history).  
   - GET /api/decisions/{decision_id}/versions (version list).  
   - Keep all existing /api/cfo, /api/cmo, /api/coo, /api/cto endpoints unchanged.

5. **Frontend (minimal)**  
   - Optional: “View as decision” link on analysis detail page that calls new GET /api/decisions?analysis_id=X and shows decision artifact.  
   - No routing or UX redesign.

**Dependencies:** None on other phases. Depends only on existing analyses and DB.

**Outcome:** Every new (and optionally historical) analysis has a corresponding immutable decision record and versioning; existing diagnostic engines and RAG unchanged.

---

### Phase 2 — Enterprise context + execution and outcome

**Goal:** Enterprise profile and context documents; track execution and outcomes.

1. **Enterprise input layer**  
   - **Enterprise profile:** Add `enterprises` table (name, industry, region, size, settings JSON); optional `user_id` → `enterprise_id`. Refactor input schemas to accept optional enterprise_id; pass through to decision_ledger.  
   - **Context document module:** Add document upload API (e.g. POST /api/documents with type=finance|marketing|ops|tech), call existing upsert_*_document; optional link to enterprise_id.  
   - **Decision initiation:** Refactor POST diagnose to accept optional enterprise_id; store on analysis and decision.

2. **Execution and outcome layer**  
   - **Implementation tracking:** Add `implementation_tasks` (decision_id, action_plan_key, title, due_date, status).  
   - **Milestone logging:** Add `milestones` (task_id or decision_id, milestone_type, logged_at, evidence_url or text).  
   - **Outcome capture:** Add `outcomes` (decision_id, outcome_type, metrics JSON, notes).  
   - APIs: CRUD for tasks/milestones/outcomes scoped by decision_id (and optionally enterprise_id).

3. **Frontend**  
   - Enterprise profile: simple form or settings page (optional).  
   - Document upload: upload UI for RAG documents (admin or per-enterprise).  
   - Decision detail page: show artifact + “Implementation” section (tasks, milestones, outcomes).  
   - No portfolio dashboards yet.

**Dependencies:** Phase 1 (decision_id and ledger in place). Optional: auth (can still use optional enterprise_id without full auth).

**Outcome:** Decisions tied to enterprise context; RAG extendable via upload; execution and outcome data captured for each decision.

---

### Phase 3 — Capability intelligence + institutional interface (future-ready)

**Goal:** Cross-decision capability scoring, benchmarking, financing-readiness; portfolio and reporting.

1. **Capability intelligence layer**  
   - **Capability scoring engine:** Wrap existing tools in a unified interface; add aggregation across domains (e.g. “composite score” per enterprise).  
   - **Benchmarking engine:** Optional: compare scores to norms (from RAG or static config); expose via API.  
   - **Financing-readiness:** Refactor/extend CFO tools; optional dedicated endpoint for financing-readiness indicators.

2. **Institutional interface layer**  
   - **Portfolio dashboards:** New frontend routes (e.g. /portfolio, /enterprises); APIs: list decisions/analyses by enterprise, aggregate stats.  
   - **Governance reporting exports:** New APIs: export decision ledger (CSV/JSON/PDF), audit trail by date range or enterprise; optional compliance-oriented views.

3. **Auth (if not done earlier)**  
   - Add authentication; scope enterprises and decisions by user/org; protect institutional endpoints.

**Dependencies:** Phase 1 and Phase 2. Auth can be introduced in Phase 2 or 3.

**Outcome:** CLEAR-aligned architecture with enterprise input, decision governance engine, decision ledger, execution/outcome capture, capability intelligence, and institutional interface ready for governance reporting.

---

## Summary

- **Current system:** ExecConnect is a well-structured, agent-centric diagnostic platform (CFO/CMO/COO/CTO) with tools, RAG, and analysis storage; no decision ledger, no versioning, no enterprise or execution layer.  
- **Target CLEAR:** Same backend/frontend base preserved; add Enterprise Input Layer, Decision Governance Engine (problem, constraints, trade-offs, artifact), Decision Ledger (immutable, versioned), Execution and Outcome Layer, Capability Intelligence Layer, and Institutional Interface (dashboards, exports).  
- **Gap analysis:** Most of the gap is **Build new** (ledger, versioning, execution/outcome, benchmarking, portfolio, reporting) and **Refactor** (prompts, schemas, decision initiation, analyses → decision linkage); **Reuse** is maximized for routes, agents, tools, RAG, and frontend structure.  
- **Phased plan:** Phase 1 = ledger + artifact + versioning (no breaking changes); Phase 2 = enterprise context + document upload + execution/outcome; Phase 3 = capability intelligence + portfolio + reporting + optional auth.

This document can be used as the single reference for the system structure audit and the target CLEAR architecture and migration sequence.
