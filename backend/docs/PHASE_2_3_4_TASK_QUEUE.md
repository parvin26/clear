# Phase 2, 3, 4 — Task Queues (Ordered Tickets)

Cursor-ready implementation plan: ordered tickets with acceptance criteria, file targets, and migration names. Dependencies and parallelization noted at the end.

---

# Phase 2 — Enterprise Context + Execution & Outcome Layer

**Depends on:** Phase 1 (decision_id exists in `decision_records`).

---

## 2.1 Database (Alembic)

| # | Ticket | Acceptance criteria | File target | Migration name |
|---|--------|----------------------|-------------|-----------------|
| 2.1.1 | Create `enterprises` table | Table has: id (pk), name (text), industry (text nullable), region (text nullable), size_band (text nullable), settings_json (jsonb nullable), created_at. Migration upgrades and downgrades cleanly. | `alembic/versions/e5f6a7b8c9d0_phase2_enterprises.py` | `e5f6a7b8c9d0` |
| 2.1.2 | Create `enterprise_users` table | Table has: id (pk), enterprise_id (fk → enterprises.id), user_id (fk → users.id), role (text nullable), created_at. | Same migration or `e5f6a7b8c9d0` (batch with 2.1.1) | `e5f6a7b8c9d0` |
| 2.1.3 | Create `decision_context` table | Table has: id (pk), decision_id (uuid, indexed), enterprise_id (fk nullable), context_json (jsonb), created_at. | `alembic/versions/f6a7b8c9d0e1_phase2_decision_context.py` | `f6a7b8c9d0e1` |
| 2.1.4 | Create `implementation_tasks` table | Table has: id (pk), decision_id (uuid, indexed), enterprise_id (fk nullable), action_plan_ref (text), title (text), owner (text nullable), due_date (date nullable), status (text), meta_json (jsonb nullable), created_at, updated_at. | `alembic/versions/a7b8c9d0e1f2_phase2_implementation_tasks.py` | `a7b8c9d0e1f2` |
| 2.1.5 | Create `milestones` table | Table has: id (pk), task_id (fk → implementation_tasks.id), milestone_type (text), logged_at (timestamp), evidence_text (text nullable), evidence_url (text nullable), metrics_json (jsonb nullable). | Same as 2.1.4 or next migration | `a7b8c9d0e1f2` |
| 2.1.6 | Create `outcomes` table | Table has: id (pk), decision_id (uuid, indexed), enterprise_id (fk nullable), outcome_type (text), measured_at (timestamp), metrics_json (jsonb), notes (text nullable). | `alembic/versions/b8c9d0e1f2a3_phase2_outcomes.py` | `b8c9d0e1f2a3` |
| 2.1.7 | Add nullable enterprise_id, decision_id to *_analyses | Add enterprise_id (fk nullable), decision_id (uuid nullable) to cfo_analyses, cmo_analyses, coo_analyses, cto_analyses. No defaults; existing rows unchanged. | `alembic/versions/c9d0e1f2a3b4_phase2_analyses_enterprise_decision.py` | `c9d0e1f2a3b4` |
| 2.1.8 | Optional: `document_links` table | Table: id (pk), doc_table (text), doc_id (int), enterprise_id (fk nullable), decision_id (uuid nullable), created_at. For traceability of RAG docs. | `alembic/versions/d0e1f2a3b4c5_phase2_document_links.py` | `d0e1f2a3b4c5` |

---

## 2.2 Backend — Enterprise module

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.2.1 | Add `app/enterprise/` package | Package exists with `__init__.py`, `routes.py`, `service.py`, `schemas.py`. | `backend/app/enterprise/__init__.py`, `routes.py`, `service.py`, `schemas.py` |
| 2.2.2 | Enterprise CRUD service | `create`, `get_by_id`, `list_`, `update` in service.py using SQLAlchemy models. | `backend/app/enterprise/service.py` |
| 2.2.3 | Enterprise schemas | Pydantic: EnterpriseCreate, EnterpriseOut, EnterpriseUpdate, EnterpriseListItem. | `backend/app/enterprise/schemas.py` |
| 2.2.4 | Enterprise routes | POST /api/enterprises (create), GET /api/enterprises (list), GET /api/enterprises/{id}, PATCH /api/enterprises/{id}. Router registered in main. | `backend/app/enterprise/routes.py`, `app/main.py` |
| 2.2.5 | Enterprise SQLAlchemy model | Model `Enterprise` (Phase 2 schema: name, industry, region, size_band, settings_json, created_at). Either new table or align with existing CLEAR enterprises table if present. | `backend/app/db/models.py` (or migration + model in sync) |

