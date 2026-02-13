"""
Test Zepto Mail send and print the raw API response.
Run from backend dir with venv active:
  python scripts/test_zepto_send.py your@email.com
"""
import asyncio
import sys

import httpx

# Load app config (backend root must be in path)
sys.path.insert(0, ".")
from app.config import settings

ZEPTO_EMAIL_URL = "https://api.zeptomail.com/v1.1/email"


def _zepto_headers():
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


async def main():
    to_email = (sys.argv[1] or "").strip() or "test@example.com"
    print(f"From: {settings.ZEPTO_MAIL_FROM_EMAIL} ({settings.ZEPTO_MAIL_FROM_NAME})")
    print(f"To: {to_email}")
    print(f"API key set: {bool(settings.ZEPTO_MAIL_API_KEY)}")
    print()

    payload = {
        "from": {
            "address": settings.ZEPTO_MAIL_FROM_EMAIL,
            "name": settings.ZEPTO_MAIL_FROM_NAME,
        },
        "to": [{"email_address": {"address": to_email, "name": to_email}}],
        "subject": "CLEAR test email",
        "htmlbody": "<p>If you see this, Zepto send worked.</p>",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(ZEPTO_EMAIL_URL, json=payload, headers=_zepto_headers())

    print(f"Zepto API status: {r.status_code}")
    print(f"Zepto API response: {r.text}")
    if r.is_success:
        print("\n-> Success. Check inbox (and spam) for", to_email)
    else:
        print("\n-> Failed. Fix the error above and ensure the Send Mail token is from Agents > InfoCLEAR > SMTP/API.")


if __name__ == "__main__":
    asyncio.run(main())
