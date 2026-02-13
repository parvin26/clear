#!/usr/bin/env python3
"""
Run monthly Health, Velocity, and ECRI snapshots via the admin API.
Use from cron or manually on the first of the month.

Usage:
  python run_monthly_snapshots.py --admin-api-key YOUR_KEY
  python run_monthly_snapshots.py --base-url https://api.example.com --admin-api-key YOUR_KEY
  python run_monthly_snapshots.py --admin-api-key YOUR_KEY --enterprise-id 1
  python run_monthly_snapshots.py --admin-api-key YOUR_KEY --cohort-id 2
  python run_monthly_snapshots.py --admin-api-key YOUR_KEY --portfolio-id 3
"""
import argparse
import json
import sys
import urllib.request
import urllib.error


def main() -> int:
    p = argparse.ArgumentParser(description="Run monthly snapshots via admin API")
    p.add_argument("--base-url", default="http://localhost:8000", help="Backend base URL")
    p.add_argument("--admin-api-key", required=True, help="Admin API key (required)")
    p.add_argument("--enterprise-id", type=int, default=None, help="Run for one enterprise")
    p.add_argument("--cohort-id", type=int, default=None, help="Run for enterprises in cohort")
    p.add_argument("--portfolio-id", type=int, default=None, help="Run for enterprises in portfolio")
    args = p.parse_args()

    body: dict = {}
    if args.enterprise_id is not None:
        body["enterprise_id"] = args.enterprise_id
    if args.cohort_id is not None:
        body["cohort_id"] = args.cohort_id
    if args.portfolio_id is not None:
        body["portfolio_id"] = args.portfolio_id

    url = f"{args.base_url.rstrip('/')}/api/admin/snapshots/run-monthly"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Admin-Api-Key": args.admin_api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode())
            print(json.dumps(data, indent=2))
            errors = data.get("errors") or []
            if errors:
                print("Errors occurred:", file=sys.stderr)
                for e in errors:
                    print(f"  - {e}", file=sys.stderr)
                return 1
            return 0
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.reason}", file=sys.stderr)
        try:
            body = e.read().decode()
            print(body, file=sys.stderr)
        except Exception:
            pass
        return 1
    except Exception as e:
        print(f"Request failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
