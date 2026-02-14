"""Zepto Mail API client for sending OTP and magic-link emails."""
import logging
from typing import Optional, Tuple

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ZEPTO_EMAIL_URL = "https://api.zeptomail.com/v1.1/email"
ZEPTO_TEMPLATE_URL = "https://api.zeptomail.com/v1.1/email/template"


def _zepto_headers() -> dict:
    key = (settings.ZEPTO_MAIL_API_KEY or "").strip()
    if key.lower().startswith("zoho-enczapikey "):
        auth = key
    else:
        auth = f"Zoho-enczapikey {key}" if key else ""
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": auth,
    }


async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    *,
    to_name: Optional[str] = None,
    text_body: Optional[str] = None,
) -> Tuple[bool, Optional[str]]:
    """
    Send a single transactional email via Zepto Mail.
    Returns (True, None) if sent successfully, (False, error_message) otherwise.
    """
    if not settings.ZEPTO_MAIL_API_KEY:
        logger.warning("ZEPTO_MAIL_API_KEY not set; skipping send_email to %s", to_email)
        return False, "Email not configured (no API key)."
    payload = {
        "from": {
            "address": settings.ZEPTO_MAIL_FROM_EMAIL,
            "name": settings.ZEPTO_MAIL_FROM_NAME,
        },
        "to": [{"email_address": {"address": to_email, "name": to_name or to_email}}],
        "subject": subject,
        "htmlbody": html_body,
    }
    if text_body:
        payload["textbody"] = text_body
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(ZEPTO_EMAIL_URL, json=payload, headers=_zepto_headers())
            if r.is_success:
                logger.info("Zepto email sent to %s", to_email)
                print(f"[CLEAR] Verification email sent to {to_email}")
                return True, None
            err_msg = f"Zepto API {r.status_code}: {r.text[:200] if r.text else 'no body'}"
            logger.warning("Zepto Mail API error: %s", err_msg)
            print(f"[CLEAR] Zepto send failed: {err_msg}")
            return False, err_msg
    except Exception as e:
        logger.exception("Zepto Mail send failed: %s", e)
        err_msg = str(e)
        print(f"[CLEAR] Zepto send error: {err_msg}")
        return False, err_msg


async def send_otp_email(to_email: str, otp: str) -> Tuple[bool, Optional[str]]:
    """Send OTP verification email via Zepto. If no API key, log OTP for local dev."""
    if not settings.ZEPTO_MAIL_API_KEY:
        logger.warning(
            "ZEPTO_MAIL_API_KEY not set; no email sent. [DEV] OTP for %s: %s (check backend console to complete signup)",
            to_email,
            otp,
        )
        print(f"[CLEAR dev] Verification code for {to_email}: {otp}")
        return False, None
    subject = "Your CLEAR verification code"
    html = f"""
    <div style="font-family: sans-serif; max-width: 400px;">
      <p>Your verification code is: <strong>{otp}</strong></p>
      <p>It expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      <p>- CLEAR</p>
    </div>
    """
    ok, err = await send_email(to_email, subject, html)
    if ok:
        print(f"[CLEAR] If the email didn't arrive (e.g. spam), use this code: {otp}")
    return ok, err


def _success_only(sent: Tuple[bool, Optional[str]]) -> bool:
    """Return True only if send_email succeeded (for callers that expect bool)."""
    return sent[0]


async def send_magic_link_email_via_template(to_email: str, magic_link_url: str, to_name: Optional[str] = None) -> bool:
    """Send magic link email using a Zepto Mail template. Requires ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY."""
    if not settings.ZEPTO_MAIL_API_KEY:
        logger.warning("ZEPTO_MAIL_API_KEY not set; skipping template send to %s", to_email)
        return False
    template_key = (settings.ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY or "").strip()
    if not template_key:
        return False
    payload = {
        "template_key": template_key,
        "from": {
            "address": settings.ZEPTO_MAIL_FROM_EMAIL,
            "name": settings.ZEPTO_MAIL_FROM_NAME,
        },
        "to": [{"email_address": {"address": to_email, "name": to_name or to_email}}],
        "merge_info": {"magic_link": magic_link_url},
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(ZEPTO_TEMPLATE_URL, json=payload, headers=_zepto_headers())
            if r.is_success:
                return True
            logger.warning("Zepto Mail template API error: %s %s", r.status_code, r.text)
            return False
    except Exception as e:
        logger.exception("Zepto Mail template send failed: %s", e)
        return False


async def send_magic_link_email(to_email: str, magic_link_url: str) -> bool:
    """Send magic link email (async). Uses template if ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY is set, else HTML body."""
    if settings.ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY:
        ok = await send_magic_link_email_via_template(to_email, magic_link_url)
        if ok:
            return True
        logger.warning("Template send failed; falling back to HTML magic link email")
    subject = "Sign in to CLEAR"
    html = f"""
    <div style="font-family: sans-serif; max-width: 400px;">
      <p>Click the link below to sign in to your CLEAR account:</p>
      <p><a href="{magic_link_url}" style="display: inline-block; padding: 10px 20px; background: #1D4ED8; color: white; text-decoration: none; border-radius: 8px;">Sign in to CLEAR</a></p>
      <p>This link expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
      <p>- CLEAR</p>
    </div>
    """
    return _success_only(await send_email(to_email, subject, html))


# ----- Activation reminders (Day 2, 4, 7, 10, 12 nudges) -----

NUDGE_MESSAGES = {
    2: "Run your first diagnostic",
    4: "Finalize your first decision",
    7: "Assign milestones to begin execution",
    10: "Update progress on at least one milestone",
    12: "Schedule your first review",
}


async def send_activation_reminder_email(
    to_email: str,
    enterprise_name: str,
    nudge_day: int,
    message: str,
) -> Tuple[bool, Optional[str]]:
    """Send a single activation nudge email. Used by the daily activation-reminders job."""
    subject = f"CLEAR reminder (Day {nudge_day}): {message}"
    display_name = enterprise_name or "Your workspace"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px;">
      <p>Hi,</p>
      <p><strong>{display_name}</strong> started on CLEAR {nudge_day} day(s) ago. Here's your next step:</p>
      <p style="font-size: 1.1em; color: #1D4ED8;"><strong>{message}</strong></p>
      <p><a href="{settings.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background: #1D4ED8; color: white; text-decoration: none; border-radius: 8px;">Open CLEAR Dashboard</a></p>
      <p>- CLEAR</p>
    </div>
    """
    return await send_email(to_email, subject, html)
