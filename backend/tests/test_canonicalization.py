"""
Canonicalization proof: same artifact => same hash (deterministic).
Run from backend: python -m pytest tests/test_canonicalization.py -v
Or: python tests/test_canonicalization.py (if run as script, runs assertions and prints OK).
Loads only canonicalize.py to avoid DB/psycopg dependency when proving hash determinism.
"""
import importlib.util
import sys
from pathlib import Path

backend = Path(__file__).resolve().parent.parent
canonicalize_path = backend / "app" / "governance" / "canonicalize.py"
spec = importlib.util.spec_from_file_location("canonicalize", canonicalize_path)
mod = importlib.util.module_from_spec(spec)
sys.modules["canonicalize"] = mod
spec.loader.exec_module(mod)
canonicalize = mod.canonicalize
compute_canonical_hash = mod.compute_canonical_hash
canonicalize_and_hash = mod.canonicalize_and_hash


def test_same_artifact_same_hash():
    """Same logical artifact (different key order, same values) must produce the same hash."""
    artifact1 = {
        "problem_statement": "Need capital.",
        "decision_context": {"domain": "cfo"},
        "constraints": [{"id": "c1", "type": "reg", "description": "Must comply."}],
        "options_considered": [
            {"id": "o1", "title": "Bank", "summary": "Line."},
            {"id": "o2", "title": "Equity", "summary": "Round."},
        ],
        "chosen_option_id": "o1",
        "rationale": "Bank chosen.",
        "risk_level": "yellow",
    }
    # Same content, different key order
    artifact2 = {
        "risk_level": "yellow",
        "rationale": "Bank chosen.",
        "chosen_option_id": "o1",
        "options_considered": [
            {"id": "o1", "title": "Bank", "summary": "Line."},
            {"id": "o2", "title": "Equity", "summary": "Round."},
        ],
        "constraints": [{"id": "c1", "type": "reg", "description": "Must comply."}],
        "decision_context": {"domain": "cfo"},
        "problem_statement": "Need capital.",
    }
    h1 = compute_canonical_hash(artifact1)
    h2 = compute_canonical_hash(artifact2)
    assert h1 == h2, f"Hash mismatch: {h1} vs {h2}"
    c1, _h1, d1 = canonicalize_and_hash(artifact1)
    c2, _h2, d2 = canonicalize_and_hash(artifact2)
    assert c1 == c2
    assert _h1 == _h2 == h1


def test_canonical_string_is_deterministic():
    """Canonical string is identical for same artifact across calls."""
    artifact = {"a": 1, "b": 2, "c": "text"}
    s1 = canonicalize(artifact)
    s2 = canonicalize(artifact)
    assert s1 == s2
    # Key order in input should not matter
    s3 = canonicalize({"c": "text", "a": 1, "b": 2})
    assert s1 == s3


def test_forbid_nan_infinity():
    """Canonical form must reject NaN/Infinity."""
    import math
    try:
        compute_canonical_hash({"x": float("nan")})
        assert False, "Expected ValueError for NaN"
    except ValueError as e:
        assert "NaN" in str(e) or "nan" in str(e).lower()
    try:
        compute_canonical_hash({"x": float("inf")})
        assert False, "Expected ValueError for Inf"
    except ValueError:
        pass


if __name__ == "__main__":
    test_same_artifact_same_hash()
    test_canonical_string_is_deterministic()
    test_forbid_nan_infinity()
    print("Canonicalization proof: all assertions passed.")
