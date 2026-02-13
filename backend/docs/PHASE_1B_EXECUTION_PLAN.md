# Phase 1B — Governance Enforcement + Pilot-Ready Discipline (Exit Gate)

**Role:** CLEAR Governance Architect (backend-first).  
**Goal:** Convert Phase 1 from “records exist” → **provable governance enforcement** + pilot-ready discipline.  
**Constraints:** Additive only; preserve agents + RAG; decision state derived from ledger; backend-first.

---

## Definition of Done (Phase 1B exit gate)

An auditor can be handed a folder with:

- **API smoke proof** — Script run + saved output showing finalize gate and ledger semantics.
- **Immutability proof** — SQL outputs showing UPDATE/DELETE blocked on ledger, artifacts, and decision_records (and RTCO ledger/evidence where applicable).
- **Contract JSON** — `GET /api/clear/contract` returns semantic lock (versions, event enums, rules).
- **Canonicalization test passing** — `pytest tests/test_canonicalization.py` in CI; same artifact ⇒ same hash.
- **Evidence provenance visible** — Every new decision has at least one evidence link (e.g. `analysis:{table}:{id}`).

---

## Ticket boundary (ordered execution)

| # | Ticket | Acceptance criteria | File targets |
|---|--------|---------------------|--------------|
| **1.1** | DB: Triggers on `decision_records` | UPDATE/DELETE on `decision_records` raise; no row updated/deleted. | `alembic/versions/<new>_phase1b_decision_records_immutability.py`, `CLEAR_IMMUTABILITY_PROOF.md` (extend) |
| **1.2** | RTCO ledger table + triggers | Table `rtco_decision_ledger_events` (id, decision_id uuid, event_type, event_payload jsonb, created_at); triggers block UPDATE/DELETE. Event types: DECISION_CREATED, DECISION_FINALIZED, DECISION_ACKED (reserve: DECISION_REVISED, EVIDENCE_ATTACHED). | New migration, `app/db/models.py` |
| **1.3** | Finalize semantics (event-only) | `is_finalized` = exists event DECISION_FINALIZED for decision_id; no status column on decision_records. | Runtime in service/API when needed |
| **2.1** | Canonicalization + hash on decision_records | Columns: canonicalization_version, artifact_hash, (optional) artifact_canonical_json. Hash written at creation. Rules documented in code + contract. | Migration, `app/db/models.py`, `app/governance_engine/rtco_service.py`, reuse `app/governance/canonicalize.py` |
| **2.2** | CI: canonicalization test | `pytest tests/test_canonicalization.py` passes in CI. | `.github/workflows/ci.yml` (already present) |
| **3.1** | GET /api/clear/contract | Returns contract_version, canonicalization_version, finalize_semantics, artifact_status_rule, ledger_event_enums, reserved_phase2_enums; no DB. | `app/routes/clear_routes.py` |
| **4.1** | Proof folder + proof files | `backend/docs/proofs/`; proof_api_smoke_YYYYMMDD.md (from demo_api_flow.ps1); proof_immutability_YYYYMMDD.md (from CLEAR_IMMUTABILITY_PROOF SQL). | `docs/proofs/`, existing proofs updated if needed |
| **5.1** | RTCO evidence link table + triggers | Table `rtco_decision_evidence_links` (id, decision_id uuid, source_type, source_ref, meta_json, created_at); append-only triggers. | New migration, `app/db/models.py` |
| **5.2** | Wire evidence on decision create | On successful decision record insert: insert evidence link source_type=analysis, source_ref="{analysis_table}:{analysis_id}". | `app/governance_engine/rtco_service.py` |
| **6.1** | Decision chat session (CLEAR exists) | decision_chat_sessions present; decision-scoped chat linked. | Already in CLEAR; verify |
| **6.2** | Scope guard helper | If request has decision_id: require/attach session via decision_chat_sessions. Heuristic v1: “new problem” → requires_new_decision, do not write to decision history. | `app/governance_engine/scope_guard.py`, minimal patch to chat routes |
| **7** | CI: contract + canonicalization | Run canonicalization pytest; optional GET /api/clear/contract in CI. | `.github/workflows/ci.yml` |
| **8** | Secrets hardening | .env in .gitignore; ENV_TEMPLATE (placeholders only). User: rotate OpenAI key, Supabase password, replace .env. | `.gitignore`, `backend/ENV_TEMPLATE` |

---

## Implementation notes

- **decision_records:** Add trigger function (e.g. `rtco_forbid_update_delete`) and trigger on `decision_records`. Reuse pattern from CLEAR (clear_forbid_update_delete).
- **rtco_decision_ledger_events:** Append-only; on create_decision_from_analysis insert DECISION_CREATED. DECISION_FINALIZED / DECISION_ACKED added when finalize/ack flows are implemented (Phase 1B can stub or add minimal endpoint).
- **Canonicalization:** Reuse `app.governance.canonicalize.compute_canonical_hash`; store in `decision_records.artifact_hash` and set `canonicalization_version = "canon_v1"`.
- **Contract endpoint:** Static JSON; no DB. Mount under existing CLEAR router.
- **Evidence:** One row per decision at creation (analysis source_ref). Optional: tool/rag links later.
- **Scope guard:** New module; chat routes check decision_id and session linkage; return `requires_new_decision` when heuristic suggests new problem.

---

## Auditor handoff checklist

- [ ] Run `backend/scripts/demo_api_flow.ps1`; save output to `docs/proofs/proof_api_smoke_YYYYMMDD.md`.
- [ ] Run SQL from `docs/CLEAR_IMMUTABILITY_PROOF.md` (including decision_records and rtco tables); save to `docs/proofs/proof_immutability_YYYYMMDD.md`.
- [ ] `GET /api/clear/contract` returns contract JSON.
- [ ] `pytest tests/test_canonicalization.py` passes.
- [ ] For at least one decision, `rtco_decision_evidence_links` has ≥1 row with source_ref like `cfo_analyses:123`.
