# Phase 2 proof: Evidence provenance

**Purpose:** Show that every new decision has evidence links (at least analysis; optional RAG docs).

## Steps to generate (run locally, then paste output below)

1. Create a decision from an agent analysis (e.g. run CFO/CMO/COO/CTO diagnose and ensure RTCO creates a decision record, or use CLEAR bootstrap-from-analysis).

2. For **RTCO** decisions (decision_records): query evidence links:
   - Table: `rtco_decision_evidence_links`
   - Filter by the decision’s `decision_id` (UUID).
   - Expect at least one row with `source_type = 'analysis'` and `source_ref` like `cfo_analyses:123`.

3. For **CLEAR** decisions: list evidence via API:
   ```bash
   curl "http://localhost:8000/api/clear/decisions/{decision_id}/evidence"
   ```
   Expect at least one link (e.g. analysis or rag_doc).

4. Optionally: run a diagnose that uses RAG and confirm an additional evidence link with `source_type` (e.g. `rag_doc`) when doc IDs are available.

## Proof output (paste here after running)

```
(Replace with query results or API response showing decision_id and at least one evidence link.)
```

## Acceptance

- [ ] Every new decision (RTCO or CLEAR) has at least one evidence link (analysis reference).
- [ ] When RAG is used and doc IDs are available, RAG evidence links are attached where implemented.
