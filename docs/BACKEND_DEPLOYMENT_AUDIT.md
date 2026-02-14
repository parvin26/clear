# Backend Deployment Audit: Exec-Connect

This document is a **DevOps audit and action plan** so your Vercel frontend can fully function with the backend (AI, diagnostics, execution workflows).

---

## Quick fix: “Connection to localhost:5432 refused” on Railway

If your deploy logs show:

- **Database URL: postgresql+psycopg://postgres:postgres@localhost:5...**
- **OPENAI_API_KEY: ...(not set)**
- **connection to server at "127.0.0.1", port 5432 failed: Connection refused**

then the backend is using **default config** because the **backend service in Railway has no (or wrong) environment variables**. The app is trying to connect to Postgres on localhost, but there is no database inside the backend container.

**Do this on the backend service in Railway:**

1. **Variables** (or **Settings → Variables**):
   - **DATABASE_URL**  
     - If you have a **Postgres** service in the same Railway project: use a **variable reference**, e.g. `${{Postgres.DATABASE_URL}}` or `${{Postgres.DATABASE_PRIVATE_URL}}` (replace `Postgres` with your DB service name).  
     - Or copy the connection string from the Postgres service → **Variables** or **Connect** (e.g. `postgresql://user:pass@host:port/railway`). The app accepts `postgresql://` and will convert to `postgresql+psycopg://` if needed.
   - **OPENAI_API_KEY**  
     Set to a valid OpenAI API key (required for AI endpoints).
   - **CORS_ORIGINS**  
     Set to your Vercel app origin, e.g. `https://your-app.vercel.app` (comma-separated if you have more; no trailing slash).

2. Save and **redeploy** the backend (or let Railway redeploy after variable changes).

3. Confirm in the **latest deploy logs** that you see:
   - `Database URL: postgresql+psycopg://...@<some-host>...` (not `localhost`)
   - `OPENAI_API_KEY: ...xxxx` (last 4 chars)
   - `[OK] Database connection successful`

If you **don’t have a Postgres service** in Railway yet: add one (Railway → **+ New** → **Database** → **Postgres**), then set **DATABASE_URL** on the backend to that database’s URL (variable reference or copied value).

---

## Quick fix: "ModuleNotFoundError: No module named 'psycopg2'" on Railway

If deploy logs show SQLAlchemy loading the **psycopg2** dialect and failing with **No module named 'psycopg2'**, the cause is that Railway (or your Postgres provider) often sets **DATABASE_URL** as `postgresql+psycopg2://...`, while this app uses the **psycopg v3** driver (`psycopg[binary]`) and expects `postgresql+psycopg://`.

**Fix (in code):** The app normalizes the URL in two places so the correct driver is always used:
- **`app/config.py`**: `DATABASE_URL` validator converts `postgresql+psycopg2://`, `postgresql://`, and `postgres://` to `postgresql+psycopg://`.
- **`app/db/database.py`**: `_normalize_db_url()` is applied to `settings.DATABASE_URL` before `create_engine()`, so even if config didn’t normalize (e.g. old deploy), the engine still gets a psycopg v3 URL.

After pulling the latest backend and redeploying on Railway, the backend should use the installed psycopg (v3) driver and start successfully. No need to add `psycopg2-binary` unless you want to support the legacy driver.

---

## Step 1: Deployment status discovery (please answer)

Gather the following and fill in or paste your answers. This will drive Step 3 (what’s missing) and Step 4 (checklist).

### 1.1 Backend and repo

| Question | Your answer |
|----------|-------------|
| **Backend framework** | *(Confirmed: **FastAPI**; see `backend/app/main.py`.)* |
| **Backend code location** | Same repo as frontend: root `exec-connect`; backend lives in **`backend/`** (or `exec-connect/backend/` if repo root is `exec-connect`). |
| **Railway project** | Was a Railway project created for this app? (Yes / No / Not sure) |
| **Railway services** | How many services do you see? (e.g. one for “backend”, one for “Postgres”?) List names. |
| **Backend service status** | Does the backend service show **Running** (green) in Railway? (Yes / No / Crashed / Never deployed) |

