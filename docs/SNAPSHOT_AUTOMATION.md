# Snapshot automation

Monthly snapshots (Health, Velocity, ECRI) can be run on demand from the admin UI or via a script/cron.

## Admin UI

1. Go to **Institutional → Admin**: `/institutional/admin`
2. Under **Snapshots**, choose scope: **All enterprises**, **By cohort**, or **By portfolio**
3. If using cohort/portfolio, select the cohort or portfolio
4. Click **Run monthly snapshots**
5. Results show enterprises processed, counts per snapshot type, and any errors

The UI calls a Next.js API route that forwards the request to the backend with `ADMIN_API_KEY` from the server environment, so the key is never sent to the browser.

## Script (cron / manual)

From the repo root (or with `backend` on `PYTHONPATH`):

```bash
# All enterprises (default base URL http://localhost:8000)
python backend/scripts/run_monthly_snapshots.py --admin-api-key YOUR_ADMIN_KEY

# Custom base URL (e.g. production)
python backend/scripts/run_monthly_snapshots.py --base-url https://api.yourdomain.com --admin-api-key YOUR_ADMIN_KEY

# One enterprise
python backend/scripts/run_monthly_snapshots.py --admin-api-key YOUR_ADMIN_KEY --enterprise-id 1

# One cohort
python backend/scripts/run_monthly_snapshots.py --admin-api-key YOUR_ADMIN_KEY --cohort-id 2

# One portfolio
python backend/scripts/run_monthly_snapshots.py --admin-api-key YOUR_ADMIN_KEY --portfolio-id 3
```

**Required:**

- `--admin-api-key` must match the backend env var `ADMIN_API_KEY`.

**Optional:**

- `--base-url` — backend base URL (default: `http://localhost:8000`)
- `--enterprise-id` — run only for this enterprise
- `--cohort-id` — run only for enterprises in this cohort
- `--portfolio-id` — run only for enterprises in this portfolio

Exit code: `0` on success, `1` on HTTP error or when the response includes an `errors` array with entries.

## Deployment options

- **GitHub Actions**: schedule a workflow on the 1st of each month that runs the script against your production API (store `ADMIN_API_KEY` in secrets).
- **Server cron**: on your app server or a runner, add a cron job, e.g. `0 2 1 * *` (2 AM on the 1st) to run the script with `--base-url` and `--admin-api-key`.
- **Manual**: run the script or use the Admin UI on the first of the month.

## Backend

- **Route**: `POST /api/admin/snapshots/run-monthly`
- **Auth**: header `X-Admin-API-Key` or `Admin-Api-Key` must equal `ADMIN_API_KEY`
- **Body** (optional): `{ "enterprise_id": 1 }` or `{ "cohort_id": 2 }` or `{ "portfolio_id": 3 }`. If omitted, all enterprises are processed.
- **Response**: `{ "enterprises_processed": N, "snapshots_written": { "health": N, "velocity": N, "readiness": N }, "errors": [] }`

Snapshots are idempotent per month (upsert by first day of current month).
