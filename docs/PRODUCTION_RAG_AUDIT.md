# Production RAG Audit: CLEAR Backend

**Purpose:** Enable production-ready RAG (document ingestion → embeddings → vector search → answer generation) for the Exec-Connect backend on Railway with Postgres.

**Current deployment:** Backend on Railway, Frontend on Vercel, `DATABASE_URL` in use, `RAG_ENABLED=true`.

---

## 1. Codebase inspection

### 1.1 Where embeddings are generated

| Location | Function | Model |
|----------|----------|--------|
| `backend/app/rag/vectorstore.py` | `get_embedding(text)` | OpenAI `text-embedding-3-small` (1536 dimensions) |
| Same module | Used by all `upsert_*_document` and `search_*_docs` | — |
| `backend/app/knowledge/retrieval.py` | `get_embedding(query_text)` for knowledge_chunks | Same |
| `backend/scripts/seed_knowledge_finance_ops.py` | `get_embedding(c["content"][:8000])` for seeding | Same |

**Dependency:** `OPENAI_API_KEY` must be set; otherwise `get_embedding()` returns `[]` and RAG search returns no results.

### 1.2 Where vector storage is expected

- **Single store:** PostgreSQL with the **pgvector** extension. There is no Pinecone, Supabase Vector, or other external vector DB in this repo.
- **Usage:**
  - `app/db/database.py`: `CREATE EXTENSION IF NOT EXISTS vector` in `init_pgvector_extension()` and (currently) in `get_db()` on every request.
  - `app/db/models.py`: `from pgvector.sqlalchemy import Vector`; all document/knowledge tables use `Column(Vector(1536), nullable=True)`.
  - `app/rag/vectorstore.py`: Raw SQL with `embedding <=> %s::vector` (cosine distance) for finance, marketing, ops, knowledge; `OpsDocument.embedding.cosine_distance()` for ops; TechDocument was using in-memory similarity (see fix below).
  - `app/knowledge/retrieval.py`: Raw SQL `ORDER BY embedding <=> %s::vector` on `knowledge_chunks`.

**Conclusion:** The implementation **requires pgvector in Postgres**. It does not use an external vector database or Supabase-specific APIs—only standard Postgres + pgvector.

### 1.3 Tables and models used for documents and embeddings

| Table | Model | Embedding column | Purpose |
|-------|--------|-------------------|---------|
| `finance_documents` | `FinanceDocument` | `embedding` vector(1536) | CFO RAG |
| `marketing_documents` | `MarketingDocument` | `embedding` vector(1536) | CMO RAG |
| `ops_documents` | `OpsDocument` | `embedding` vector(1536) | COO RAG |
| `tech_documents` | `TechDocument` | `embedding` vector(1536) | CTO RAG |
| `knowledge_chunks` | `KnowledgeChunk` | `embedding` vector(1536) | Curated knowledge (synthesis/chat) |

All embedding columns are `nullable=True`; search logic filters with `WHERE embedding IS NOT NULL`.

### 1.4 Migrations that create or alter vector columns

| Migration | What it does |
|-----------|----------------|
| `7d4b3424e102_initial_unified_schema.py` | Creates `finance_documents`, `marketing_documents`, `ops_documents` with `VECTOR(dim=1536)`; `tech_documents` with `sa.Text()` (legacy). |
| `a1b2c3d4e5f6_fix_tech_document_embedding_type.py` | Drops and re-adds `tech_documents.embedding` as `vector(1536)`. |
| `l9b0c1d2e3f4_knowledge_chunks.py` | Adds `knowledge_chunks.embedding` as `vector(1536)`. |

**Note:** No migration runs `CREATE EXTENSION IF NOT EXISTS vector`. The app does that at runtime in `init_pgvector_extension()` and (before fix) in `get_db()`. The extension must exist in the Postgres instance (e.g. Railway pgvector template or Supabase).

### 1.5 Endpoints: ingestion and retrieval

**Ingestion**

