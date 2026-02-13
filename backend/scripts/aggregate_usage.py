"""
Aggregate usage_events into weekly summary (anonymised; no PII).
Run: python -m scripts.aggregate_usage [--output json|print]
Output: counts by event_type and by week; optional JSON file for dashboards.
"""
import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import SessionLocal
from app.db.models import UsageEvent


def run_aggregation(db, weeks: int = 12):
    """Return dict: by_event_type, by_week, by_week_and_type."""
    cutoff = datetime.utcnow() - timedelta(weeks=weeks)
    events = (
        db.query(UsageEvent.event_type, UsageEvent.timestamp)
        .filter(UsageEvent.timestamp >= cutoff)
        .order_by(UsageEvent.timestamp)
        .all()
    )
    by_event_type = defaultdict(int)
    by_week = defaultdict(int)
    by_week_and_type = defaultdict(lambda: defaultdict(int))
    for event_type, ts in events:
        if not ts:
            continue
        by_event_type[event_type] += 1
        week_key = ts.strftime("%Y-W%W") if hasattr(ts, "strftime") else str(ts)[:7]
        by_week[week_key] += 1
        by_week_and_type[week_key][event_type] += 1
    return {
        "by_event_type": dict(by_event_type),
        "by_week": dict(by_week),
        "by_week_and_type": {w: dict(t) for w, t in by_week_and_type.items()},
        "total_events": len(events),
        "weeks_covered": weeks,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", choices=("json", "print"), default="print")
    ap.add_argument("--weeks", type=int, default=12)
    ap.add_argument("--out-file", default=None, help="Write JSON to this file when --output json")
    args = ap.parse_args()
    db = SessionLocal()
    try:
        summary = run_aggregation(db, weeks=args.weeks)
        if args.output == "print":
            print(json.dumps(summary, indent=2))
        else:
            out = args.out_file or os.path.join(os.path.dirname(__file__), "..", "docs", "usage_summary.json")
            with open(out, "w") as f:
                json.dump(summary, f, indent=2)
            print(f"Wrote {out}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
