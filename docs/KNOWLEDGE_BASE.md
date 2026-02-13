# CLEAR Knowledge Base (curated RAG)

CLEAR can use a **curated** knowledge base (frameworks, case studies, articles) to improve advisor and synthesis context. This is **retrieval-augmented generation (RAG)** only: no model fine-tuning and no autonomous ingestion.

## Schema

Table: `knowledge_chunks`

| Column       | Type           | Description |
|-------------|----------------|-------------|
| id          | Integer (PK)   | Auto |
| created_at  | Timestamptz    | Auto |
| source_type | String(50)     | `framework` \| `case_study` \| `article` |
| title       | String(500)    | Title of the chunk |
| content     | Text           | Body (will be truncated to snippets when retrieved) |
| tags        | JSONB          | e.g. `["finance", "ops", "Malaysia", "COSO", "SBL"]` |
| embedding   | vector(1536)   | OpenAI embedding; optional for vector search |

## How to add content

1. **Manual / offline script**  
   Insert rows into `knowledge_chunks`. If you want vector search, compute the embedding (e.g. with `app.rag.vectorstore.get_embedding(content)`) and set the `embedding` column.

2. **Suggested tags**  
   Use domain and context tags so retrieval can match: e.g. `finance`, `growth`, `operations`, `technology`, country codes or names (`Malaysia`, `Singapore`), framework names (`COSO`, `ACCA SBL`, `Carroll CSR`), and topic keywords.

3. **Content guidelines**  
   - Keep each chunk focused (1–3 paragraphs or a short section).  
   - Frameworks: short summaries or principles (e.g. COSO components, micro–meso–macro).  
   - Case studies: anonymised, 1–2 page summaries.  
   - No raw PII; only approved, curated text.

## Where it’s used

- **Decision chat:** `retrieve_knowledge_snippets(primary_domain, industry, country, topic_keywords)` is called when generating an advisor reply. Top snippets are passed as “reference material” in the prompt; the model is instructed to adapt them to the specific company.

You can also call `retrieve_knowledge_snippets` from synthesis or other services and pass the result into LLM calls as reference context.

## Constraints

- **No autonomous ingestion:** Only you (or an explicit offline job) add or update rows.  
- **No logging of user content into the knowledge base:** Only pre-approved frameworks and case studies.  
- **RAG only:** The base model is unchanged; knowledge is retrieved at query time.

## Example: adding a framework

```python
from app.db.models import KnowledgeChunk
from app.rag.vectorstore import get_embedding

content = "COSO Internal Control—Integrated Framework: five components (Control Environment, Risk Assessment, ...)"
tags = ["finance", "COSO", "controls", "governance"]
embedding = get_embedding(content)  # if RAG_ENABLED and you use vector search

chunk = KnowledgeChunk(
    source_type="framework",
    title="COSO Internal Control summary",
    content=content,
    tags=tags,
    embedding=embedding,
)
db.add(chunk)
db.commit()
```

## Migration

Run migrations so the table exists:

```bash
cd backend && alembic upgrade head
```

Migration: `l9b0c1d2e3f4_knowledge_chunks.py`.
