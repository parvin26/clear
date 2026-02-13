"""JWT access/refresh and magic-link token creation and verification."""
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import PendingVerification, User
from app.auth.otp import hash_token

PURPOSE_MAGIC_LINK = "magic_link"


def create_access_token(subject: str | int, extra: dict[str, Any] | None = None) -> str:
    """Create JWT access token (short-lived)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(subject: str | int) -> str:
    """Create JWT refresh token (longer-lived)."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT; return payload or None."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.InvalidTokenError:
        return None


def create_magic_link_token(db: Session, email: str) -> str:
    """
    Create a one-time magic link token (random string), store its hash in pending_verifications, return raw token.
    """
    raw = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)
    token_hash = hash_token(raw)
    # Remove existing magic_link for this email
    db.query(PendingVerification).filter(
        PendingVerification.email == email,
        PendingVerification.purpose == PURPOSE_MAGIC_LINK,
    ).delete()
    pv = PendingVerification(
        email=email.lower().strip(),
        token_hash=token_hash,
        purpose=PURPOSE_MAGIC_LINK,
        expires_at=expires_at,
    )
    db.add(pv)
    db.commit()
    return raw


def verify_magic_link_token(db: Session, email: str, token: str) -> bool:
    """Verify magic link token and consume it (single-use). Returns True if valid."""
    email = email.lower().strip()
    now = datetime.now(timezone.utc)
    token_hash = hash_token(token)
    row = (
        db.query(PendingVerification)
        .filter(
            PendingVerification.email == email,
            PendingVerification.purpose == PURPOSE_MAGIC_LINK,
            PendingVerification.token_hash == token_hash,
            PendingVerification.expires_at > now,
        )
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
