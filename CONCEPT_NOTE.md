# Exec-Connect: Concept Note (Executive Summary)

## What is Exec-Connect?

Exec-Connect is a **unified AI-powered platform** that provides on-demand strategic leadership for small and medium enterprises (SMEs). It offers four virtual CXO agents—**AI-CFO**, **AI-CMO**, **AI-COO**, and **AI-CTO**—that deliver diagnostics, actionable recommendations, and conversational advice tailored to each business function and to regional context (South-East Asia).

---

## What problem does it solve?

SMEs often lack access to full-time C-suite expertise due to cost and availability. Exec-Connect addresses this by:

- **Democratizing access:** Any SME can run structured diagnostics and get AI-generated analyses and action plans.
- **Speed:** Insights in minutes instead of weeks.
- **Cost:** Fraction of the cost of hiring or retaining full-time executives.
- **Continuity:** Chat and history allow follow-up and iteration without scheduling.

---

## Who is it for?

- **Primary:** Small and medium enterprises (e.g. 1–50 employees) in **Malaysia and emerging markets** (South-East Asia, Asia).
- **Context:** Aligned with initiatives such as **Be Noor Foundation**—supporting businesses that need strategic guidance but have limited budget for senior talent.
- **Use cases:** Founders and managers who want financial clarity, marketing strategy, operations improvement, or technology roadmap without committing to full-time CXO hires.

---

## How does it work? (High-level user experience)

1. User lands on the site and chooses an agent (CFO, CMO, COO, or CTO).
2. User runs a **diagnostic** by completing a structured form (challenges, metrics, systems, etc.).
3. Backend computes **tools** (metrics/scores), optionally fetches **RAG** documents, and calls **OpenAI** to produce a structured analysis.
4. User sees **summary, risks, recommendations, and action plan** (week/month/quarter) and can open **chat** for follow-up questions.
5. **Chat** is persisted; CMO/CTO chat can use RAG to ground answers in stored documents.

---

## What makes it unique?

- **Four integrated agents** in one product (finance, marketing, operations, technology).
- **RAG-augmented diagnostics and chat** (where enabled) so answers can reference preloaded domain documents.
- **Structured outputs** (JSON) so the product can show consistent UI (risk level, action plan, recommendations) across agents.
- **Regional framing** in prompts (currencies, regulations, informal finance, family businesses) for South-East Asia.

---

## Technical stack summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix/shadcn-style UI |
| Backend | FastAPI, SQLAlchemy, PostgreSQL (Supabase), pgvector |
| AI | OpenAI API (chat completions + text-embedding-3-small for RAG) |
| Deployment | Backend (e.g. port 8000), Frontend (e.g. port 3003); DB and migrations via Alembic |

---

## MVP features vs. future roadmap

| MVP (current) | Future potential |
|---------------|------------------|
| Four agent diagnostics | User authentication |
| Agent-specific chat | Document upload for RAG |
| Analysis history | Human CXO matching (book-call / book-cxo) |
| RAG when enabled (no user upload) | More agents or deeper integrations |
| No auth | Multi-language, payment/subscription |

---

*For full architecture, data flows, and file reference, see ARCHITECTURE_AND_DOCUMENTATION.md.*
