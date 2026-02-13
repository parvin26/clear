# CLEAR API smoke test: create enterprise, decision (incomplete artifact), evidence, try finalize (must fail), fetch ledger.
# Run with backend server up: uvicorn app.main:app --reload (default http://127.0.0.1:8000)
# Usage: .\demo_api_flow.ps1 [ -BaseUrl "http://localhost:8000" ]

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

Write-Host "CLEAR API smoke test (BaseUrl=$BaseUrl)" -ForegroundColor Cyan

# 1) Create enterprise
Write-Host "`n1. POST /api/clear/enterprises" -ForegroundColor Yellow
$entBody = @{ name = "Demo Co"; sector = "retail"; geography = "MY"; operating_model = "b2c"; size_band = "small" } | ConvertTo-Json
$ent = Invoke-RestMethod -Uri "$BaseUrl/api/clear/enterprises" -Method Post -Body $entBody -ContentType "application/json"
$enterpriseId = $ent.id
Write-Host "   Created enterprise id=$enterpriseId"

# 2) Create decision with intentionally incomplete artifact (missing constraints)
Write-Host "`n2. POST /api/clear/decisions (incomplete artifact: constraints empty)" -ForegroundColor Yellow
$decBody = @{
    enterprise_id = $enterpriseId
    initial_artifact = @{
        problem_statement = "Demo: finalize without constraints"
        decision_context = @{ domain = "cfo" }
        constraints = @()
        options_considered = @(
            @{ id = "o1"; title = "Option A"; summary = "A" },
            @{ id = "o2"; title = "Option B"; summary = "B" }
        )
        chosen_option_id = "o1"
        rationale = "Demo"
        risk_level = "yellow"
    }
} | ConvertTo-Json -Depth 10
$dec = Invoke-RestMethod -Uri "$BaseUrl/api/clear/decisions" -Method Post -Body $decBody -ContentType "application/json"
$decisionId = $dec.decision_id
Write-Host "   Created decision decision_id=$decisionId"

# 3) Attach evidence (minimal dummy evidence link)
Write-Host "`n3. POST /api/clear/decisions/$decisionId/evidence" -ForegroundColor Yellow
$evBody = @{
    decision_id = $decisionId
    evidence_type = "analysis"
    source_ref = @{ system = "db"; table = "cfo_analyses"; id = "1"; uri = $null }
    source_table = "cfo_analyses"
    source_id = "1"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BaseUrl/api/clear/decisions/$decisionId/evidence" -Method Post -Body $evBody -ContentType "application/json" | Out-Null
Write-Host "   Attached evidence link"

# 4) Try finalize (must fail with validator error)
Write-Host "`n4. POST /api/clear/decisions/$decisionId/finalize (expect 400)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/clear/decisions/$decisionId/finalize" -Method Post -Body "{}" -ContentType "application/json"
    Write-Host "   FAIL: finalize should have been blocked" -ForegroundColor Red
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    if ($statusCode -eq 400) {
        Write-Host "   Finalize blocked as expected (400): $body" -ForegroundColor Green
    } else {
        Write-Host "   Unexpected error: $statusCode $body" -ForegroundColor Red
        exit 1
    }
}

# 5) Fetch ledger and confirm no ARTIFACT_FINALIZED
Write-Host "`n5. GET /api/clear/decisions/$decisionId/ledger" -ForegroundColor Yellow
$ledger = Invoke-RestMethod -Uri "$BaseUrl/api/clear/decisions/$decisionId/ledger" -Method Get
$finalized = $ledger | Where-Object { $_.event_type -eq "ARTIFACT_FINALIZED" }
if ($finalized) {
    Write-Host "   FAIL: ledger must not contain ARTIFACT_FINALIZED when finalize was blocked" -ForegroundColor Red
    exit 1
}
Write-Host "   Ledger events:" -ForegroundColor Green
$ledger | ForEach-Object { Write-Host "     $($_.created_at) $($_.event_type) event_id=$($_.event_id)" }
Write-Host "   No ARTIFACT_FINALIZED (correct)." -ForegroundColor Green

Write-Host "`nCLEAR API smoke test passed." -ForegroundColor Cyan
