"""Enterprise members and magic-link token resolution."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Decision, Enterprise, EnterpriseMember


TOKEN_EXPIRY_DAYS = 30
ROLES = frozenset({"founder", "advisor", "capital_partner"})


def invite_member(
    db: Session,
    enterprise_id: int,
    email: str,
    role: str,
    base_url: str = "http://localhost:3000",
) -> dict[str, Any]:
    """
    Add or update enterprise_members row; set invite_token and expiry.
    Returns { invite_url, email, role, expires_at }.
    """
    email = email.strip().lower()
    if role not in ROLES:
        role = "advisor"
    existing = (
        db.query(EnterpriseMember)
        .filter(EnterpriseMember.enterprise_id == enterprise_id, EnterpriseMember.email == email)
        .first()
    )
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    if existing:
        existing.role = role
        existing.invite_token = token
        existing.invite_token_expires_at = expires
        db.commit()
        db.refresh(existing)
        m = existing
    else:
        m = EnterpriseMember(
            enterprise_id=enterprise_id,
            email=email,
            role=role,
            invite_token=token,
            invite_token_expires_at=expires,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
    # Invite URL: open any decision of this enterprise with token so we can resolve role
    invite_url = f"{base_url.rstrip('/')}/decisions?token={token}&email={email}"
    return {
        "invite_url": invite_url,
        "email": m.email,
        "role": m.role,
        "expires_at": m.invite_token_expires_at.isoformat() if m.invite_token_expires_at else None,
    }


def resolve_role_by_token(db: Session, token: str) -> dict[str, Any] | None:
    """
    If token is valid (matches a member, not expired), return { email, role, enterprise_id }.
    Else return None.
    """
    if not token or len(token) < 16:
        return None
    m = db.query(EnterpriseMember).filter(EnterpriseMember.invite_token == token).first()
    if not m or not m.invite_token_expires_at or m.invite_token_expires_at < datetime.now(timezone.utc):
        return None
    return {"email": m.email, "role": m.role, "enterprise_id": m.enterprise_id}


def get_member_role_for_decision(db: Session, decision_id: UUID, token: str | None) -> dict[str, Any] | None:
    """
    Get viewing role for this decision: if token provided and valid and member's enterprise
    owns this decision, return { role, email }. Else return None (UI treats as guest/founder).
    """
    if not token:
        return None
    resolved = resolve_role_by_token(db, token)
    if not resolved:
        return None
    d = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not d or d.enterprise_id != resolved["enterprise_id"]:
        return None
    return {"role": resolved["role"], "email": resolved["email"]}


def list_members(db: Session, enterprise_id: int) -> list[EnterpriseMember]:
    """List all members for an enterprise (no token in response)."""
    return (
        db.query(EnterpriseMember)
        .filter(EnterpriseMember.enterprise_id == enterprise_id)
        .order_by(EnterpriseMember.created_at.asc())
        .all()
    )
