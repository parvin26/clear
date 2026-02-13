"""Telemetry: analytics events and error reporting (launch instrumentation)."""
from typing import Any, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import TelemetryEvent, TelemetryError

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


def get_optional_user_id(request: Request, db: Session = Depends(get_db)) -> Optional[int]:
    """Resolve user_id from Bearer token if present."""
    auth = request.headers.get("authorization") if request else None
    if not auth or not auth.lower().startswith("bearer "):
        return None
    token = auth[7:].strip()
    if not token:
        return None
    try:
        from app.auth.tokens import decode_token
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        return int(payload["sub"])
    except Exception:
        return None


class TelemetryEventBody(BaseModel):
    event_name: str
    properties: Optional[dict[str, Any]] = None


class TelemetryErrorBody(BaseModel):
    message: Optional[str] = None
    stack: Optional[str] = None
    path: Optional[str] = None


@router.post("/events")
def post_telemetry_event(
    body: TelemetryEventBody,
    request: Request,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
    enterprise_id: Optional[int] = None,
):
    """Store an analytics/conversion event. Attach user_id if logged in."""
    row = TelemetryEvent(
        event_name=body.event_name,
        user_id=user_id,
        enterprise_id=enterprise_id,
        properties=body.properties,
    )
    db.add(row)
    db.commit()
    return {"ok": True}


@router.post("/errors")
def post_telemetry_error(
    body: TelemetryErrorBody,
    request: Request,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
    source: str = "frontend",
):
    """Store a frontend (or backend) error. source should be 'frontend' or 'backend'."""
    row = TelemetryError(
        source=source[:20],
        message=(body.message or "")[:10000],
        stack=(body.stack or "")[:50000] if body.stack else None,
        path=(body.path or "")[:500] if body.path else None,
        user_id=user_id,
    )
    db.add(row)
    db.commit()
    return {"ok": True}