### 1.2 Railway public URL (critical for Vercel)

| Question | Your answer |
|----------|-------------|
| **Railway domain** | Do you see a **public URL** for the backend service? (Yes / No) |
| **Where you looked** | In Railway: Project → **backend service** (not the DB) → **Settings** → **Networking** (or **Deployments** → latest deployment). Is there a “Generate domain” or an existing domain like `xxx.up.railway.app`? |
| **URL value** | If yes, what is the full URL? (e.g. `https://exec-connect-backend.up.railway.app`) |

### 1.3 Database

| Question | Your answer |
|----------|-------------|
| **Database instance** | Is there a Postgres service in Railway (or elsewhere)? (Yes / No) |
| **Where** | Same Railway project as backend, or different (e.g. Supabase, Neon)? |
| **DATABASE_URL** | Is `DATABASE_URL` (or `DATABASE_PUBLIC_URL`) set on the **backend** service in Railway? (Yes / No / Not sure) |

### 1.4 Environment variables

| Question | Your answer |
|----------|-------------|
| **Backend env vars in Railway** | List (or paste) the **variable names** you have set on the **backend** service (not the DB). No need to paste secret values. |
| **Frontend env on Vercel** | In Vercel → your project → **Settings** → **Environment Variables**: do you have **`NEXT_PUBLIC_API_URL`**? What value? (e.g. `https://xxx.up.railway.app` or still `http://localhost:8000`?) |

### 1.5 Errors and logs

| Question | Your answer |
|----------|-------------|
| **Backend logs** | In Railway → backend service → **Deployments** → latest → **View logs**. Any crash or repeated errors? (Paste last 20–30 lines if possible.) |
| **Browser / Network** | When the frontend calls the API (e.g. diagnostic or chat), what happens? (CORS error, 404, connection refused, timeout, 5xx?) |
| **AI endpoints** | Which exact action fails? (e.g. “CFO diagnostic”, “CMO chat”, “run diagnostic”?) |

---

## Step 2: Required backend components (what must exist in production)

For the frontend on Vercel to fully function, the following must be in place.

### 2.1 API service (backend)

- **What:** FastAPI app in `backend/` (entry: `app.main:app`), served by **uvicorn**.
- **How it’s run in production:** Railway uses the **Procfile** in `backend/`:
  - **release:** `alembic upgrade head` (runs migrations before each deploy).
  - **web:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Must have:** A **public HTTPS URL** (e.g. `https://<your-backend>.up.railway.app`) so the frontend can call it.

### 2.2 Database service

- **What:** PostgreSQL. Used by FastAPI for agents, diagnostics, CLEAR, auth, etc.
- **Where:** Typically a **Postgres** service in the same Railway project, or external (e.g. Supabase/Neon).
- **Must have:** Backend must receive **`DATABASE_URL`** in `postgresql://...` or `postgresql+psycopg://...` format (the app normalizes to `postgresql+psycopg://`).

### 2.3 Environment variables (backend service)

These must be set on the **Railway backend service** (not on Vercel, not only in local `.env`):

| Variable | Required | Notes |
|----------|----------|--------|
| **DATABASE_URL** | **Yes** | From Railway Postgres: use the variable reference or connection string (e.g. `${{Postgres.DATABASE_URL}}` or copy from DB service). |
| **OPENAI_API_KEY** | **Yes** | Needed for AI generation (diagnostics, chat). Without it, AI endpoints will fail. |
| **LLM_MODEL** | Recommended | e.g. `gpt-4o-mini` or `gpt-4o`. Default in code is `gpt-5.1` if unset. |
| **CORS_ORIGINS** | **Yes** | Must include your Vercel frontend URL, e.g. `https://your-app.vercel.app`. Comma-separated; no trailing slash. |
| **JWT_SECRET_KEY** | **Yes** (if using auth) | Long random secret for production; do not use default. |
| **FRONTEND_URL** | Recommended | Your Vercel app URL (e.g. `https://your-app.vercel.app`) for redirects/emails. |
| **RAG_ENABLED** | Optional | `true` or `false`. Default true. |
| **RAG_TOP_K** | Optional | e.g. `4`. |
| **WISPR_API_KEY** | Optional | For voice input in chats/diagnostics. |
| **ZEPTO_MAIL_*** | Optional | For magic-link / OTP emails. |
| **DEBUG** | Optional | Set to `false` in production. |