---

## 2.3 Backend — Decision context

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.3.1 | DecisionContext model | Model: id, decision_id, enterprise_id, context_json, created_at. | `backend/app/db/models.py` |
| 2.3.2 | Decision context service | `store_context(decision_id, enterprise_id, context_json, db)`, `get_context(decision_id, db)`. | New: `backend/app/enterprise/decision_context_service.py` or under enterprise/ |
| 2.3.3 | Decision context APIs | POST /api/decisions/{decision_id}/context, GET /api/decisions/{decision_id}/context. | `backend/app/enterprise/routes.py` or `backend/app/routes/decision_routes.py` |

---

## 2.4 Backend — Execution module (tasks + milestones)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.4.1 | Add `app/execution/` package | `__init__.py`, `routes.py`, `service.py`, `schemas.py`. | `backend/app/execution/*.py` |
| 2.4.2 | ImplementationTask + Milestone models | Models match migration columns. | `backend/app/db/models.py` |
| 2.4.3 | Task + milestone schemas | Pydantic: TaskCreate, TaskOut, TaskUpdate, MilestoneCreate, MilestoneOut. | `backend/app/execution/schemas.py` |
| 2.4.4 | Task service | create_task, list_tasks_by_decision, update_task; add_milestone, list_milestones. | `backend/app/execution/service.py` |
| 2.4.5 | Execution routes | POST/GET /api/decisions/{decision_id}/tasks, PATCH /api/tasks/{task_id}, POST/GET /api/tasks/{task_id}/milestones. | `backend/app/execution/routes.py`, `app/main.py` |

---

## 2.5 Backend — Outcomes module

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.5.1 | Add `app/outcomes/` package | `__init__.py`, `routes.py`, `service.py`, `schemas.py`. | `backend/app/outcomes/*.py` |
| 2.5.2 | Outcome model | Model matches outcomes table. | `backend/app/db/models.py` |
| 2.5.3 | Outcome schemas + service | OutcomeCreate, OutcomeOut; create_outcome, list_by_decision. | `backend/app/outcomes/schemas.py`, `service.py` |
| 2.5.4 | Outcome routes | POST /api/decisions/{decision_id}/outcomes, GET /api/decisions/{decision_id}/outcomes. | `backend/app/outcomes/routes.py`, `app/main.py` |

---

## 2.6 Backend — Documents module (RAG upload + optional linkage)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.6.1 | Add `app/documents/` package | `__init__.py`, `routes.py`, `service.py`. | `backend/app/documents/*.py` |
| 2.6.2 | Document upload API | POST /api/documents with body { domain, title, content, enterprise_id?, decision_id? }. Call existing upsert_*_document() per domain; store linkage in document_links if table exists. | `backend/app/documents/routes.py`, `service.py` |
| 2.6.3 | Register documents router | Router mounted; no breaking change to existing RAG. | `app/main.py` |

---

## 2.7 Wire Phase 2 into diagnose flows (minimal)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.7.1 | Extend diagnose input schemas | Each agent input schema allows optional enterprise_id (int), decision_context (object). | `app/schemas/cfo/cfo_input.py`, cmo_input, coo_input, cto_input |
| 2.7.2 | Store enterprise_id + decision_context on analysis | After analysis save: if enterprise_id provided, set on analysis row; if decision_context provided, call store_context(decision_id, enterprise_id, decision_context) after Phase 1 decision creation. decision_id from Phase 1 create_decision_from_analysis return value. | `app/routes/cfo_routes.py`, cmo_routes, coo_routes, cto_routes |
| 2.7.3 | Optional: auto-create tasks from action_plan | Behind flag (e.g. query param or config): after decision creation, parse action_plan from analysis_json and create implementation_tasks rows. | `app/governance_engine/rtco_service.py` or new helper, called from routes |

---

