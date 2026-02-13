"""
Run activation reminder job: send Day 2, 4, 7, 10, 12 nudge emails for enterprises that qualify.
Run daily via cron, e.g.:
  cd backend && python -m scripts.send_activation_reminders
Or call POST /api/clear/internal/activation-reminders with X-Cron-Secret header.
"""
import asyncio
import os
import sys
from pathlib import Path

_backend = Path(__file__).resolve().parent.parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))
os.chdir(_backend)

from app.db.database import SessionLocal
from app.clear.activation_reminders import run_activation_reminders


def main() -> None:
    db = SessionLocal()
    try:
        result = asyncio.run(run_activation_reminders(db))
        print(f"Activation reminders: sent={result['sent']}, skipped={result['skipped']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
