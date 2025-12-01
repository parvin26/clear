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
    
    # Initialize pgvector extension
    try:
        init_pgvector_extension()
    except Exception as e:
        print(f"Warning: pgvector extension initialization failed: {e}")
    
    # Test database connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
    
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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Exec-Connect Unified AI Agents API",
        "version": "1.0.0",
        "agents": ["CFO", "CMO", "COO", "CTO"],
        "docs": "/docs"
    }

