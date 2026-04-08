"""Regression tests for session isolation in diagnostic run workers."""
import pytest

from app.diagnostic import run_service


def test_run_with_isolated_session_closes_worker_session(monkeypatch):
    closed = {"count": 0}

    class _FakeSession:
        def close(self):
            closed["count"] += 1

    monkeypatch.setattr(run_service, "SessionLocal", lambda: _FakeSession())

    observed = {}

    def _runner(payload, db, onboarding_context=None):
        observed["payload"] = payload
        observed["db"] = db
        observed["ctx"] = onboarding_context
        return {"ok": True}

    out = run_service._run_with_isolated_session(
        _runner,
        {"sample": "payload"},
        onboarding_context={"name": "Founder"},
    )

    assert out == {"ok": True}
    assert observed["payload"] == {"sample": "payload"}
    assert observed["ctx"] == {"name": "Founder"}
    assert observed["db"] is not None
    assert closed["count"] == 1


def test_run_with_isolated_session_closes_on_exception(monkeypatch):
    closed = {"count": 0}

    class _FakeSession:
        def close(self):
            closed["count"] += 1

    monkeypatch.setattr(run_service, "SessionLocal", lambda: _FakeSession())

    def _runner(_payload, _db, onboarding_context=None):  # noqa: ARG001
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError, match="boom"):
        run_service._run_with_isolated_session(_runner, {"x": 1})

    assert closed["count"] == 1
