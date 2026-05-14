# GO Profile Matcher AI

AI-powered chatbot for a recruiting firm to match resumes against job descriptions using vector similarity search and LLM explanations.

**Company:** Golden Opportunities Pvt Ltd  
**Brand Colors:** `#282b4a` (navy) · `#f4c310` (gold) · `#ffffff` (white)  
**Logo:** `frontend/public/logo.png` (R2.png from gojobs.biz)

---

## Architecture Overview

```
Recruiter (Browser :3000)
        │
        ▼
React + MUI Frontend
        │ Axios + JWT
        ▼
FastAPI Backend (:8000)
        │
   ┌────┴────┐
   │         │
pgvector   Groq/Bedrock
(postgres)   LLM
```

### Full RAG Pipeline

**Ingestion (one-time):**
Resume file → parser.py (text + metadata) → embedder.py (BGE-small 384-dim vector + domain skill keywords) → pgvector DB

**Matching (per request):**
JD text → embed → cosine similarity (HNSW) → top-K candidates → LLM explanation (top 5) → JSON response

---

## Project Structure

```
Rag/
├── backend/
│   ├── api/
│   │   ├── main.py                  # FastAPI app entry point
│   │   └── routes/
│   │       ├── auth.py              # /auth/register, /auth/login, /auth/me
│   │       └── chat.py              # /chats CRUD + /chats/{id}/match
│   ├── auth/
│   │   └── auth.py                  # JWT (python-jose) + bcrypt helpers + get_current_user
│   ├── db/
│   │   ├── database.py              # psycopg2 connection manager (context manager)
│   │   ├── schema.sql               # Full schema (profiles + users + chats + messages)
│   │   └── migrations/
│   │       └── 001_add_auth_chat.sql  # Migration: add users/chats/messages tables
│   ├── ingestion/
│   │   ├── parser.py                # PDF (PyMuPDF) + DOCX parsing; extracts name/email/phone/title/experience
│   │   └── embedder.py             # BGE-small embedding + skill extraction + dedup check + DB insert
│   ├── retrieval/
│   │   └── matcher.py              # Embed JD → pgvector cosine similarity query
│   ├── llm/
│   │   └── ranker.py               # LiteLLM → AWS Bedrock Claude Haiku → 3-4 bullet explanation
│   ├── ml/
│   │   └── model.py                # BGE-small singleton (loaded once, shared across embedder + matcher)
│   ├── ingest_batch.py             # CLI: bulk ingest all resumes from data/resumes/
│   ├── requirements.txt
│   └── .env                        # NOT committed — see .env.example
│
├── frontend/
│   ├── public/
│   │   └── logo.png                # GO logo (copy from Downloads/R2.png)
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Routes + PrivateRoute + PublicRoute guards
│   │   ├── theme.js                # MUI theme (#282b4a primary, #f4c310 secondary)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Login form with GO logo
│   │   │   ├── RegisterPage.jsx    # Register form with GO logo
│   │   │   └── ChatPage.jsx        # Main chat UI (sidebar + chat window + input)
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Chat history list, new chat, delete, logout, user info
│   │   │   ├── ChatWindow.jsx      # Message bubbles (user right/navy, AI left/white) + typing indicator
│   │   │   ├── CandidateCard.jsx   # Result card: rank badge, score, title, skills chips, AI explanation
│   │   │   └── UploadModal.jsx     # Drag-and-drop resume upload dialog
│   │   └── services/
│   │       └── api.js              # Axios instance + JWT interceptor + authApi/chatApi/resumeApi
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── data/
│   └── resumes/                    # Drop PDF/DOCX here for batch ingestion
├── docker-compose.yml              # PostgreSQL 17 + pgvector (port 5433)
└── README.md
```

---

## Database Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| candidate_name | VARCHAR(255) | Heuristic: first non-digit line |
| email | VARCHAR(255) | Regex extracted |
| phone | VARCHAR(50) | Regex extracted |
| current_title | VARCHAR(255) | Keyword heuristic (lines 2-12) |
| years_experience | FLOAT | Regex: "X years of experience" patterns |
| skills | TEXT[] | 150+ domain keywords matched (IT, ITES, Marketing, Finance, Banking, Healthcare, Education, Retail, Manufacturing, Logistics, Legal, HR) |
| raw_text | TEXT | Full resume text |
| embedding | vector(384) | BGE-small-en-v1.5 |
| file_name | VARCHAR(255) | Used for deduplication |
| file_type | VARCHAR(10) | 'pdf' or 'docx' |
| created_at | TIMESTAMP | |

**Indexes:** HNSW (cosine, m=16 ef=64) on embedding · GIN on skills · B-tree on years_experience

### users
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(255) | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| created_at | TIMESTAMP | |

### chats
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | CASCADE delete |
| title | VARCHAR(500) | Auto-set from first message (60 chars) |
| created_at | TIMESTAMP | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| chat_id | INTEGER FK → chats | CASCADE delete |
| role | VARCHAR(20) | 'user' or 'assistant' |
| content | TEXT | User: plain JD text · Assistant: JSON string of results |
| created_at | TIMESTAMP | |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user → returns JWT |
| POST | /auth/login | No | Login → returns JWT |
| GET | /auth/me | JWT | Get current user info |

