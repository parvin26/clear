# Run Alembic migrations against DATABASE_URL.
# Use this to create/update schema on pgvector (or any Postgres) when release phase didn't run.
# From repo root: .\backend\scripts\run_migrations.ps1
# From backend:   .\scripts\run_migrations.ps1
# Set DATABASE_URL to your DB URL (e.g. pgvector public URL from Railway) if not already in .env.
$ErrorActionPreference = "Stop"
$BackendDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $BackendDir
if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL not set. Set it to your Postgres URL (e.g. pgvector public URL from Railway)." -ForegroundColor Yellow
    exit 1
}
Write-Host "Running migrations (database from DATABASE_URL)..." -ForegroundColor Cyan
python -m alembic -c alembic.ini upgrade head
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[OK] Migrations done." -ForegroundColor Green
