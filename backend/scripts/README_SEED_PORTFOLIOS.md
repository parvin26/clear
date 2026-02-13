# Seed dummy portfolios

Seeds institutions, portfolios, enterprises, decisions (with artifacts), portfolio_enterprises, and outcome reviews so the **Portfolios** list, **Portfolio detail** (enriched enterprises + readiness), and **Dashboard** show data.

## Prerequisites

- Database migrated: `alembic upgrade head`
- `DATABASE_URL` in `backend/.env` points to your Postgres

## Run

From repo root:

```powershell
cd backend
python -m scripts.seed_portfolios
```

Or from backend with Python path:

```powershell
cd backend
$env:PYTHONPATH = "."
python scripts/seed_portfolios.py
```

## Data

- **Input:** `scripts/seed_portfolios_data.json` (10 portfolios, varied institutions, enterprises, readiness bands, domains).
- **Creates:** Institutions → Portfolios → Enterprises → Decisions (with one artifact each) → PortfolioEnterprise links → OutcomeReviews (where `last_review_date` is set).

## Where to see it

- **Institutional portfolios list:** `/institutional/portfolios` (or “Portfolios” from role selector).
- **Portfolio detail:** `/institutional/portfolios/{id}` — enterprises with last decision, readiness band, primary domain, last review date, plan committed.
- **Dashboard:** `/dashboard` — lists decisions (all enterprises’ decisions will appear if the app lists by current user/context; otherwise ensure you’re viewing in a context that includes these enterprises).

## Re-run

The script does not clear existing data. To reset and re-seed, truncate or delete from `portfolio_enterprises`, `outcome_reviews`, `decision_artifacts`, `decision_ledger_events`, `decisions`, `portfolios`, `institutions`, `enterprises` (in dependency order), then run the script again.
