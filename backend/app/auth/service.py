"""Auth service: sign-up OTP, register, login, magic link."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.auth.otp import generate_otp, create_pending_verification, verify_and_consume_otp, PURPOSE_SIGNUP_OTP
from app.auth.tokens import (
    create_access_token,
    create_refresh_token,
    create_magic_link_token,
    verify_magic_link_token,
    decode_token,
)
from app.auth.password_utils import hash_password, verify_password
from app.auth.zepto_client import send_otp_email, send_magic_link_email
from app.config import settings
from app.db.models import User


async def send_signup_otp(db: Session, email: str) -> tuple[bool, str | None]:
    """Generate OTP, store it, send email. Returns (True, None) if sent, (False, error_message) otherwise."""
    email = email.lower().strip()
    otp = generate_otp()
    create_pending_verification(db, email, otp, PURPOSE_SIGNUP_OTP)
    return await send_otp_email(email, otp)


def verify_signup_otp(db: Session, email: str, otp: str) -> bool:
    """Verify OTP for sign-up and consume it."""
    return verify_and_consume_otp(db, email, otp, PURPOSE_SIGNUP_OTP)


def _create_user(db: Session, email: str, password: str, name: str | None = None) -> User | None:
    """Create user with hashed password and email_verified_at set."""
    email = email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return None
    user = User(
        email=email,
        name=name or None,
        password_hash=hash_password(password),
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_with_otp(
    db: Session, email: str, otp: str, password: str, name: str | None = None
) -> tuple[User | None, str | None]:
    """
    Verify OTP and register in one step.
    Returns (user, None) on success, (None, "invalid_otp") for wrong/expired code, (None, "already_registered") if email exists.
    """
    if not verify_and_consume_otp(db, email, otp, PURPOSE_SIGNUP_OTP):
        return None, "invalid_otp"
    user = _create_user(db, email, password, name)
    if not user:
        return None, "already_registered"
    return user, None


def login(db: Session, email: str, password: str) -> User | None:
    """Validate email+password and return user."""
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def user_to_response(user: User) -> dict:
    """Build user dict for token response."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
    }


def tokens_for_user(user: User) -> dict:
    """Return access_token, refresh_token, user for API response."""
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
        "user": user_to_response(user),
    }


async def send_magic_link(db: Session, email: str) -> bool:
    """
    Create magic link token, store it, send email. Returns True if email sent.
    We send the link even if user does not exist (no email enumeration).
    """
    email = email.lower().strip()
    raw_token = create_magic_link_token(db, email)
    base = settings.FRONTEND_URL.rstrip("/")
    link_url = f"{base}/auth/verify?token={raw_token}&email={email}"
    return await send_magic_link_email(email, link_url)


def verify_magic_link_and_get_user(db: Session, email: str, token: str) -> User | None:
    """Verify magic link token and return user if they exist. Consumes token."""
    if not verify_magic_link_token(db, email, token):
        return None
    email = email.lower().strip()
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
