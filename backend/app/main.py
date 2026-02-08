"""
Main FastAPI application for Exec-Connect unified system.
Combines all four AI agents: CFO, CMO, COO, and CTO.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.config import settings
from app.routes import (
    health,
    cfo_routes,
    cmo_routes,
    cmo_chat_routes,
    coo_routes,
    coo_chat_routes,
    cto_routes,
    cto_chat_routes,
    clear_routes,
)
from app.db.database import engine, init_db, init_pgvector_extension
from app.utils.logging import setup_logging

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown."""
    # Startup
    print("Starting Exec-Connect unified backend...")
    print(f"Database URL: {settings.DATABASE_URL[:50]}...")
    print(f"OpenAI Model: {settings.LLM_MODEL}")
    print(f"RAG Enabled: {settings.RAG_ENABLED}")
    
    # Test database connection first
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise  # Fail startup if database is not accessible
    
    # Initialize pgvector extension (needed before migrations)
    try:
        init_pgvector_extension()
        print("✓ pgvector extension initialized")
    except Exception as e:
        print(f"Warning: pgvector extension initialization failed: {e}")
    
    # Run database migrations
    try:
        print("Running database migrations...")
        import os
        import sys
        from pathlib import Path
        from alembic.config import Config
        from alembic import command
        
        # Find alembic.ini - try multiple locations
        # On Render with rootDir=backend, we're already in backend/
        # Locally or from repo root, we need to find backend/
        current_dir = Path.cwd()
        possible_paths = [
            current_dir / "alembic.ini",  # Already in backend/
            current_dir / "backend" / "alembic.ini",  # In repo root
            Path(__file__).resolve().parent.parent / "alembic.ini",  # From app/main.py
        ]
        
        alembic_ini_path = None
        backend_dir = None
        
        for path in possible_paths:
            if path.exists():
                alembic_ini_path = path
                backend_dir = path.parent
                break
        
        if not alembic_ini_path:
            print(f"Warning: Could not find alembic.ini. Tried: {possible_paths}")
        else:
            print(f"Found alembic.ini at: {alembic_ini_path}")
            # Change to backend directory for alembic to work correctly
            original_cwd = os.getcwd()
            backend_path = str(backend_dir)
            try:
                os.chdir(backend_dir)
                print(f"Changed working directory to: {backend_dir}")
                
                # Add backend directory to sys.path if not already there
                if backend_path not in sys.path:
                    sys.path.insert(0, backend_path)
                
                alembic_cfg = Config(str(alembic_ini_path))
                command.upgrade(alembic_cfg, "head")
                print("✓ Database migrations completed")
            finally:
                os.chdir(original_cwd)
                if backend_path in sys.path:
                    sys.path.remove(backend_path)
    except Exception as e:
        import traceback
        print(f"✗ Database migration failed: {e}")
        print(traceback.format_exc())
        # Don't fail startup - allow the app to run even if migrations fail
        # (useful for troubleshooting, but logs will show the error)
    
    yield
    
    # Shutdown
    print("Shutting down Exec-Connect unified backend...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Unified AI Agents System combining CFO, CMO, COO, and CTO diagnostics for SMEs",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(cfo_routes.router)
app.include_router(cmo_routes.router)
app.include_router(cmo_chat_routes.router)
app.include_router(coo_routes.router)
app.include_router(coo_chat_routes.router)
app.include_router(cto_routes.router)
app.include_router(cto_chat_routes.router)
app.include_router(clear_routes.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Exec-Connect Unified AI Agents API",
        "version": "1.0.0",
        "agents": ["CFO", "CMO", "COO", "CTO"],
        "docs": "/docs"
    }

