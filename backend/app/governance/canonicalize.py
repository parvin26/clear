"""
Canonicalization for CLEAR governance (RFC 8785 JCS-style).
Used for: decision_artifacts canonical_json hashing, ledger payload hashing.

Contract (enforcement rules):
- Lexicographic key sort: json.dumps(sort_keys=True, ...)
- UTF-8: .encode("utf-8") for hash input
- Forbid NaN/Infinity: _is_bad_float raises; json.dumps(allow_nan=False)
- Timestamps: normalized to ISO8601 Z in _normalize_value (datetime and isoformat())
- Recursive normalization of nested dict/list; same key order => same string => same hash
- Deterministic: same logical artifact (after normalization) => same canonical string => same SHA-256 hash
"""
import hashlib
import json
import re
from datetime import datetime
from typing import Any

# Float values that are not allowed in canonical form
def _is_bad_float(v: Any) -> bool:
    if not isinstance(v, (int, float)):
        return False
    try:
        f = float(v)
        return not (f == f and abs(f) != float("inf"))  # NaN or Inf
    except (TypeError, ValueError):
        return False


def _normalize_value(val: Any) -> Any:
    """Normalize for canonical form: timestamps to ISO8601 Z, forbid NaN/Infinity."""
    if val is None or isinstance(val, bool) or isinstance(val, int):
        return val
    if isinstance(val, float):
        if _is_bad_float(val):
            raise ValueError("Canonical JSON forbids NaN/Infinity")
        return val
    if isinstance(val, str):
        return val
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%dT%H:%M:%S.000Z") if val.tzinfo else val.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    if isinstance(val, list):
        return [_normalize_value(x) for x in val]
    if isinstance(val, dict):
        return {k: _normalize_value(v) for k, v in val.items()}
    if hasattr(val, "isoformat"):
        try:
            s = val.isoformat()
            if "T" in s and not s.endswith("Z"):
                s = s.replace("+00:00", "Z").replace("-00:00", "Z")
            return s
        except Exception:
            pass
    raise ValueError(f"Cannot canonicalize type: {type(val)}")


def canonicalize(obj: dict[str, Any]) -> str:
    """
    Produce canonical JSON string (JCS-style):
    - Lexicographic key sort
    - UTF-8
    - Forbid NaN/Infinity (raise if present)
    - Timestamps normalized to ISO8601 Z
    - Recursive normalization of nested values
    """
    normalized = _normalize_value(obj)
    if not isinstance(normalized, dict):
        raise ValueError("Root must be dict")
    return json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )


def compute_canonical_hash(obj: dict[str, Any]) -> str:
    """SHA-256 of canonical JSON (UTF-8 bytes). Stored at write time."""
    return hashlib.sha256(canonicalize(obj).encode("utf-8")).hexdigest()


def canonicalize_and_hash(obj: dict[str, Any]) -> tuple[str, str, dict]:
    """Return (canonical_json_string, hash_hex, dict_for_storage). Use for insert-only artifact write."""
    canonical_str = canonicalize(obj)
    h = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
    return canonical_str, h, json.loads(canonical_str)
