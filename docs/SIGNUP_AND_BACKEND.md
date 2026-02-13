# Signup and Backend

## Why "Not Found" on signup?

The signup page calls `POST /api/auth/send-signup-otp`. If you see **"Not Found"**, the request is not reaching a running backend that has the auth routes registered. Common causes:

1. **Backend not running** – start it (see below).
2. **Backend failed during startup** – e.g. Unicode in logs on Windows, or missing deps. Use the fixes and run script below.
3. **Wrong API URL** – frontend must call the backend. In `frontend/.env.local` set:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   Then restart the Next.js dev server.

## Run the backend

1. **Stop any existing backend** on port 8000 (Ctrl+C in the terminal where uvicorn is running).

2. **Start the backend** from the project root:
   ```powershell
   .\backend\run.ps1
   ```
   Or from the `backend` folder:
   ```powershell
   cd backend
   .\run.ps1
   ```
   This uses the venv Python so all dependencies (including `email-validator`, `python-multipart`, `passlib`, `PyJWT`) are found.

3. Wait until you see `[OK] Database migrations completed` and no errors. Then the API is ready.

4. **Quick test**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8000/api/auth/send-signup-otp" -Method POST -ContentType "application/json" -Body '{"email":"you@example.com"}'
   ```
   You should get something like `expires_in_minutes` (or a 503 if email sending failed; that still means the route works).

## Not receiving the verification email?

Emails are sent via **Zepto Mail**. If `ZEPTO_MAIL_API_KEY` is not set in `backend/.env`, no email is sent—but the app still returns success, so the UI shows "Code sent."

- **Local dev:** The verification code is printed in the **backend terminal**. Look for a line like:  
  `[CLEAR dev] Verification code for your@email.com: 123456`  
  Use that code in the signup form to create your account.

- **Real email:** Add Zepto Mail credentials to `backend/.env` (see `backend/docs/AUTH_SETUP.md`). Then restart the backend and try again.

## Dependencies

The backend needs (all in `requirements.txt`):

- `python-multipart` – for file upload routes
- `email-validator` – for Pydantic `EmailStr` in auth
- `passlib[bcrypt]` – password hashing
- `PyJWT` – JWT tokens

Install everything:

```powershell
cd backend
.\venv\Scripts\pip install -r requirements.txt
```

## Optional: run with reload

If you want `--reload` for development, run from a terminal where the venv is **activated** so the reloader subprocess uses the same environment:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
