# Start the backend API (use venv Python so all deps are found).
# Runs migrations first, then starts the server so the server stays up.
# From repo root: .\backend\run.ps1
# From backend:   .\run.ps1
$ErrorActionPreference = "Stop"
$BackendDir = $PSScriptRoot
Set-Location $BackendDir

Write-Host "Running database migrations..."
& "$BackendDir\venv\Scripts\python.exe" -m alembic -c alembic.ini upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed (exit $LASTEXITCODE). Fix errors above, or start server anyway with: .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    exit $LASTEXITCODE
}
Write-Host "[OK] Migrations done. Starting server..."
& "$BackendDir\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
