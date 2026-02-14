# RAG smoke test: health + document ingestion (POST /api/documents).
# Run after deploy to confirm pgvector and RAG are working.
# Usage: .\rag_smoke_test.ps1 [-BaseUrl "https://clear-production-c8ca.up.railway.app"]
param(
    [string]$BaseUrl = $env:API_BASE_URL ?? "http://localhost:8000"
)

$ErrorActionPreference = "Stop"
$failed = 0

Write-Host "`nRAG smoke test (API: $BaseUrl)" -ForegroundColor Cyan

# 1) GET /api/health
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 15
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 200 -and $j.status -eq "ok") {
        Write-Host "OK  GET /api/health" -ForegroundColor Green
    } else {
        Write-Host "FAIL GET /api/health : status=$($r.StatusCode) or body not ok" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "FAIL GET /api/health : $_" -ForegroundColor Red
    $failed++
}

# 2) POST /api/documents (RAG ingestion)
$body = @{
    domain   = "finance"
    title    = "RAG smoke test doc"
    content  = "Cash flow and runway matter for SMEs. This is a smoke test for CLEAR RAG."
} | ConvertTo-Json

try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/documents" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 200 -and $j.id -and $j.domain -eq "finance" -and $j.title) {
        Write-Host "OK  POST /api/documents (id=$($j.id), domain=$($j.domain))" -ForegroundColor Green
    } else {
        Write-Host "FAIL POST /api/documents : unexpected response (status=$($r.StatusCode))" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "FAIL POST /api/documents : $_" -ForegroundColor Red
    $failed++
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "Result: $failed check(s) failed" -ForegroundColor Red
    exit 1
}
Write-Host "Result: RAG smoke checks passed (health + document ingestion)" -ForegroundColor Green
exit 0
