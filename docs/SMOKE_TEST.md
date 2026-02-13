# Smoke test

One command verifies the site and API are healthy after deploy.

## Backend (API)

From repo root or from `backend`:

```powershell
# Default API base: http://localhost:8000
.\backend\scripts\smoke_test.ps1

# Custom API base (e.g. production)
.\backend\scripts\smoke_test.ps1 -BaseUrl "https://api.yourdomain.com"

# With auth (to include GET /api/institutional/cohorts)
$env:CLEAR_ACCESS_TOKEN = "Bearer your-jwt-here"
.\backend\scripts\smoke_test.ps1
```

**Checks:**

- **GET /api/health** — must return 200 and `{"status":"ok"}`.
- **GET /api/demo** — must return 200 and a body with `enterprises` and `portfolios` arrays.
- **GET /api/auth/me** — must return 200 (if authenticated) or 401 (if not); both count as pass.
- **GET /api/institutional/cohorts** — run only when `CLEAR_ACCESS_TOKEN` (or `-AuthToken`) is set; must return 200.

**Pass criteria:** all run checks return 200 (or 401 for `/api/clear/me` when unauthenticated). Demo endpoint must include enterprises and portfolios.

## Frontend (optional)

To include frontend pages in the smoke test, set `FRONTEND_URL` or pass `-FrontendUrl`:

```powershell
.\backend\scripts\smoke_test.ps1 -FrontendUrl "http://localhost:3003"
.\backend\scripts\smoke_test.ps1 -BaseUrl "https://api.example.com" -FrontendUrl "https://app.example.com"
```

This adds:

- **GET /start** — must return 200.
- **GET /demo** — must return 200.

## Environment variables

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `API_BASE_URL`       | Backend base URL (default: `http://localhost:8000`) |
| `FRONTEND_URL`       | Frontend base URL; if set, /start and /demo are checked |
| `CLEAR_ACCESS_TOKEN` | Optional JWT (e.g. `Bearer ...`) to test auth-only routes |

## Exit code

- **0** — all checks passed.
- **1** — one or more checks failed.

Typical use: run after deploy and fail the pipeline if exit code is not 0. Target: verify in under 2 minutes.
