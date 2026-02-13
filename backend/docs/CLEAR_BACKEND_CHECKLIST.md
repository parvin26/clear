# CLEAR backend-first checklist (enforcement + proof)

Governance core is technically enforced before frontend work. This checklist reflects what’s **done** vs **pending** and how to prove and test it.

---

## 1) Done (backend governance backbone)

| Item | Where |
|------|--------|
| State derived from ledger (no mutable status) | `_derive_status_from_ledger()` in `ledger_service.py`; used in API responses for `current_status`. |
| Artifact versioning (insert-only) | `decision_artifacts`: `version_id`, `canonical_json`, `canonical_hash`, `supersedes_version_id`. |
| Finalize gated by validator + evidence | `finalize_decision()`: `governance_completeness_errors()` + evidence count ≥ 1; writes `ARTIFACT_FINALIZED` only. |
| Evidence first-class with `source_ref` | `decision_evidence_links.source_ref` (required); `EvidenceLinkCreate` / API require it. |
| Decision-scoped chat | `decision_chat_sessions` + `PUT /api/clear/decisions/{id}/chat-session`. |
| **Supersedes server-side** | `append_artifact_created()` computes `supersedes_version_id` from latest artifact; client param removed. |
| **Derived status mapping** | `IMPLEMENTATION_STARTED` → `in_progress`; `IMPLEMENTATION_COMPLETED` → `implemented`. `DerivedDecisionStatus.IN_PROGRESS` added. |
| **Canonicalization contract** | `app/governance/canonicalize.py`: key sort, UTF-8, no NaN/Inf, ISO8601 Z; deterministic hash. |
| **Canonicalization proof test** | `tests/test_canonicalization.py`: same artifact ⇒ same hash; run without DB. |
| **Immutability proof (SQL)** | `docs/CLEAR_IMMUTABILITY_PROOF.md`: UPDATE/DELETE on ledger and artifacts must fail (triggers). |
| **API smoke test** | `scripts/demo_api_flow.ps1` + `scripts/README_DEMO_API_FLOW.md`: enterprise → decision (incomplete) → evidence → finalize (fail) → ledger (no ARTIFACT_FINALIZED). |

---

## 2) Contract semantics (locked)

- **Finalize:** Governance completeness validator must pass **and** ≥ 1 evidence link. Writes `ARTIFACT_FINALIZED`; no mutation of artifact or decision row.
- **Acknowledgement (sign-off):** After finalize, `FINALIZATION_ACKNOWLEDGED` is the mandatory step before derived status becomes `signed`. Option B: FINALIZE (lock) → ACK (sign). Terminology: “finalize” = completeness lock; “ack” = signing.
- **Supersedes:** Server computes from latest artifact; client must not supply it.
- **Ledger / artifacts:** Append-only; DB triggers forbid UPDATE/DELETE.

---

## 3) How to prove enforcement (repeatable)

### Immutability (DB)

1. Run the SQL in `docs/CLEAR_IMMUTABILITY_PROOF.md` (preflight + UPDATE/DELETE attempts).
2. Expect: trigger errors for any UPDATE/DELETE on `decision_ledger_events` and `decision_artifacts`.

### Finalize gate

1. Start backend.
2. Run `scripts/demo_api_flow.ps1` (PowerShell).
3. Expect: finalize returns 400; ledger has no `ARTIFACT_FINALIZED`.

### Canonicalization

1. From `backend`: `python tests/test_canonicalization.py`.
2. Expect: “Canonicalization proof: all assertions passed.”

---

## 4) Pending / later

- **Frontend:** No design polish until backend compliance is the gating milestone. Later: workflow screens, “new problem ⇒ new decision” guardrails.
- **Optional:** Stricter array ordering in canonicalize (e.g. domains/options/criteria) if required by contract; currently key sort + normalization is in place.

---

## 5) Cursor “next actions” (delivered)

- [x] **Supersedes server-side:** Client param removed; server sets `supersedes_version_id` from latest artifact in `append_artifact_created()`.
- [x] **Status mapping:** `IN_PROGRESS` for `IMPLEMENTATION_STARTED`; `IMPLEMENTATION_COMPLETED` → `IMPLEMENTED`; transition endpoint supports both.
- [x] **Canonicalization:** Rules documented in `canonicalize.py`; `tests/test_canonicalization.py` proves deterministic hash.
- [x] **Immutability proof:** `docs/CLEAR_IMMUTABILITY_PROOF.md` with SQL that must fail.
- [x] **Runnable API demo:** `scripts/demo_api_flow.ps1` and `scripts/README_DEMO_API_FLOW.md`.