## 2.8 Frontend (minimal enablement)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 2.8.1 | Enterprise create/select screen | Route /enterprise (or /enterprises) for create/select enterprise; optional step; no redesign. | `frontend/src/app/enterprise/*` or existing structure |
| 2.8.2 | Analysis page: Decision ID + Execution tab | On analysis/diagnosis page: show Decision ID (from Phase 1); add "Execution" tab with task list, status update, add milestone. | `frontend/src/app/**/analysis*`, new Execution tab component |
| 2.8.3 | Outcome entry form | Simple form to POST outcome (type, measured_at, metrics_json, notes). Can be JSON-to-form later. | New component + API client for POST /api/decisions/{id}/outcomes |

---

# Phase 3 — Capability Intelligence Layer

**Depends on:** Phase 2 (outcomes/tasks optional; can compute from analyses alone).

---

## 3.1 Database

| # | Ticket | Acceptance criteria | File target | Migration name |
|---|--------|----------------------|-------------|-----------------|
| 3.1.1 | Create `capabilities` table | id (pk), code (text unique), domain (text), name (text), description (text). | `alembic/versions/e1f2a3b4c5d6_phase3_capabilities.py` | `e1f2a3b4c5d6` |
| 3.1.2 | Create `capability_scores` table | id (pk), enterprise_id (fk), decision_id (uuid nullable), capability_id (fk), score (numeric), confidence (numeric nullable), evidence_json (jsonb), computed_at. Indexes: (enterprise_id, computed_at), (decision_id). | `alembic/versions/f2a3b4c5d6e7_phase3_capability_scores.py` | `f2a3b4c5d6e7` |
| 3.1.3 | Create `financing_readiness` table | id (pk), enterprise_id (fk), decision_id (uuid nullable), readiness_score (numeric), flags_json (jsonb), rationale_json (jsonb), computed_at. | Same or next migration | `f2a3b4c5d6e7` or `a3b4c5d6e7f8` |

---

## 3.2 Backend — Capability module

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 3.2.1 | Add `app/capability/` package | `engine.py`, `schemas.py`, `routes.py`, `mappings.py`. | `backend/app/capability/*.py` |
| 3.2.2 | Capability + CapabilityScore + FinancingReadiness models | Models match migrations. | `backend/app/db/models.py` |
| 3.2.3 | mappings.py (agent → capability signals) | Deterministic mapping: CFO → cashflow_discipline; COO → operational_reliability; CMO → growth_systemization; CTO → technology_resilience. Input: analysis_json (+ optional tasks/outcomes). Output: capability deltas / scores. | `backend/app/capability/mappings.py` |
| 3.2.4 | engine.py | Parse analysis_json + tasks + outcomes; emit capability_scores and financing_readiness rows; store evidence_json and rationale_json. | `backend/app/capability/engine.py` |
| 3.2.5 | Capability APIs | POST /api/capabilities/recompute?enterprise_id=... (admin/internal); GET /api/enterprises/{id}/capabilities (time series); GET /api/enterprises/{id}/financing-readiness. | `backend/app/capability/routes.py`, `app/main.py` |

---

## 3.3 Frontend (minimal / internal)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 3.3.1 | Enterprise dashboard (internal) | Page shows capability radar/time series (basic charts), financing readiness score + flags. No portfolio view. | `frontend/src/app/enterprise/[id]/dashboard` or internal route |

---

# Phase 4 — Institutional Interface Layer

**Depends on:** Phase 3 (readiness/capabilities for portfolio views).

---

## 4.1 Database

| # | Ticket | Acceptance criteria | File target | Migration name |
|---|--------|----------------------|-------------|-----------------|
| 4.1.1 | Create `institutions` table | id (pk), name (text), type (text), settings_json (jsonb). | `alembic/versions/b4c5d6e7f8a9_phase4_institutions.py` | `b4c5d6e7f8a9` |
| 4.1.2 | Create `portfolios` table | id (pk), institution_id (fk), name (text), created_at. | Same or next | `b4c5d6e7f8a9` |
| 4.1.3 | Create `portfolio_enterprises` table | id (pk), portfolio_id (fk), enterprise_id (fk), added_at. | `alembic/versions/c5d6e7f8a9b0_phase4_portfolio_enterprises.py` | `c5d6e7f8a9b0` |
| 4.1.4 | Optional: institution_users (minimal RBAC) | institution_id, user_id, role; or leave for Supabase Auth later. | Optional migration | `d6e7f8a9b0c1` |

---

