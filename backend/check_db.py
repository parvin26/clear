"""
Load backend/.env and print current Alembic version (no venv activation needed).
Run from backend: python check_db.py
Or from project root: python backend/check_db.py
"""
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
env_file = backend_dir / ".env"

# Load .env from backend directory
try:
    from dotenv import load_dotenv
    load_dotenv(env_file)
except ImportError:
    pass

import os
if not os.environ.get("DATABASE_URL"):
    print("ERROR: DATABASE_URL not set. Create backend/.env with DATABASE_URL=...")
    exit(1)

from sqlalchemy import create_engine, text
engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as conn:
    rows = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
print("alembic_version =", [r[0] for r in rows])
