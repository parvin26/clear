# CLEAR demo API smoke test: read-only fixture endpoints.
# Run with backend server up. Confirms demo is not broken before deploy.
# Usage: .\demo_demo_api_flow.ps1 [ -BaseUrl "http://localhost:8000" ]

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

Write-Host "CLEAR demo API smoke test (BaseUrl=$BaseUrl)" -ForegroundColor Cyan

function Assert-Status200 {
    param([object]$Response, [string]$Step)
    if (-not $Response) {
        Write-Host "   FAIL: $Step - no response" -ForegroundColor Red
        exit 1
    }
    Write-Host "   OK: $Step" -ForegroundColor Green
}

# 1) GET /api/demo
Write-Host "`n1. GET /api/demo" -ForegroundColor Yellow
try {
    $overview = Invoke-RestMethod -Uri "$BaseUrl/api/demo" -Method Get
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
if ($overview.demo -ne $true) { Write-Host "   FAIL: demo flag missing" -ForegroundColor Red; exit 1 }
if (-not $overview.enterprises) { Write-Host "   FAIL: enterprises missing" -ForegroundColor Red; exit 1 }
if (-not $overview.portfolios) { Write-Host "   FAIL: portfolios missing" -ForegroundColor Red; exit 1 }
Assert-Status200 $overview "overview returned"

# 2) GET /api/demo/enterprise
Write-Host "`n2. GET /api/demo/enterprise" -ForegroundColor Yellow
try {
    $list = Invoke-RestMethod -Uri "$BaseUrl/api/demo/enterprise" -Method Get
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
if ($list.demo -ne $true) { Write-Host "   FAIL: demo flag missing" -ForegroundColor Red; exit 1 }
if (-not $list.enterprises) { Write-Host "   FAIL: enterprises missing" -ForegroundColor Red; exit 1 }
Assert-Status200 $list "enterprise list returned"

# 3) GET /api/demo/enterprise/ent-1
Write-Host "`n3. GET /api/demo/enterprise/ent-1" -ForegroundColor Yellow
try {
    $detail = Invoke-RestMethod -Uri "$BaseUrl/api/demo/enterprise/ent-1" -Method Get
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
$required = @("demo", "enterprise", "decisions", "milestones", "outcomes", "sharing", "memory_snippets")
foreach ($key in $required) {
    if (-not ($detail.PSObject.Properties.Name -contains $key)) {
        Write-Host "   FAIL: enterprise detail missing field: $key" -ForegroundColor Red
        exit 1
    }
}
Assert-Status200 $detail "enterprise detail with decisions, milestones, outcomes, sharing, memory_snippets"

# 4) GET /api/demo/portfolio
Write-Host "`n4. GET /api/demo/portfolio" -ForegroundColor Yellow
try {
    $portfolio = Invoke-RestMethod -Uri "$BaseUrl/api/demo/portfolio" -Method Get
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
if ($portfolio.demo -ne $true) { Write-Host "   FAIL: demo flag missing" -ForegroundColor Red; exit 1 }
if (-not $portfolio.portfolios) { Write-Host "   FAIL: portfolios missing" -ForegroundColor Red; exit 1 }
Assert-Status200 $portfolio "portfolio returned"

Write-Host "`nDemo API smoke test passed." -ForegroundColor Cyan
