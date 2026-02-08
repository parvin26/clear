# Exec-Connect: Mermaid Diagrams (Copy-Paste Ready)

Use these in Mermaid-compatible tools (e.g. GitHub, Notion, VS Code Mermaid preview, or [mermaid.live](https://mermaid.live)).

---

## 1. System architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js 14)"]
        Pages["Pages: /, /cfo, /cmo, /coo, /cto, /get-started, etc."]
        Components["Components: Shell, Sidebar, Topbar, Agent forms & results"]
        API_Client["lib/api.ts (axios)"]
        Pages --> Components
        Components --> API_Client
    end

    subgraph Backend["Backend (FastAPI)"]
        Main["main.py (lifespan, CORS, routers)"]
        Routes["Routes: health, cfo, cmo, cmo_chat, coo, coo_chat, cto, cto_chat"]
        Agents["Agents: cfo, cmo, coo, cto"]
        Tools["Tools: financial, marketing, operational, tech"]
        RAG["RAG: vectorstore (embed + search)"]
        Main --> Routes
        Routes --> Agents
        Routes --> RAG
        Agents --> Tools
        Agents --> RAG
    end

    subgraph Database["Database (Supabase PostgreSQL + pgvector)"]
        Users["users"]
        Analyses["*_analyses (cfo, cmo, coo, cto)"]
        Docs["*_documents (finance, marketing, ops, tech)"]
        Chat["*_chat_messages"]
    end

    subgraph External["External"]
        OpenAI_API["OpenAI API"]
    end

    API_Client --> Routes
    Routes --> Database
    Agents --> OpenAI_API
    RAG --> OpenAI_API
    RAG --> Database
```

---

## 2. User journey: Landing → Agent → Diagnostic → Analysis → Results

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant O as OpenAI

    U->>F: Open / then choose agent (e.g. CFO)
    F->>F: /cfo → /cfo/diagnostic
    U->>F: Submit diagnostic form
    F->>B: POST /api/cfo/diagnose
    B->>B: Tools + optional RAG
    B->>O: Chat completion (JSON)
    O->>B: Analysis JSON
    B->>DB: INSERT cfo_analyses
    B->>F: 200 { id, summary, ... }
    F->>F: Redirect to /cfo/analysis/[id]
    F->>B: GET /api/cfo/analyses/[id]
    B->>F: CFOAnalysisOut
    F->>U: Show summary, recommendations, action plan
```

---

## 3. Document and RAG flow

```mermaid
flowchart LR
    subgraph Ingest["Document ingestion (backend only)"]
        Doc["Document text"]
        Embed["OpenAI embedding"]
        Upsert["upsert_*_document"]
        Doc --> Embed
        Embed --> Upsert
    end

    subgraph Store["Database"]
        FD[(finance_documents)]
        MD[(marketing_documents)]
        OD[(ops_documents)]
        TD[(tech_documents)]
        Upsert --> FD
        Upsert --> MD
        Upsert --> OD
        Upsert --> TD
    end

    subgraph Retrieve["At request time"]
        Query["User input / question"]
        QEmbed["get_embedding(query)"]
        Search["search_*_docs"]
        Vec["pgvector <=>"]
        Snippets["Top-K snippets"]
        Query --> QEmbed
        QEmbed --> Search
        Search --> Vec
        Vec --> Snippets
        FD --> Vec
        MD --> Vec
        OD --> Vec
        TD --> Vec
    end

    Snippets --> Prompt["LLM prompt"]
```

---

## 4. Chat flow: Frontend → Backend → OpenAI → Database

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant O as OpenAI

    U->>F: Send message
    F->>B: POST /api/{agent}/chat (payload)
    B->>B: Optional RAG search (CMO/CTO)
    B->>O: Chat completion
    O->>B: Reply
    B->>DB: INSERT *_chat_messages
    B->>F: Chat response
    F->>U: Show reply
```

---

## 5. Analysis generation flow (e.g. CFO)

```mermaid
flowchart LR
    A[Input payload] --> B[Tools e.g. financial_summary]
    A --> C{RAG trigger?}
    C -->|yes| D[search_*_docs]
    C -->|no| E[docs = None]
    D --> E
    B --> F[Build prompt]
    E --> F
    F --> G[OpenAI chat]
    G --> H[JSON analysis]
    H --> I[Save to DB]
    I --> J[Return to frontend]
```

---

## 6. Database schema (ER)

```mermaid
erDiagram
    users ||--o{ cfo_analyses : "user_id"
    users ||--o{ cmo_analyses : "user_id"
    users ||--o{ coo_analyses : "user_id"
    users ||--o{ cto_analyses : "user_id"
    users ||--o{ cfo_chat_messages : "user_id"
    users ||--o{ cmo_chat_messages : "user_id"
    users ||--o{ coo_chat_messages : "user_id"
    users ||--o{ cto_chat_messages : "user_id"
    coo_analyses ||--o{ coo_chat_messages : "analysis_id"

    users { int id PK string email string name datetime created_at }
    cfo_analyses { int id PK int user_id FK jsonb input_payload jsonb analysis_json string risk_level datetime created_at }
    cmo_analyses { int id PK int user_id FK jsonb input_payload jsonb analysis_json string risk_level datetime created_at }
    coo_analyses { int id PK int user_id FK jsonb input_payload jsonb analysis_json string priority_area string risk_level datetime created_at }
    cto_analyses { int id PK int user_id FK jsonb input_payload jsonb analysis_json string risk_level datetime created_at }
    finance_documents { int id PK string title text content vector embedding datetime created_at }
    marketing_documents { int id PK string title text content vector embedding datetime created_at }
    ops_documents { int id PK string title text content vector embedding datetime created_at }
    tech_documents { int id PK string title text content vector embedding datetime created_at }
    cfo_chat_messages { int id PK string session_id int user_id FK text user_message text ai_response datetime created_at }
    cmo_chat_messages { int id PK int user_id FK string role text content jsonb sources datetime created_at }
    coo_chat_messages { int id PK int user_id FK int analysis_id FK string role text content string session_id datetime created_at }
    cto_chat_messages { int id PK int user_id FK string role text content datetime created_at }
```

---

*Source: ARCHITECTURE_AND_DOCUMENTATION.md*