## 4.2 Backend — Institutional module

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 4.2.1 | Add `app/institutional/` package | routes.py, service.py, schemas.py, exports.py. | `backend/app/institutional/*.py` |
| 4.2.2 | Institutional service | List portfolios; list enterprises in portfolio; get enterprise snapshot (decisions by domain, execution status, outcomes summary, capability trend, financing readiness). | `backend/app/institutional/service.py` |
| 4.2.3 | exports.py | Export decision versions chain (supersedes), artifact JSON, linked analyses IDs, tasks + milestones evidence, outcomes + timestamps, capability scores + computed_at, financing readiness + rationale. Formats: PDF, JSON, CSV. | `backend/app/institutional/exports.py` |
| 4.2.4 | Institutional routes | GET /api/institutional/portfolios; GET /api/institutional/portfolios/{id}/enterprises; GET /api/institutional/enterprises/{id}/snapshot; GET /api/institutional/decisions/{id}/export?format=pdf|json|csv; GET /api/institutional/enterprises/{id}/export?scope=full|governance|execution|outcomes. | `backend/app/institutional/routes.py`, `app/main.py` |

---

## 4.3 Frontend (institutional area)

| # | Ticket | Acceptance criteria | File target |
|---|--------|----------------------|-------------|
| 4.3.1 | Institutional route group | /institutional, /institutional/portfolios, /institutional/portfolios/[id], /institutional/enterprises/[id]. Export buttons. Table + filters + detail drawer. | `frontend/src/app/institutional/*` |

---

# Dependency chain (summary)

- **Phase 2** depends on Phase 1 (decision_id in decision_records).
- **Phase 3** depends on Phase 2 (outcomes/tasks optional; can still compute from analyses).
- **Phase 4** depends on Phase 3 (readiness/capabilities for portfolio views).

# Parallelization opportunities

- Phase 2: Documents upload API can be built in parallel with execution/outcomes.
- Phase 3: Capability tables + engine can be built while Phase 2 frontend is incomplete.
- Phase 4: Exporters can start once Phase 1/2 schemas exist (export content can be extended when Phase 3 is done).

# Migration order (single chain)

Assuming one linear chain (down_revision):

1. `e5f6a7b8c9d0` — Phase 2 enterprises + enterprise_users  
2. `f6a7b8c9d0e1` — Phase 2 decision_context  
3. `a7b8c9d0e1f2` — Phase 2 implementation_tasks + milestones  
4. `b8c9d0e1f2a3` — Phase 2 outcomes  
5. `c9d0e1f2a3b4` — Phase 2 analyses (enterprise_id, decision_id)  
6. `d0e1f2a3b4c5` — Phase 2 document_links (optional)  
7. `e1f2a3b4c5d6` — Phase 3 capabilities  
8. `f2a3b4c5d6e7` — Phase 3 capability_scores + financing_readiness  
9. `b4c5d6e7f8a9` — Phase 4 institutions + portfolios  
10. `c5d6e7f8a9b0` — Phase 4 portfolio_enterprises  
11. (Optional) `d6e7f8a9b0c1` — institution_users  

**Note:** This repo already has CLEAR `enterprises` (from CLEAR Phase 1). For Phase 2, either **reuse** that table (add columns if needed: industry, region, size_band, settings_json) or create a separate `rtco_enterprises` table and keep CLEAR enterprises unchanged. Ticket 2.2.5 / 2.1.1 should confirm which approach and align migrations and models.

---

# Recommended implementation order (per phase)

**Phase 2 (execute in this order):**  
2.1.1–2.1.2 (enterprises + enterprise_users) → 2.1.3 (decision_context) → 2.1.4–2.1.5 (tasks + milestones) → 2.1.6 (outcomes) → 2.1.7 (analyses columns) → 2.1.8 (document_links optional).  
Then: 2.2.5 + 2.2.1–2.2.4 (enterprise module) → 2.3.1–2.3.3 (decision context) → 2.4.1–2.4.5 (execution) → 2.5.1–2.5.4 (outcomes) → 2.6.1–2.6.3 (documents) → 2.7.1–2.7.3 (wire diagnose) → 2.8.1–2.8.3 (frontend minimal).

**Phase 3:**  
3.1.1–3.1.3 (DB) → 3.2.1–3.2.2 (models + package) → 3.2.3 (mappings) → 3.2.4 (engine) → 3.2.5 (APIs) → 3.3.1 (frontend internal).

**Phase 4:**  
4.1.1–4.1.4 (DB) → 4.2.1–4.2.4 (institutional module + exports) → 4.3.1 (frontend institutional).