### 2.4 Public backend URL

- **What:** A stable, public HTTPS URL for the backend API.
- **Where:** Railway → backend service → **Settings** → **Networking** → “Generate domain” or use an existing one.
- **Frontend:** Vercel must have **`NEXT_PUBLIC_API_URL`** = this URL (no trailing slash), e.g. `https://exec-connect-backend.up.railway.app`.

### 2.5 Migration state

- **What:** Alembic migrations in `backend/alembic/versions/` must be applied to the production DB.
- **How:** Railway Procfile **release** phase runs `alembic upgrade head` before the web process starts. Ensure the backend service is configured to use the Procfile (Railway usually auto-detects it if root or backend is set as root).

### 2.6 Background jobs

- **What:** No separate worker is defined in the repo; long-running work (e.g. diagnostic runs) is handled inside API requests. No extra “background job” service is required for basic AI/diagnostics to work.

---

## Step 3: Missing component identification (fill after Step 1)

*After you complete the tables in Step 1, use this section to list what’s missing or wrong.*

| Category | Finding |
|----------|---------|
| **Backend not running** | If the backend service is not “Running” in Railway, deployments may be failing (build or runtime). Check **Build logs** and **Deploy logs** for the backend service. |
| **No public URL** | If there is no generated domain for the backend service, the frontend cannot call the API. **Fix:** Railway → backend service → Settings → Networking → Generate domain. |
| **Wrong / missing Vercel env** | If `NEXT_PUBLIC_API_URL` is missing or still `http://localhost:8000`, the frontend will try to call your local machine. **Fix:** Set `NEXT_PUBLIC_API_URL` to the Railway backend URL and redeploy the frontend. |
| **CORS** | If `CORS_ORIGINS` on the backend does not include your Vercel origin (e.g. `https://your-app.vercel.app`), the browser will block requests. **Fix:** Add the Vercel URL to `CORS_ORIGINS` (comma-separated). |
| **Database** | If `DATABASE_URL` is not set on the backend service, the app will fail at startup (or first DB use). **Fix:** Set `DATABASE_URL` from the Postgres service (variable reference or copy). |
| **OpenAI** | If `OPENAI_API_KEY` is missing or invalid, AI generation (diagnostics, chat) will fail. **Fix:** Set a valid `OPENAI_API_KEY` on the backend service. |
| **Auth (optional)** | If you use login/signup, set `JWT_SECRET_KEY` and optionally `FRONTEND_URL` and Zepto Mail vars. |

---

## Step 4: Action plan (ordered checklist)

Use this as a concrete, ordered checklist. Tick items as you complete them.

### A. Railway backend service