| Endpoint | File | Behavior |
|----------|------|----------|
| `POST /api/documents` | `app/documents/routes.py` | Body: `domain`, `title`, `content`, optional `enterprise_id`, `decision_id`. Calls `document_service.upload()` → `upsert_*_document()` for domain `finance` \| `marketing` \| `ops` \| `tech`. Generates embedding via OpenAI and stores in the corresponding table. Optionally creates a `document_links` row. |

**Retrieval (RAG search, no dedicated “search” endpoint)**

- **CFO:** `app/routes/cfo_routes.py` — diagnostic/chat flows call `search_finance_docs(db, query, top_k)`.
- **CMO:** `app/agents/cmo_agent.py` — `search_marketing_docs(db, search_query, top_k=settings.RAG_TOP_K)`.
- **COO:** `app/routes/coo_routes.py`, `app/diagnostic/run_service.py` — `search_ops_docs(db, query, top_k=...)`.
- **CTO:** `app/routes/cto_routes.py` — `search_tech_docs(db, query, top_k)`.
- **Knowledge:** `app/knowledge/retrieval.py` — `retrieve_knowledge_snippets()` uses vector search on `knowledge_chunks` when `RAG_ENABLED` and embeddings exist.

RAG is used inside agent/diagnostic flows; there is no standalone “/api/rag/search” endpoint.

---

## 2. What the current implementation requires

