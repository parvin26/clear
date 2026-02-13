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
    admin_routes,
    telemetry_routes,
    cfo_routes,
    cmo_routes,
    cmo_chat_routes,
    coo_routes,
    coo_chat_routes,
    cto_routes,
    cto_chat_routes,
    clear_routes,
    decision_routes,
    transcribe_routes,
    advisor_routes,
    demo_routes,
    inquiry_routes,
)
from app.enterprise.routes import router as enterprise_router
from app.execution.routes import router as execution_router
from app.outcomes.routes import router as outcomes_router
from app.documents.routes import router as documents_router
from app.capability.routes import router as capability_router
from app.institutional.routes import router as institutional_router
from app.auth.routes import router as auth_router
from app.db.database import engine, init_db, init_pgvector_extension
from app.utils.logging import setup_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIdMiddleware

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown."""
    # Startup
    print("Starting Exec-Connect unified backend...")
    print(f"Database URL: {settings.DATABASE_URL[:50]}...")
    key = settings.OPENAI_API_KEY or ""
    print(f"OPENAI_API_KEY: ...{key[-4:] if len(key) >= 4 else '(not set)'}")
    print(f"OpenAI Model: {settings.LLM_MODEL}")
    print(f"RAG Enabled: {settings.RAG_ENABLED}")
    wispr = settings.WISPR_API_KEY or ""
    print(f"Wispr voice input: {'configured' if wispr else 'not configured (set WISPR_API_KEY to enable)'}")
    
    # Test database connection first
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[OK] Database connection successful")
    except Exception as e:
        print(f"[FAIL] Database connection failed: {e}")
        raise  # Fail startup if database is not accessible
    
    # Initialize pgvector extension (needed for migrations and app)
    try:
        init_pgvector_extension()
        print("[OK] pgvector extension initialized")
    except Exception as e:
        print(f"Warning: pgvector extension initialization failed: {e}")
    
    # Migrations are run by run.ps1 / run.sh before starting the server so the
    # lifespan stays minimal and the server stays running (avoids exit on some Windows setups).
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
# IP-based rate limits: auth 10/min, telemetry 60/min, diagnostic 30/min (429 + Retry-After: 60)
app.add_middleware(RateLimitMiddleware)
# Request ID for structured logging (x-request-id on response)
app.add_middleware(RequestIdMiddleware)

# Include routers
app.include_router(health.router)
app.include_router(admin_routes.router)
app.include_router(telemetry_routes.router, prefix=settings.API_V1_PREFIX)
app.include_router(cfo_routes.router)
app.include_router(cmo_routes.router)
app.include_router(cmo_chat_routes.router)
app.include_router(coo_routes.router)
app.include_router(coo_chat_routes.router)
app.include_router(cto_routes.router)
app.include_router(cto_chat_routes.router)
app.include_router(clear_routes.router)
app.include_router(advisor_routes.router)
app.include_router(decision_routes.router)
app.include_router(transcribe_routes.router)
app.include_router(enterprise_router)
app.include_router(execution_router)
app.include_router(outcomes_router)
app.include_router(documents_router)
app.include_router(capability_router)
app.include_router(institutional_router)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(demo_routes.router)
app.include_router(inquiry_routes.router)


@app.get("/api/health")
async def api_health():
    """Health check under API prefix for smoke tests and load balancers."""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Exec-Connect Unified AI Agents API",
        "version": "1.0.0",
        "agents": ["CFO", "CMO", "COO", "CTO"],
        "docs": "/docs"
    }