- [ ] **A1.** Log in to [Railway](https://railway.app) and open the project that should run the backend.
- [ ] **A2.** Confirm there is a **service** for the backend (not only Postgres). If not, create a new service and connect it to this repo; set **Root Directory** to **`backend`** (so Procfile and `app/` are found).
- [ ] **A3.** In that backend service, open **Settings** → **Networking**. If there is no public domain, click **Generate domain**. Copy the full URL (e.g. `https://xxx.up.railway.app`). This is your **backend base URL**.
- [ ] **A4.** Ensure the service is set to use the **Procfile** (Railway usually detects it when root is `backend`). The **web** command must be: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### B. Database

- [ ] **B1.** Ensure a **Postgres** service exists (same project or external). In Railway, create a Postgres service if needed.
- [ ] **B2.** In the **backend** service → **Variables**, add **`DATABASE_URL`**. Best: use Railway’s variable reference to the Postgres service (e.g. `${{Postgres.DATABASE_URL}}` or the name of your DB service). Alternatively copy the connection string from the Postgres service (Private or Public URL, depending on how your backend is deployed). The app accepts `postgresql://` and converts to `postgresql+psycopg://` internally.

### C. Backend environment variables

- [ ] **C1.** In the **backend** service → **Variables**, set at least:
  - **DATABASE_URL** (from B2).
  - **OPENAI_API_KEY** (valid OpenAI key).
  - **CORS_ORIGINS** = `https://<your-vercel-app>.vercel.app` (and any other origins you need; comma-separated, no trailing slash).
  - **JWT_SECRET_KEY** = a long random string (if you use auth).
- [ ] **C2.** Optionally set: **LLM_MODEL** (e.g. `gpt-4o-mini`), **FRONTEND_URL** (your Vercel URL), **DEBUG** = `false`, **RAG_ENABLED**, **WISPR_API_KEY**, **ZEPTO_MAIL_***.
- [ ] **C3.** Save and trigger a **redeploy** of the backend so new variables are applied.

### D. Migrations

- [ ] **D1.** Confirm the Procfile has **release:** `alembic upgrade head`. Railway runs this before starting the web process. If you use a custom start command, ensure migrations run first (e.g. `alembic upgrade head && uvicorn ...`).
- [ ] **D2.** After a successful deploy, check backend **Deploy logs** for “[OK] Database connection successful” and absence of migration errors.

### E. Connect Vercel frontend to backend

- [ ] **E1.** In **Vercel** → your frontend project → **Settings** → **Environment Variables**, add or edit:
  - **Name:** `NEXT_PUBLIC_API_URL`
  - **Value:** your Railway backend URL from A3 (e.g. `https://xxx.up.railway.app`), no trailing slash.
  - Apply to **Production** (and Preview if you want).
- [ ] **E2.** Redeploy the frontend (e.g. trigger a new deployment or push a commit) so the new env is baked in. `NEXT_PUBLIC_*` is read at build time.

### F. Verify and test

- [ ] **F1.** Open the backend URL in a browser: `https://<your-backend-url>/docs`. You should see FastAPI Swagger UI.
- [ ] **F2.** In the browser, open your Vercel app. Open DevTools → Network. Trigger an AI action (e.g. CFO diagnostic or CMO chat). Requests should go to `https://<your-backend-url>/api/...`. Confirm no CORS errors and no “connection refused”.
- [ ] **F3.** If you see 5xx or 4xx, check Railway backend **Deploy logs** and **Build logs** for the exact error (e.g. missing env, DB connection, or import errors like the previous `choose_primary_domain` fix).

### G. If the backend service is crashing

- [ ] **G1.** Open Railway → backend service → **Deployments** → latest deployment → **View logs** (Deploy logs, not only Build).
- [ ] **G2.** Look for Python tracebacks (e.g. `ImportError`, `ModuleNotFoundError`, or DB connection errors). Fix the cause (e.g. add missing env, fix code, ensure `DATABASE_URL` is correct).
- [ ] **G3.** Ensure **Root Directory** is **`backend`** so that `app.main:app` and `alembic` resolve correctly.

---

## Quick reference

| Item | Where | Value / command |
|------|--------|------------------|
| Backend framework | Codebase | FastAPI (`backend/app/main.py`) |
| Backend root | Railway service | **`backend`** |
| Start command | Procfile | `release:` alembic upgrade head; `web:` uvicorn app.main:app --host 0.0.0.0 --port $PORT |
| Frontend API base | Vercel env | **`NEXT_PUBLIC_API_URL`** = Railway backend public URL |
| Backend env (min) | Railway backend service | DATABASE_URL, OPENAI_API_KEY, CORS_ORIGINS, JWT_SECRET_KEY |
| DB | Railway (or external) | Postgres; connect via DATABASE_URL on backend |

Once you have filled in **Step 1** (your answers), you can update **Step 3** with the exact gaps and then work through **Step 4** in order. If you paste your Step 1 answers and any error logs, the next step can be a precise “do this next” list tailored to your current state.
