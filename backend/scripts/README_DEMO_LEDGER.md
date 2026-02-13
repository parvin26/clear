# Demo: New decision → attach analysis → try finalize (no constraints/sign-off) → ledger output

## How to run

From the **backend** directory, with a venv that has the project dependencies and a running Postgres (with CLEAR migrations applied):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1   # or your venv
python scripts/demo_decision_finalize_and_ledger.py
```

Or via API (with backend server running on port 8000):

```powershell
$base = "http://localhost:8000"

# 1) Create decision with draft artifact (empty constraints so finalize will fail)
$body = @{
  initial_artifact = @{
    problem_statement = "Demo: finalize without constraints"
    decision_context = @{ domain = "cfo" }
    constraints = @()
    options_considered = @(
      @{ id = "o1"; title = "A"; summary = "Option A" },
      @{ id = "o2"; title = "B"; summary = "Option B" }
    )
    chosen_option_id = "o1"
    rationale = "Demo"
    risk_level = "yellow"
  }
} | ConvertTo-Json -Depth 10
$r = Invoke-RestMethod -Uri "$base/api/clear/decisions" -Method Post -Body $body -ContentType "application/json"
$decisionId = $r.decision_id

# 2) Attach one agent analysis as evidence (use an existing cfo_analyses id, e.g. 1)
$evBody = @{
  decision_id = $decisionId
  evidence_type = "analysis"
  source_ref = @{ system = "db"; table = "cfo_analyses"; id = "1"; uri = $null }
  source_table = "cfo_analyses"
  source_id = "1"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$base/api/clear/decisions/$decisionId/evidence" -Method Post -Body $evBody -ContentType "application/json"

# 3) Try finalize (expect 400 - governance completeness fails: at least one constraint required)
try {
  Invoke-RestMethod -Uri "$base/api/clear/decisions/$decisionId/finalize" -Method Post -Body "{}" -ContentType "application/json"
} catch {
  Write-Host "Finalize (blocked as expected):" $_.Exception.Message
}

# 4) Ledger output
Invoke-RestMethod -Uri "$base/api/clear/decisions/$decisionId/ledger" -Method Get
```

---

## Expected ledger output (when run via script or API)

After creating a decision, attaching one analysis as evidence, and **attempting finalize without constraints** (and without sign-off), the validator blocks finalize. The ledger will show only events up to that point; there will be **no** `ARTIFACT_FINALIZED` or `FINALIZATION_ACKNOWLEDGED` event.

Example (script flow: bootstrap from analysis, then append artifact with empty constraints, then try finalize):

```
--- Ledger output ---
  2025-02-07T...  DECISION_INITIATED  event_id=...
    payload={'actor_id': 'demo', 'actor_role': 'script'}
    actor_id=demo

  2025-02-07T...  ARTIFACT_DRAFT_CREATED  event_id=...
    version_id=...
    payload={'reason': 'bootstrap_from_analysis'}
    actor_id=demo

  2025-02-07T...  ARTIFACT_DRAFT_UPDATED  event_id=...
    version_id=...
    payload={'supersedes_version_id': '...'}
    actor_id=demo

Total events: 3
Derived status: draft
```

**Finalize (blocked as expected):**  
`Governance completeness check failed: At least one constraint required`

So:

1. **New decision** → `DECISION_INITIATED`.
2. **Attach one agent analysis** (bootstrap or POST evidence) → decision has one evidence link; bootstrap also writes `ARTIFACT_DRAFT_CREATED`.
3. **Try finalize without constraints** (artifact has `constraints: []`) → validator fails; no `ARTIFACT_FINALIZED` is written.
4. **No sign-off** → sign-off is only for moving finalized → signed; since we never reached finalized, there is no `FINALIZATION_ACKNOWLEDGED` either.

Ledger remains append-only; failed finalize does not add any event.
