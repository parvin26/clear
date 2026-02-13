# Pre-push and deployment checklist

Use this before pushing to git and when deploying to Vercel so the site is safe and functional for early users.

---

## Critical before pushing to Git

### 1. No secrets in the repo
- [ ] **`.env` and `.env.local` are not committed** — They are listed in `.gitignore` (`backend/.env`, `frontend/.env.local`). Confirm with `git status` that they do not appear as staged or untracked.
- [ ] **No API keys or passwords in code** — All secrets belong in environment variables (e.g. `OPENAI_API_KEY`, `DATABASE_URL`). The repo uses `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL` and backend `ENV_TEMPLATE` with placeholders only.
- [ ] **`backend/exec/` is ignored** — This is the legacy venv; it must not be committed (already in `.gitignore`).

### 2. Build and type-check
- [ ] **Frontend builds** — From repo root: `cd frontend && npm run build` (or `npm run build` in `frontend`). Fix any TypeScript or build errors before pushing.
- [ ] **Optional: type-check only** — `cd frontend && npx tsc --noEmit` to verify types without a full build.

### 3. What you can safely commit
- **Modified and new app code** — All frontend/backend app and config changes you intend to deploy.
- **`backend/ENV_TEMPLATE`** — Safe; it contains only placeholder variable names, no real values.
- **Docs and migrations** — `docs/`, `backend/docs/`, `backend/alembic/versions/` as needed for your release.
- **New pages and CLEAR blocks** — e.g. `frontend/src/app/governance`, `for-enterprises`, `for-partners`, `pricing`, `guided-start`, `frontend/src/components/clear-blocks/`.

### 4. Optional but recommended
- [ ] Run **`npm run lint`** in `frontend` and fix critical lint issues.
- [ ] Ensure **CI** (e.g. `.github/workflows/ci.yml`) passes if you have it; fix any failures you care about for this release.

---

## After push: Vercel (frontend)

### Environment variables (required for a working site)
In the Vercel project → Settings → Environment Variables, set at least:

| Variable | Description | Example (production) |
|----------|-------------|----------------------|
| `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL used by the frontend | `https://your-api.railway.app` or your backend URL |

- If unset, the app falls back to `http://localhost:8000`, so production will try to call localhost and fail.
- Add the same variable for **Production**, and optionally for Preview if you use preview deployments.

### Build settings (typical)
- **Framework Preset:** Next.js  
- **Root Directory:** `frontend` (if the repo root is the monorepo root and the Next app is in `frontend`).  
- **Build Command:** `npm run build` (default).  
- **Output:** Next.js default (no override needed).

### Backend
- The frontend only needs to know the **backend URL**. The backend (FastAPI) is usually deployed elsewhere (e.g. Railway, Render, Fly.io, or a VPS). Ensure CORS allows your Vercel domain (e.g. `https://your-app.vercel.app`).

---

## Quick commands (from repo root)

```powershell
# 1. Confirm env files are not staged
git status

# 2. Build frontend (Windows PowerShell)
cd frontend; npm run build

# 3. Stage and push (example)
git add .
git status
git commit -m "Your message"
git push origin main
```

---

## Summary

- **Must-do before push:** No `.env` / `.env.local` committed; frontend builds successfully.  
- **Must-do for Vercel:** Set `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_API_BASE_URL`) to your live backend URL.  
- **Recommended:** Run lint and type-check; ensure CI is green if you use it.

Once these are done, the site is in a good state for early users to view and try the product while you continue building remaining features.
