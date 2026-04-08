"""
Concurrent smoke test for CLEAR multi-agent diagnostic runs.

Purpose:
- Exercise /api/clear/diagnostic/run under concurrent load
- Validate there are no immediate deadlocks/session-cross-thread failures

Usage (backend must be running):
  python3 backend/scripts/run_concurrent_diagnostic_smoke.py

Optional environment variables:
  CLEAR_API_URL=http://localhost:8000
  DIAGNOSTIC_CONCURRENCY=4
  DIAGNOSTIC_REQUESTS=8
  DIAGNOSTIC_TIMEOUT_SEC=120
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

API_BASE = os.environ.get("CLEAR_API_URL", "http://localhost:8000").rstrip("/")
CONCURRENCY = max(1, int(os.environ.get("DIAGNOSTIC_CONCURRENCY", "4")))
REQUESTS = max(1, int(os.environ.get("DIAGNOSTIC_REQUESTS", "8")))
TIMEOUT = max(10, int(os.environ.get("DIAGNOSTIC_TIMEOUT_SEC", "120")))


def _payload(i: int) -> dict[str, Any]:
    return {
        "onboarding_context": {
            "name": f"Smoke User {i}",
            "country": "Malaysia",
            "industry": "Services",
            "company_size": "2-10",
            "email": f"smoke{i}@example.com",
        },
        "diagnostic_data": {
            "businessStage": "Early but operating",
            "situationDescription": "Cash flow and operations are unstable while demand is growing.",
            "situationClarifiers": ["Cash feels tight or unpredictable", "Operations feel messy or fragile"],
            "decisionHorizon": "Within 90 days",
            "clarityLevel": "I have options but need structure to decide",
            "dataAvailable": ["Financial numbers (revenue, costs, cash)"],
            "riskLevel": "Cash stress",
        },
    }


def _run_one(i: int) -> tuple[bool, str]:
    body = json.dumps(_payload(i)).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/api/clear/diagnostic/run",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        latency = time.perf_counter() - started
        if payload.get("idea_stage"):
            return True, f"#{i} idea-stage off-ramp in {latency:.2f}s"
        decision_id = payload.get("decision_id")
        if not decision_id:
            return False, f"#{i} missing decision_id in response: {payload!r}"
        return True, f"#{i} ok decision_id={decision_id} latency={latency:.2f}s"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        return False, f"#{i} HTTP {exc.code}: {detail}"
    except Exception as exc:  # noqa: BLE001
        return False, f"#{i} error: {exc!s}"


def main() -> int:
    print(
        f"[smoke] target={API_BASE} requests={REQUESTS} concurrency={CONCURRENCY} timeout={TIMEOUT}s",
        flush=True,
    )
    ok_count = 0
    fail_count = 0
    lines: list[str] = []
    overall_start = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = [pool.submit(_run_one, i) for i in range(1, REQUESTS + 1)]
        for fut in concurrent.futures.as_completed(futures):
            ok, line = fut.result()
            lines.append(line)
            if ok:
                ok_count += 1
            else:
                fail_count += 1

    elapsed = time.perf_counter() - overall_start
    for line in sorted(lines):
        print(line, flush=True)
    print(
        f"[smoke] finished in {elapsed:.2f}s: ok={ok_count}, failed={fail_count}",
        flush=True,
    )
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
