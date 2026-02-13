"""Simple IP-based rate limit middleware for public endpoints. In-memory; single instance only."""
import time
from collections import defaultdict
from typing import Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

# (path_prefix, limit per minute)
RULES: list[Tuple[str, int]] = [
    ("/api/auth", 10),
    ("/api/telemetry", 60),
    ("/api/clear/diagnostic", 30),
]

# key: (ip, path_prefix) -> list of request timestamps (last 60 seconds)
_store: dict[Tuple[str, str], list[float]] = defaultdict(list)
_WINDOW = 60.0  # seconds


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _match_rule(path: str) -> Tuple[str, int] | None:
    for prefix, limit in RULES:
        if path.startswith(prefix):
            return (prefix, limit)
    return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path or ""
        rule = _match_rule(path)
        if not rule:
            return await call_next(request)

        prefix, limit = rule
        ip = _get_client_ip(request)
        key = (ip, prefix)
        now = time.monotonic()

        # Prune old entries (older than WINDOW)
        timestamps = _store[key]
        while timestamps and now - timestamps[0] > _WINDOW:
            timestamps.pop(0)

        if len(timestamps) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Try again later."},
                headers={"Retry-After": "60"},
            )
        timestamps.append(now)
        return await call_next(request)
