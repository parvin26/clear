# CLEAR Capital Governance — System Contracts (Phase 1)

Governance infrastructure contracts. Agent analyses are **evidence artifacts**; the **governed decision record** is the canonical artifact in the append-only ledger. No direct updates to finalized artifacts—only superseding via new artifact version + ledger event.

---

## A. Canonical Decision Artifact JSON Schema

The decision artifact is the single governed record. Required fields must be present for **finalize** to succeed (enforced by governance completeness validator).

### Required fields (block finalize if missing)

| Field | Type | Description |
|-------|------|-------------|
| `problem_statement` | string | Structured, reformulated problem statement (governance-grade). |
| `decision_context` | object | Minimal context: `domain` (cfo \| cmo \| coo \| cto), `enterprise_id` (optional UUID string). |
| `constraints` | array | At least one constraint. Each: `{ "id": string, "type": string, "description": string }`. |
| `options_considered` | array | At least one option. Each: `{ "id": string, "title": string, "summary": string }`. |
| `chosen_option_id` | string | Must match one `options_considered[].id`. |
| `rationale` | string | Why this option; link to constraints and trade-offs. |
| `risk_level` | string | One of: `low`, `medium`, `high`, `green`, `yellow`, `red` (normalize in validator). |

### Optional fields (allowed in draft; not required for finalize)

| Field | Type | Description |
|-------|------|-------------|
| `trade_offs` | array | `{ "option_id", "criterion", "impact" }`. |
| `action_plan` | object | `{ "week": string[], "month": string[], "quarter": string[] }`. |
| `primary_issue` | string | One-line issue summary. |
| `recommendations` | array | strings. |
| `risks` | array | strings. |
| `valid_from` | string | ISO8601 date (effective date). |
| `valid_until` | string | ISO8601 date (optional). |
| `metadata` | object | Extensible key-value. |

### Example (minimal valid for finalize)

```json
{
  "problem_statement": "Working capital shortfall constrains growth; need a governed choice of financing approach.",
  "decision_context": { "domain": "cfo", "enterprise_id": "e1a2b3c4-0000-4000-8000-000000000001" },
  "constraints": [
    { "id": "c1", "type": "regulatory", "description": "Must comply with local lending disclosure requirements." }
  ],
  "options_considered": [
    { "id": "opt1", "title": "Bank line", "summary": "Secure revolving credit line from incumbent bank." }
  ],
  "chosen_option_id": "opt1",
  "rationale": "Bank line chosen given relationship and lowest cost of capital under current constraints.",
  "risk_level": "yellow"
}
```

### Hash and canonicalization (at write time)

- **Canonicalization:** JCS-style (RFC 8785): lexicographic key sort, UTF-8, forbid NaN/Infinity, timestamps normalized to ISO8601 Z. Implemented in `app/governance/canonicalize.py`.
- **Hash:** SHA-256 of canonical JSON (UTF-8 bytes). Stored in `decision_artifacts.canonical_hash`.
- **Artifact storage:** Governed artifact versions live in **decision_artifacts** (insert-only); ledger events reference `version_id` (UUID). No artifact body in ledger; lineage via `supersedes_version_id` in artifacts.

---

## B. Ledger Event Types (Explicit) — State Derived from Ledger

**Source of truth:** `decision_ledger_events` table. Append-only; no updates or deletes. DB triggers forbid UPDATE/DELETE. **Decision state is derived from ledger event sequence**; no mutable `current_status` / `current_artifact_version` on `decisions` table.

### Event types (explicit; no generic status_transition)

| Event type | Description |
|------------|-------------|
| `DECISION_INITIATED` | Decision created. |
| `EVIDENCE_LINKED` | Evidence link added. |
| `ARTIFACT_DRAFT_CREATED` | First or new draft artifact (references `version_id`). |
| `ARTIFACT_DRAFT_UPDATED` | New draft version supersedes prior (payload: `supersedes_version_id`). |
| `VALIDATION_RUN` | Validator run (e.g. completeness check). |
| `FINALIZATION_ACKNOWLEDGED` | Mandatory sign-off; after this, derived status becomes signed. |
| `ARTIFACT_FINALIZED` | Artifact locked (no more edits; supersede only). |
| `DECISION_SUPERSEDED` | New decision/version supersedes this one. |
| *(Reserved)* `IMPLEMENTATION_STARTED`, `MILESTONE_LOGGED`, `IMPLEMENTATION_COMPLETED`, `OUTCOME_CAPTURED`, `DECISION_ARCHIVED` | Future lifecycle. |

### Derived decision status (from ledger order)

Allowed values: `draft` | `finalized` | `signed` | `implemented` | `outcome_tracked` | `archived`. Computed by scanning ledger events (e.g. last `ARTIFACT_FINALIZED` → finalized; last `FINALIZATION_ACKNOWLEDGED` after that → signed).

### Allowed transitions (server-enforced only)

