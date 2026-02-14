# Exec-Connect: Unified AI Agents System

A unified system combining four specialized AI agents (CFO, CMO, COO, CTO) for SME diagnostics and advisory services.

## Architecture

The system consists of:
- **Backend**: FastAPI application with unified routes for all four agents
- **Frontend**: Next.js application with unified dashboard and agent-specific pages
- **Database**: PostgreSQL with pgvector extension for RAG capabilities

## Project Structure

```
exec-connect/
├── backend/
│   ├── app/
│   │   ├── agents/          # All four AI agents
│   │   │   ├── cfo_agent.py
│   │   │   ├── cmo_agent.py
│   │   │   ├── coo_agent.py
│   │   │   └── cto_agent.py
│   │   ├── routes/          # Unified API routes
│   │   │   ├── cfo_routes.py
│   │   │   ├── cmo_routes.py
│   │   │   ├── coo_routes.py
│   │   │   ├── cto_routes.py
│   │   │   └── *_chat_routes.py
│   │   ├── schemas/         # Pydantic schemas organized by agent
│   │   │   ├── cfo/
│   │   │   ├── cmo/
│   │   │   ├── coo/
│   │   │   └── cto/
│   │   ├── tools/           # Specialized tools for each agent
│   │   ├── rag/             # Unified RAG vectorstore
│   │   ├── db/              # Unified database models
│   │   └── main.py          # Main FastAPI application
│   ├── alembic/             # Database migrations
│   └── requirements.txt
└── frontend/                # Next.js frontend (to be created)
```

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Create a `.env` file in the `backend/` directory. Required for production (e.g. Railway): **DATABASE_URL**, **OPENAI_API_KEY**, **CORS_ORIGINS**. The backend uses the psycopg2 driver (URL scheme `postgresql+psycopg2://`).
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/exec_connect
   OPENAI_API_KEY=your_openai_api_key_here
   CORS_ORIGINS=http://localhost:3000,http://localhost:3003
   LLM_MODEL=gpt-5.1
   RAG_ENABLED=true
   RAG_TOP_K=4
   ```

3. **Set up database:**
   ```bash
   # Create database
   createdb exec_connect
   
   # Initialize Alembic (if not already done)
   alembic init alembic
   
   # Run migrations
   alembic upgrade head
   ```

4. **Run the backend:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   API documentation will be available at: http://localhost:8000/docs

### API Endpoints

All endpoints are prefixed with `/api`:

- **CFO**: `/api/cfo/*`
  - POST `/api/cfo/diagnose` - Run financial diagnostic
  - GET `/api/cfo/analyses` - List analyses
  - POST `/api/cfo/chat` - Chat with AI-CFO

- **CMO**: `/api/cmo/*`
  - POST `/api/cmo/diagnose` - Run marketing diagnostic
  - GET `/api/cmo/analyses` - List analyses
  - POST `/api/cmo/chat` - Chat with AI-CMO

- **COO**: `/api/coo/*`
  - POST `/api/coo/diagnose` - Run operations diagnostic
  - GET `/api/coo/analyses` - List analyses
  - POST `/api/coo/chat` - Chat with AI-COO

- **CTO**: `/api/cto/*`
  - POST `/api/cto/diagnose` - Run technology diagnostic
  - GET `/api/cto/analyses` - List analyses
  - POST `/api/cto/chat` - Chat with AI-CTO

## Next Steps

1. **Frontend Setup**: The frontend structure needs to be created (Next.js application)
2. **Database Migrations**: Set up Alembic migrations for all models
3. **Testing**: Add comprehensive tests for all agents
4. **Deployment**: Configure for production deployment

## Notes

- All four agents share the same database instance
- RAG functionality is unified but uses separate document tables per domain
- Each agent maintains its own analysis and chat message tables
- User authentication is stubbed out and should be implemented

