# Running Alembic Migrations on Windows (PowerShell)

Cursor hit the following when running migrations:

- `&&` is not a valid statement separator in PowerShell (use `;` instead).
- `python -m alembic upgrade head` failed because Alembic wasn’t installed or executable in that environment.
- **"No 'script_location' key found"** — you ran Alembic from the **project root**; the config file is in `backend/alembic.ini`, so run from `backend` or use the runner script below.
- **`KeyError: 'DATABASE_URL'`** — the app reads `DATABASE_URL` from `backend/.env`. When you run a one-liner like `python -c "import os; ... os.environ['DATABASE_URL']"` without starting from the app, `.env` is not loaded. Use the runner script (it loads `.env`) or run Alembic from `backend` after ensuring `.env` is there.

Use the steps below so migrations run reliably on Windows with PowerShell.

---

## Quick: run migrations (no activation needed)

Use the **backend Python** that has your dependencies (either `exec` or `.venv`). You do **not** need to run `Activate.ps1`.

**If your venv is `backend\exec`** (this repo has `exec\bin\`, not `.venv\Scripts\`):

```powershell
cd C:\Users\parvi\clear\exec-connect\exec-connect\backend
.\exec\bin\python.exe run_alembic.py upgrade head
```

**If you created a `.venv` in backend:**

```powershell
cd C:\Users\parvi\clear\exec-connect\exec-connect\backend
.\.venv\Scripts\python.exe run_alembic.py upgrade head
```

From **project root** (same idea — point at backend’s Python and script):

```powershell
cd C:\Users\parvi\clear\exec-connect\exec-connect
.\backend\exec\bin\python.exe .\backend\run_alembic.py upgrade head
```

`run_alembic.py` loads `backend/.env` (so `DATABASE_URL` is set) and runs Alembic from the backend directory (so `alembic.ini` and `script_location` are found).

---

## Check DB connection and Alembic version (no activation)

From **backend**, with any Python that has `python-dotenv` and `sqlalchemy`:

```powershell
cd C:\Users\parvi\clear\exec-connect\exec-connect\backend
.\exec\bin\python.exe check_db.py
```

Or with `.venv`: `.\.venv\Scripts\python.exe check_db.py`

`check_db.py` loads `backend/.env` and prints the current `alembic_version`. If you see `ERROR: DATABASE_URL not set`, add `DATABASE_URL=...` to `backend\.env`.

---

## 1. Use the project virtualenv

From the repo root:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

If you don’t have a venv yet:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2. Install Alembic

```powershell
python -m pip install alembic
```

Confirm the environment:

```powershell
where python
where pip
```

Both should point under `backend\.venv\`.

## 3. Run migrations

**Preferred (if `alembic` is on PATH after activation):**

```powershell
alembic upgrade head
```

**If `alembic` isn’t found, use the Python entry point:**

```powershell
python -m alembic upgrade head
```

**If that still fails (e.g. no `alembic.__main__`), use this fallback:**

```powershell
python -c "from alembic.config import main; main(argv=['upgrade','head'])"
```

## 4. Run from backend directory

Alembic must run with `backend` as the current working directory (where `alembic.ini` and `alembic/` live). So either:

- `cd backend` then run one of the commands above, or  
- From repo root:  
  `cd backend; python -c "from alembic.config import main; main(argv=['upgrade','head'])"`

## 5. CLEAR compliance migration (c3d4e5f6a7b8)

After the initial CLEAR tables (b2c3d4e5f6a7), run the compliance patch so you have:

- `decision_artifacts`
- `source_ref` on evidence links
- `version_id` on ledger events
- Immutability triggers on ledger and artifacts

Same commands as above; `upgrade head` will run all pending migrations, including the compliance one.

## Check current migration or DB connection

If you need to run ad‑hoc Python that uses `DATABASE_URL`, load `.env` first. From **backend**:

```powershell
cd C:\Users\parvi\clear\exec-connect\exec-connect\backend
.\.venv\Scripts\Activate.ps1
python -c "from dotenv import load_dotenv; load_dotenv(); import os; from sqlalchemy import create_engine, text; e=create_engine(os.environ['DATABASE_URL']); c=e.connect(); print('alembic_version=', c.execute(text('select version_num from alembic_version')).fetchall())"
```

Or use the same venv and run a small script that does `load_dotenv()` then uses `os.environ['DATABASE_URL']`.

## Revert (only if needed)

If you need to undo CLEAR migrations in order:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
alembic downgrade -1
```

Repeat to step back through revisions. To remove all CLEAR governance tables and go back to the state before CLEAR:

- Downgrade to the revision before the first CLEAR migration (e.g. `a1b2c3d4e5f6`), or  
- Follow the revert plan in your governance doc (drop triggers, drop CLEAR tables, drop enums, unregister CLEAR router), then re-apply in the correct order if you reintroduce CLEAR later.