### Chats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /chats | JWT | List all chats for user (newest first) |
| POST | /chats | JWT | Create new chat |
| GET | /chats/{id} | JWT | Get chat + all messages |
| DELETE | /chats/{id} | JWT | Delete chat + messages |
| POST | /chats/{id}/match | JWT | Match JD → saves messages → returns results |

### Resume
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /upload-resume | JWT | Upload PDF/DOCX → ingest into profiles |
| GET | /health | No | Health check |

---

## Environment Variables (backend/.env)

```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=profile_matcher
DB_USER=postgres
DB_PASSWORD=postgres

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION_NAME=ap-south-1

# Change this one line to switch LLM — no code change needed
LLM_MODEL=bedrock/global.anthropic.claude-haiku-4-5-20251001-v1:0

SECRET_KEY=your-jwt-secret-key
```

**Switching LLM examples:**
- `bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0` — Bedrock Sonnet
- `gpt-4o` — OpenAI (add OPENAI_API_KEY)
- `groq/llama-3.3-70b-versatile` — Groq (add GROQ_API_KEY)

---

## How to Run

### Prerequisites
- Docker Desktop running
- Python 3.12 venv at `backend/venv/`
- Node.js installed

### Start Database
```bash
docker-compose up -d
```

### Run DB Migration (first time only)
```bash
docker exec -i profile_matcher_db psql -U postgres profile_matcher < backend/db/migrations/001_add_auth_chat.sql
```

### Start Backend
```bash
cd C:/Users/yuvaraja.g/Documents/Rag
source backend/venv/Scripts/activate      # Git Bash
# OR
backend\venv\Scripts\activate             # PowerShell

uvicorn backend.api.main:app --reload --port 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Batch Ingest Resumes
```bash
# Drop PDF/DOCX files into data/resumes/ then:
source backend/venv/Scripts/activate
python backend/ingest_batch.py
```

### API Docs (Swagger)
```
http://localhost:8000/docs
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| BGE-small-en-v1.5 (384-dim) | Free, local, fast — no API cost for embeddings |
| Asymmetric BGE prefixes | Resume prefix vs JD prefix improves semantic match quality |
| HNSW index (pgvector) | Millisecond ANN search even at 6 lakh resume scale |
| LiteLLM for LLM calls | Swap LLM by changing one env var — no code change |
| Only top 5 get LLM explanation | Controls LLM cost — rest get vector score only |
| min_score=0.30 threshold in matcher | Only profiles with ≥30% cosine similarity are returned — no padding to fill top-K |
| Dedup by file_name + email | Prevents same resume being ingested multiple times |
| Keyword-based skill extraction (POC) | 150+ keywords across 10 domains; no LLM cost at ingestion time |
| JWT in localStorage | Simple auth for POC — upgrade to httpOnly cookies for production |
| ChatGPT-style UI | Natural recruiter UX — paste JD, get results in chat flow |

---

## Frontend Routes

| Route | Component | Auth |
|-------|-----------|------|
| /login | LoginPage | Public only |
| /register | RegisterPage | Public only |
| /chat | ChatPage | Private — redirects to latest chat or creates new |
| /chat/:chatId | ChatPage | Private |

---

## Python Packages

```
fastapi, uvicorn          # Web framework
psycopg2-binary, pgvector # PostgreSQL + vector support
sentence-transformers      # BGE-small embedding model
PyMuPDF, python-docx      # Resume parsing (PDF + DOCX)
litellm                   # LLM abstraction (Bedrock/OpenAI/Groq)
bcrypt, python-jose       # Auth (password hash + JWT)
python-dotenv             # .env loading
python-multipart          # File upload support
```

---

## Scaling Notes (when POC is approved for 6 lakh resumes)

- Move pgvector to AWS RDS (pgvector supported)
- Increase HNSW `ef_construction` and `m` parameters for better recall
- Add async ingestion queue (Celery + Redis) for bulk uploads
- Add pagination to /chats/{id}/match results
- Move JWT to httpOnly cookies for security
- Add role-based access (admin vs recruiter)

## Planned Improvements (post-POC approval)

### LLM-based Skill & Text Extraction
Current skill extraction uses a static keyword list (~150 keywords across 10 domains). This works for POC but misses niche or emerging skills not in the list.

**Planned upgrade — LLM extraction at ingestion:**
```
Resume text → LLM prompt → structured JSON of skills, title, experience
```
- LLM reads the full resume and extracts skills dynamically — no hardcoded list needed
- Works for any domain, any language, niche roles (e.g. ESG Analyst, Prompt Engineer)
- One LLM call per resume ingestion (use a cheap/fast model like Claude Haiku to control cost)
- Also improves `current_title` and `years_experience` extraction accuracy over current regex/heuristic approach
- Implementation: add `llm_extract_metadata(raw_text)` in `backend/ingestion/embedder.py`, call it when keyword skill count < threshold
