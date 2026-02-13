# CLEAR Auth (OTP sign-up, password + magic link sign-in)

## Environment variables

Add to `backend/.env`:

```env
# Auth
JWT_SECRET_KEY=your-long-random-secret-at-least-32-chars
FRONTEND_URL=http://localhost:3003

# Zepto Mail (for OTP and magic link emails)
ZEPTO_MAIL_API_KEY=your-zeptomail-send-token
ZEPTO_MAIL_FROM_EMAIL=noreply@yourdomain.com
ZEPTO_MAIL_FROM_NAME=CLEAR
# Optional: Zepto template for magic-link email. Template must have merge variable "magic_link".
ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY=your-template-key-from-zeptomail-agent
```

- **JWT_SECRET_KEY:** Use a long random string in production (e.g. `openssl rand -hex 32`).
- **FRONTEND_URL:** Base URL of the frontend; used for magic link URLs.
- **ZEPTO_MAIL_*:** From your Zepto Mail agent (send mail token, from address, from name). If `ZEPTO_MAIL_API_KEY` is empty, no email is sent; the verification code is **printed in the backend terminal** so you can complete signup locally (look for `[CLEAR dev] Verification code for your@email.com: XXXXXX`).
- **ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY:** Optional. If set, magic-link emails are sent via Zepto’s template API with `merge_info.magic_link` set to the sign-in URL. If unset or template send fails, the built-in HTML magic-link email is used.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/send-signup-otp` | Send OTP to email (body: `{ "email": "..." }`) |
| POST | `/api/auth/verify-signup-otp` | Verify OTP (body: `{ "email", "otp" }`) |
| POST | `/api/auth/register` | Register with email + OTP + password (body: `{ "email", "otp", "password", "name?" }`) |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/send-magic-link` | Send magic link to email |
| GET | `/api/auth/verify-magic-link?token=...&email=...` | Verify magic link and return tokens |
| GET | `/api/auth/me` | Current user (Header: `Authorization: Bearer <access_token>`) |

## Flows

1. **Sign up:** Send OTP → user enters OTP + password (and optional name) → POST register → receive `access_token` and `refresh_token`.
2. **Sign in (password):** POST login with email + password → receive tokens.
3. **Sign in (magic link):** POST send-magic-link → user clicks link in email → frontend opens `/auth/verify?token=...&email=...` → frontend calls verify-magic-link → store token and redirect.

Tokens are JWTs. Frontend stores `access_token` in localStorage and sends it as `Authorization: Bearer <token>` on API requests.
