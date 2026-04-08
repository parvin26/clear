"""Reusable auth and role dependencies for API routes."""
from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth import service
from app.auth.tokens import decode_token
from app.db.database import get_db
from app.db.models import EnterpriseMember, User

optional_bearer = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Return current user from Bearer token or None when token is absent/invalid."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None
    return service.get_user_by_id(db, user_id)


def get_current_user_required(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    """Require a valid authenticated user."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user


INSTITUTIONAL_ROLES = ("capital_partner", "advisor", "founder")


def require_institutional_user(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
) -> User:
    """
    Require an authenticated user with at least one institutional-style member role.

    This is intentionally lightweight until portfolio-scoped authorization is added.
    """
    email = (user.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=403, detail="Institutional access requires a verified email.")
    membership = (
        db.query(EnterpriseMember)
        .filter(
            EnterpriseMember.email == email,
            EnterpriseMember.role.in_(INSTITUTIONAL_ROLES),
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Institutional access is not enabled for this account.")
    return user
