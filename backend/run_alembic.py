"""
Run Alembic from the backend directory with .env loaded.
Use from project root or backend: python run_alembic.py upgrade head
"""
import os
import sys
from pathlib import Path

# Backend directory (where this script lives)
_backend_dir = Path(__file__).resolve().parent

# Load .env from backend so DATABASE_URL is set before app.config is imported
try:
    from dotenv import load_dotenv
    load_dotenv(_backend_dir / ".env")
except ImportError:
    pass  # optional; pydantic-settings may still load from cwd

# Run Alembic from backend dir so it finds alembic.ini (script_location)
os.chdir(_backend_dir)

from alembic.config import main as alembic_main

if __name__ == "__main__":
    argv = sys.argv[1:] if len(sys.argv) > 1 else ["upgrade", "head"]
    alembic_main(argv=argv)
