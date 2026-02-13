# Smoke test: verify core API and optional frontend are reachable.
# Usage: .\smoke_test.ps1 [-BaseUrl "http://localhost:8000"] [-FrontendUrl "http://localhost:3003"] [-AuthToken "Bearer ..."]
param(
    [string]$BaseUrl = $env:API_BASE_URL ?? "http://localhost:8000",
    [string]$FrontendUrl = $env:FRONTEND_URL ?? "",
    [string]$AuthToken = $env:CLEAR_ACCESS_TOKEN ?? ""
)

$ErrorActionPreference = "Stop"
$failed = 0

function Invoke-Smoke {
    param([string]$Method, [string]$Url, [hashtable]$Headers = @{}, [bool]$Optional = $false)
    try {
        $h = @{ "User-Agent" = "SmokeTest/1.0" }
        foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] }
        $r = Invoke-WebRequest -Uri $Url -Method $Method -Headers $h -UseBasicParsing -TimeoutSec 15
        return $r.StatusCode -eq 200
    } catch {
        if ($Optional) { return $true }
        Write-Host "FAIL $Method $Url : $_" -ForegroundColor Red
        return $false
    }
}

function Get-SmokeJson {
    param([string]$Method, [string]$Url, [hashtable]$Headers = @{})
    try {
        $h = @{ "User-Agent" = "SmokeTest/1.0" }
        foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] }
        $r = Invoke-WebRequest -Uri $Url -Method $Method -Headers $h -UseBasicParsing -TimeoutSec 15
        return $r.Content | ConvertFrom-Json
    } catch {
        Write-Host "FAIL $Method $Url : $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "`nSmoke test (API: $BaseUrl)" -ForegroundColor Cyan

# 1) GET /api/health
if (-not (Invoke-Smoke -Method GET -Url "$BaseUrl/api/health")) { $failed++ }
else { Write-Host "OK  GET /api/health" -ForegroundColor Green }

# 2) GET /api/demo — must return enterprises and portfolios
$demo = Get-SmokeJson -Method GET -Url "$BaseUrl/api/demo"
if (-not $demo) { $failed++ }
elseif (-not ($demo.enterprises -is [Array]) -or -not ($demo.portfolios -is [Array])) {
    Write-Host "FAIL GET /api/demo : response missing enterprises or portfolios" -ForegroundColor Red
    $failed++
} else {
    Write-Host "OK  GET /api/demo (enterprises: $($demo.enterprises.Count), portfolios: $($demo.portfolios.Count))" -ForegroundColor Green
}

# 3) GET /api/auth/me (auth optional; 200 or 401 both ok for smoke)
try {
    $h = @{}
    if ($AuthToken) { $h["Authorization"] = $AuthToken }
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/auth/me" -Method GET -Headers (@{"User-Agent"="SmokeTest/1.0"} + $h) -UseBasicParsing -TimeoutSec 15
    Write-Host "OK  GET /api/auth/me (200)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "OK  GET /api/auth/me (401, no auth)" -ForegroundColor Green
    } else {
        Write-Host "FAIL GET /api/auth/me : $_" -ForegroundColor Red
        $failed++
    }
}

# 4) GET /api/institutional/cohorts — auth required; skip if no token
if ($AuthToken) {
    if (-not (Invoke-Smoke -Method GET -Url "$BaseUrl/api/institutional/cohorts" -Headers @{ "Authorization" = $AuthToken })) { $failed++ }
    else { Write-Host "OK  GET /api/institutional/cohorts" -ForegroundColor Green }
} else {
    Write-Host "SKIP GET /api/institutional/cohorts (no CLEAR_ACCESS_TOKEN)" -ForegroundColor Yellow
}

# Optional: frontend /start and /demo
if ($FrontendUrl) {
    Write-Host "`nFrontend ($FrontendUrl)" -ForegroundColor Cyan
    if (-not (Invoke-Smoke -Method GET -Url "$FrontendUrl/start")) { $failed++ }
    else { Write-Host "OK  GET /start" -ForegroundColor Green }
    if (-not (Invoke-Smoke -Method GET -Url "$FrontendUrl/demo")) { $failed++ }
    else { Write-Host "OK  GET /demo" -ForegroundColor Green }
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "Result: $failed check(s) failed" -ForegroundColor Red
    exit 1
}
Write-Host "Result: all checks passed" -ForegroundColor Green
exit 0