| From | To | Required condition |
|------|----|---------------------|
| — | `draft` | On first `artifact_created` (bootstrap from agent analysis or manual). |
| `draft` | `finalized` | Governance completeness validator passes; no direct artifact edit after. |
| `finalized` | `signed` | At least one `sign_off` event recorded (acknowledgement step). |
| `signed` | `implemented` | Allowed (operational). |
| `implemented` | `outcome_tracked` | Allowed (operational). |
| `outcome_tracked` | `archived` | Allowed (operational). |
| `draft` | `draft` | Via new `artifact_created` with supersedes (new version); no transition event. |

**Rules:**

- Transition from `finalized` backward to `draft` is **not** allowed (artifact is locked).
- Changing a finalized artifact is only by **superseding**: new artifact version + new `artifact_created` ledger event; lineage: `supersedes_event_id`, `reason_code`, `actor_id`, `actor_role`, `changed_fields_summary`.

### Ledger event payload (per event type)

- **artifact_created:** `artifact_snapshot` (full JSON), `artifact_hash`, `artifact_version`, `supersedes_event_id` (if new version), `reason_code`, `actor_id`, `actor_role`, `changed_fields_summary`.
- **status_transition:** `from_status`, `to_status`, `reason_code`, `actor_id`, `actor_role`.
- **sign_off:** `actor_id`, `actor_role`, optional `payload.comment`.

---

## C. Evidence Link Schema

Evidence is first-class; analyses and RAG/docs are **evidence**, not the decision record.

### Table: `decision_evidence_links`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | bigint / UUID | No | Primary key. |
| `decision_id` | UUID | No | FK to `decisions.decision_id`. |
| `evidence_type` | enum | No | `analysis` \| `rag_snippet` \| `document` \| `metric_snapshot`. |
| **`source_ref`** | **JSONB** | **No** | **Unified provenance: `{ "system": "db" \| "object_store" \| "rag" \| "llm", "table", "id", "uri" }`.** |
| `source_table` | string | Yes | Optional convenience (e.g. `cfo_analyses`). |
| `source_id` | string | Yes | Optional convenience (e.g. analysis id). |
| `retrieval_metadata` | JSONB | Yes | For RAG: `{ "query", "top_k", "timestamp" }`. |
| `integrity_hash` | string | Yes | Optional hash of source content at link time. |
| `created_at` | timestamptz | No | When link was created. |

### Evidence types

- **analysis:** Agent diagnostic run (e.g. `source_table` = `cfo_analyses`, `source_id` = analysis id). Used for draft bootstrap.
- **rag_snippet:** A specific RAG retrieval (store query, top_k, timestamp in `retrieval_metadata`).
- **document:** Reference to a document (e.g. `finance_documents`, `tech_documents`).
- **metric_snapshot:** Snapshot of tool output (e.g. financial_tools result); `source_table` could be virtual or reference a snapshot table if added later.

---

## D. Minimal Enterprise Profile Schema

Phase 1 enterprise anchoring; `decisions.enterprise_id` exists day one (nullable).

### Table: `enterprises`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer / UUID | No | Primary key. |
| `name` | string | Yes | Display name. |
| `sector` | string | Yes | Industry/sector (e.g. retail, manufacturing). |
| `geography` | string | Yes | Region/country (e.g. MY, SEA). |
| `operating_model` | string | Yes | e.g. b2b, b2c, marketplace. |
| `size_band` | string | Yes | e.g. micro, small, medium. |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

We use **integer** `id` for enterprises in Phase 1 to match existing `user_id`/FK style; `decisions.enterprise_id` references this. Optional: add `enterprise_uuid` for external refs later.

---

## Chat attachment to decisions (Phase 1)

- **Option chosen:** Mapping table (no change to existing chat message tables).
- **Table:** `decision_chat_sessions` — `(decision_id UUID, session_id string, agent_domain string)`, PK `(decision_id, session_id, agent_domain)`.
- **Contract:** (1) When user is in Decision Workspace, require `PUT /api/clear/decisions/{id}/chat-session` (with `session_id`, `agent_domain`) before any in-scope chat call. (2) If a chat message is out-of-scope for the current decision, the backend may respond with `requires_new_decision: true` and the client must start a new decision initiation. (3) No scope drift: new problem → new decision.

---

## Governance completeness validator (finalize gate)

Before writing `status_transition` to `finalized`:

1. Load current artifact from latest `artifact_created` event for that decision.
2. Check required fields present: `problem_statement`, `decision_context`, `constraints` (length ≥ 1), `options_considered` (length ≥ 1), `chosen_option_id` in `options_considered[].id`, `rationale`, `risk_level`.
3. If any missing or invalid → return 400 with list of missing/invalid fields; do **not** write ledger event.
4. If valid → write `status_transition` to `finalized` (and optionally a separate `sign_off` flow: finalize then require sign_off before `signed`).

**Mandatory acknowledgement (sign-off):** To move `finalized` → `signed`, at least one `sign_off` event must exist for that decision. Server enforces: transition to `signed` only if sign_off recorded.