- **Postgres with pgvector:** The code assumes the `vector` extension is available. Standard Railway Postgres **does not** include pgvector; the extension is not installed, so `CREATE EXTENSION vector` fails.
- **Options:**
  1. **Railway: Postgres with pgvector template** (recommended for this project)  
     Use the template [Postgres with pgVector Engine](https://railway.com/deploy/postgres-with-pgvector-engine). Same project as the backend; set `DATABASE_URL` to the new DB’s URL (e.g. `${{Postgres.DATABASE_URL}}`). Then run `CREATE EXTENSION IF NOT EXISTS vector` once (or let the app do it at startup).
  2. **Supabase**  
     Supabase Postgres has pgvector. Use Supabase’s connection string as `DATABASE_URL`. Run `CREATE EXTENSION IF NOT EXISTS vector` if not already enabled.
  3. **Self-hosted / other cloud Postgres**  
     Use an image or managed Postgres that includes pgvector (e.g. `pgvector/pgvector:pg17`), then create the extension.

**Best way for this project:** Use **Railway’s “Postgres with pgVector Engine” template** in the same Railway project as the backend. One database for app + vectors, no extra services, and the repo is already set up for pgvector in one Postgres.

---

## 3. Deployment checklist

### 3.1 Environment variables (backend / Railway)

| Variable | Required for RAG | Notes |
|----------|-------------------|--------|
| `DATABASE_URL` | Yes | Postgres URL from a **pgvector-capable** instance (e.g. Railway pgvector template). Use `${{Postgres.DATABASE_URL}}` if the DB service is named `Postgres`. |
| `OPENAI_API_KEY` | Yes | Used by `get_embedding()` and LLM calls. |
| `RAG_ENABLED` | Optional | Default `True`. Set `false` to disable RAG (search returns []). |
| `RAG_TOP_K` | Optional | Default `4`. Number of documents returned per RAG search. |
| `CORS_ORIGINS` | Yes for frontend | e.g. `https://your-app.vercel.app`. |

No RAG-specific env vars for Pinecone/Supabase Vector; only Postgres + OpenAI.

### 3.2 Database choice

- Use **one** Postgres that supports pgvector (e.g. Railway pgvector template or Supabase).
- Do **not** use Railway’s default Postgres template if it does not include pgvector (extension will be missing).

### 3.3 SQL commands required

Run once per database (e.g. after provisioning pgvector-capable Postgres):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Migrations create the tables and columns; they do not create the extension. If you use the Railway pgvector template, the extension is available; the app (or a one-off script) can run the above.

### 3.4 Migration steps

1. Ensure `DATABASE_URL` points to the pgvector-capable Postgres.
2. Run migrations: `alembic upgrade head` (e.g. in Railway via Procfile `release` or a deploy script).
3. No separate “vector DB” migrations; all vector columns are in the existing Alembic migrations.

### 3.5 Rebuilding indexes or embeddings

- **Indexes:** The project does not create HNSW/IVFFlat indexes in migrations. Search uses `ORDER BY embedding <=> $1::vector LIMIT $2` (sequential scan). For larger tables (e.g. >10k rows), add indexes manually, for example:
  ```sql
  CREATE INDEX ON finance_documents USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX ON marketing_documents USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX ON ops_documents USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX ON tech_documents USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
  ```
- **Embeddings:** Regenerate by re-ingesting documents (e.g. `POST /api/documents`) or by re-running the seed script for `knowledge_chunks`:  
  `python -m scripts.seed_knowledge_finance_ops` (from `backend/`). There is no “rebuild all embeddings” API; ingestion and seed script populate embeddings.

---

## 4. Fix once and for all

### 4.1 Startup must not fail if the vector extension is missing

- **Current:** `main.py` calls `init_pgvector_extension()` in lifespan; on failure it only logs a warning. So startup does not fail. However, `get_db()` in `database.py` runs `CREATE EXTENSION IF NOT EXISTS vector` on **every** request and commits; if the extension is missing, every request fails.
- **Change:** Remove the extension creation from `get_db()`. Rely only on `init_pgvector_extension()` at startup. If the extension is missing, startup logs a warning and RAG searches will fail at runtime until the DB has pgvector. Optional: guard RAG code paths with a “pgvector available” check and return empty results or a clear error.

**Applied in this repo:** `get_db()` no longer runs `CREATE EXTENSION`; only startup does. Startup remains non-fatal for pgvector.

### 4.2 RAG initialization deterministic and stable

- **Deterministic:** Embeddings come from OpenAI; same text → same embedding. No randomness in vectorstore or retrieval.
- **Stable:** Ensure `init_pgvector_extension()` is called once at startup and that no other code creates/drops the extension. Do not create the extension per request (already fixed by removing it from `get_db()`).

### 4.3 TechDocument: store and search with native vector

- **Current bug:** `upsert_tech_document()` stored `embedding` as `json.dumps(embedding)` (string). `search_tech_docs()` loaded all rows and did cosine similarity in Python. The model and migration use `Vector(1536)`; storing a JSON string is wrong and search does not use the index.
- **Fix:** Store the embedding list directly on `TechDocument.embedding`. Use pgvector `<=>` in SQL for `search_tech_docs()` (same pattern as finance/marketing) so behavior is consistent and indexable.

### 4.4 Railway vs Vercel

| Concern | Railway (backend) | Vercel (frontend) |
|--------|-------------------|---------------------|
| **RAG** | All RAG logic: ingestion, embeddings, vector search. Needs `DATABASE_URL` (pgvector Postgres), `OPENAI_API_KEY`, `RAG_ENABLED`, `RAG_TOP_K`. | No RAG; calls backend APIs (e.g. diagnostics, chat, document upload). |
| **Env** | `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`, optional `RAG_ENABLED`, `RAG_TOP_K`. | `NEXT_PUBLIC_*` for backend URL; no DB or OpenAI keys. |
| **DB / pgvector** | Backend connects to Postgres; pgvector must be on that Postgres. Use Railway pgvector template or Supabase. | N/A. |

---

## 5. PRODUCTION RAG DEPLOYMENT STEPS (COPY-PASTE READY)

### 5.1 Database choice

- Use **Postgres with pgvector**.
- **Recommended:** In the same Railway project as the backend, add a database from the template **“Postgres with pgVector Engine”** ([link](https://railway.com/new/template/postgres-with-pgvector-engine)). Name it e.g. `Postgres` and use its `DATABASE_URL` for the backend.
- **Alternative:** Use Supabase Postgres (has pgvector) and set `DATABASE_URL` to Supabase’s connection string.

### 5.2 Environment variables (Railway backend service)

Set on the **backend** service:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=<your-openai-key>
RAG_ENABLED=true
RAG_TOP_K=4
CORS_ORIGINS=https://your-app.vercel.app
```

If the DB service has another name, replace `Postgres` in the reference. If using Supabase, set `DATABASE_URL` to the Supabase connection string.

### 5.3 SQL commands (run once per database)

Connect to the Postgres that backs `DATABASE_URL` (e.g. Railway dashboard → Postgres → Connect, or `psql $DATABASE_URL`) and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

(Optional, for larger tables:) Add HNSW indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_finance_docs_embedding ON finance_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_marketing_docs_embedding ON marketing_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ops_docs_embedding ON ops_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_tech_docs_embedding ON tech_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
```

### 5.4 Deployment order

1. Create or switch to a **pgvector-capable** Postgres (Railway pgvector template or Supabase).
2. Set **backend** env vars (especially `DATABASE_URL` to pgvector, `OPENAI_API_KEY`, `CORS_ORIGINS`).
3. **Redeploy the backend** so the **release** phase runs `alembic upgrade head` against the pgvector DB. Migrations in this repo now include:
   - `z0enablepgvec` – runs `CREATE EXTENSION IF NOT EXISTS vector` (first on fresh DBs).
   - `x2b3c4d5e6f7` – runs it again at the end of the chain (for existing DBs).
   So you do **not** need to run `CREATE EXTENSION` manually unless you prefer to.
4. (Optional) Seed knowledge: from `backend/`, `python -m scripts.seed_knowledge_finance_ops` (use pgvector’s public URL if running from your machine).
5. Deploy **frontend** on Vercel with backend URL in env (e.g. `NEXT_PUBLIC_API_URL`).

### 5.5 Smoke test commands to confirm RAG works

**Option A – Script (recommended)**  
From repo root or `backend/`:

```powershell
.\backend\scripts\rag_smoke_test.ps1 -BaseUrl "https://clear-production-c8ca.up.railway.app"
```

Or set `$env:API_BASE_URL = "https://your-backend.up.railway.app"` and run `.\backend\scripts\rag_smoke_test.ps1`.  
The script checks GET /api/health and POST /api/documents (finance); exit 0 = pass.

**Option B – Manual curl**

1. **Health:**  
   `curl -s https://your-backend.up.railway.app/api/health`  
   Expect 200 and a healthy payload.

2. **Ingestion:**  
   ```bash
   curl -s -X POST https://your-backend.up.railway.app/api/documents \
     -H "Content-Type: application/json" \
     -d '{"domain":"finance","title":"Test doc","content":"Cash flow and runway matter for SMEs."}'
   ```  
   Expect `{"id":...,"domain":"finance","title":"Test doc"}`.

3. **RAG in context (CFO):**  
   Run a CFO diagnostic or chat that triggers RAG (e.g. from the frontend or an API that calls `search_finance_docs`). Confirm the response uses the uploaded snippet or that no error is returned.

4. **Knowledge retrieval (optional):**  
   If you use synthesis/chat that calls `retrieve_knowledge_snippets`, run that flow after seeding `knowledge_chunks`.

5. **Logs:**  
   In Railway backend logs you should see at startup:  
   `[OK] pgvector extension initialized`  
   If you see `Warning: pgvector extension initialization failed`, the DB does not have pgvector—use the pgvector template or Supabase.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Where are embeddings generated? | `app/rag/vectorstore.py` → `get_embedding()` using OpenAI `text-embedding-3-small` (1536 dims). |
| Where is vector storage? | PostgreSQL with pgvector only; no external vector DB. |
| Which tables have vectors? | `finance_documents`, `marketing_documents`, `ops_documents`, `tech_documents`, `knowledge_chunks`. |
| Which migrations add vector columns? | `7d4b3424e102`, `a1b2c3d4e5f6`, `l9b0c1d2e3f4`. |
| Ingestion endpoint? | `POST /api/documents` (domain + title + content). |
| Retrieval? | Via agent/diagnostic routes (CFO/CMO/COO/CTO) and `retrieve_knowledge_snippets`; no standalone RAG search endpoint. |
| pgvector required? | Yes. Use Railway’s “Postgres with pgVector Engine” template or Supabase. |
| Best way to get Postgres + pgvector? | Use Railway’s pgvector template in the same project as the backend and set `DATABASE_URL` to that database. |

Code changes applied in this repo: (1) `get_db()` no longer runs `CREATE EXTENSION` (startup only). (2) TechDocument upsert/search use native `vector(1536)` and pgvector `<=>` in SQL.
