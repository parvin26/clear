"""Security regression tests for auth dependencies on sensitive routes."""
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user_required, require_institutional_user
from app.db.database import get_db
from app.db.models import EnterpriseMember
from app.institutional import routes as institutional_routes
from app.routes import clear_routes


class _FakeQuery:
    def __init__(self, first_result=None):
        self._first_result = first_result

    def filter(self, *args, **kwargs):  # noqa: ANN002, ANN003
        return self

    def first(self):
        return self._first_result


class _FakeDb:
    def __init__(self, membership=None):
        self._membership = membership

    def query(self, model):
        if model is EnterpriseMember:
            return _FakeQuery(first_result=self._membership)
        return _FakeQuery(first_result=None)


def test_clear_sensitive_route_requires_auth():
    app = FastAPI()
    app.include_router(clear_routes.router)

    def _override_db():
        yield object()

    app.dependency_overrides[get_db] = _override_db
    client = TestClient(app)

    response = client.get("/api/clear/decisions")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated."


def test_institutional_router_denies_without_membership():
    app = FastAPI()
    app.include_router(institutional_routes.router)

    def _override_user():
        return SimpleNamespace(email="analyst@example.com")

    def _override_db():
        yield _FakeDb(membership=None)

    app.dependency_overrides[get_current_user_required] = _override_user
    app.dependency_overrides[get_db] = _override_db
    client = TestClient(app)

    response = client.get("/api/institutional/portfolios")
    assert response.status_code == 403
    assert "Institutional access" in response.json()["detail"]


def test_require_institutional_user_accepts_member():
    user = SimpleNamespace(email="advisor@example.com")
    membership = SimpleNamespace(role="advisor", email="advisor@example.com")
    db = _FakeDb(membership=membership)

    resolved = require_institutional_user(user=user, db=db)
    assert resolved is user


def test_require_institutional_user_rejects_missing_email():
    user = SimpleNamespace(email=None)
    db = _FakeDb(membership=None)

    with pytest.raises(HTTPException) as exc:
        require_institutional_user(user=user, db=db)

    assert exc.value.status_code == 403
