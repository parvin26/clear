"""OTP generation, hashing, and verification storage."""
import hashlib
import secrets
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import PendingVerification


OTP_LENGTH = 6
PURPOSE_SIGNUP_OTP = "signup_otp"


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    n = 10 ** OTP_LENGTH
    return f"{secrets.randbelow(n):0{OTP_LENGTH}d}"


def hash_token(value: str) -> str:
    """SHA-256 hash of token/OTP for storage."""
    return hashlib.sha256(value.encode()).hexdigest()


def create_pending_verification(
    db: Session,
    email: str,
    token_value: str,
    purpose: str,
    expire_minutes: int | None = None,
) -> PendingVerification:
    """Store hashed token with expiry. Replaces any existing pending for same email+purpose."""
    expire_minutes = expire_minutes or settings.OTP_EXPIRE_MINUTES
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    token_hash = hash_token(token_value)
    # Remove any existing for this email + purpose
    db.query(PendingVerification).filter(
        PendingVerification.email == email,
        PendingVerification.purpose == purpose,
    ).delete()
    pv = PendingVerification(
        email=email.lower().strip(),
        token_hash=token_hash,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(pv)
    db.commit()
    db.refresh(pv)
    return pv


def verify_and_consume_otp(db: Session, email: str, otp: str, purpose: str) -> bool:
    """
    Verify OTP and delete the pending record (single-use).
    Returns True if valid and consumed.
    """
    email = email.lower().strip()
    now = datetime.now(timezone.utc)
    token_hash = hash_token(otp)
    row = (
        db.query(PendingVerification)
        .filter(
            PendingVerification.email == email,
            PendingVerification.purpose == purpose,
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
