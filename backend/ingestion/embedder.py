from backend.ml.model import get_model
from backend.db.database import get_cursor
from backend.ingestion.parser import parse_resume
from backend.llm.ranker import extract_profile_metadata
import os
import glob
import time

SKILL_KEYWORDS = [
    # ── IT / Software ────────────────────────────────────────────────────
    # Languages & frameworks
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "fastapi", "django", "flask", "spring boot", "dotnet", "c#",
    "golang", "rust", "php", "html", "css", "sass",
    # Databases
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "dynamodb", "cassandra", "oracle", "sqlite",
    # Cloud & infra
    "aws", "azure", "gcp", "terraform", "ansible", "helm", "cloudformation",
    "ec2", "s3", "lambda", "vpc", "iam", "rds", "load balancing",
    "high availability", "disaster recovery", "cloud architecture",
    "infrastructure as code", "cost optimization",
    # DevOps & containers
    "docker", "kubernetes", "ci/cd", "jenkins", "github actions", "gitlab ci",
    "prometheus", "grafana", "elk stack", "linux", "bash", "devops",
    # ML / Data
    "machine learning", "deep learning", "nlp", "data science", "tensorflow",
    "pytorch", "spark", "hadoop", "kafka", "data engineering",
    # APIs & architecture
    "rest api", "graphql", "microservices", "event driven", "system design",
    # Tooling
    "git", "agile", "scrum", "jira", "webpack", "vite", "figma",
    "responsive design",

    # ── ITES / BPO ───────────────────────────────────────────────────────
    "quality assurance", "call center", "bpo", "six sigma", "lean",
    "process improvement", "kpi", "sla", "coaching", "calibration",
    "csat", "nps", "workforce management", "avaya", "nice", "verint",
    "zendesk", "salesforce", "crm", "data entry", "email management",
    "scheduling", "calendar management", "ms office", "google workspace",
    "zoom", "slack", "customer support", "transcription", "administrative support",
    "virtual assistant", "ticket management",

    # ── Marketing ────────────────────────────────────────────────────────
    "social media", "facebook ads", "instagram", "linkedin", "content creation",
    "canva", "hootsuite", "buffer", "meta ads", "tiktok", "youtube",
    "influencer marketing", "brand awareness", "content strategy",
    "content marketing", "seo", "sem", "google analytics", "google ads",
    "google search console", "keyword research", "on-page seo", "off-page seo",
    "link building", "backlinks", "semrush", "ahrefs", "moz", "wordpress",
    "ppc", "digital marketing", "email marketing", "marketing automation",
    "hubspot", "mailchimp", "brand management", "market research",

    # ── Finance ──────────────────────────────────────────────────────────
    "financial modeling", "valuation", "dcf", "mergers and acquisitions",
    "m&a", "ipo", "private equity", "equity research", "bloomberg",
    "capital markets", "pitch deck", "due diligence", "lbo",
    "leveraged buyout", "accounts payable", "accounts receivable",
    "bookkeeping", "tally", "quickbooks", "sap", "invoice processing",
    "reconciliation", "gst", "tds", "ms excel", "erp", "financial analysis",
    "budgeting", "forecasting", "p&l", "ifrs", "gaap", "taxation",

    # ── Banking ──────────────────────────────────────────────────────────
    "retail banking", "branch management", "relationship management",
    "kyc", "aml", "compliance", "credit appraisal", "loans", "deposits",
    "rbi guidelines", "nbfc", "loan processing", "credit analysis",
    "underwriting", "mortgage", "home loan", "personal loan", "business loan",
    "cibil", "credit score", "trade finance", "treasury", "forex",
    "banking operations", "npa management", "cross selling",

    # ── Healthcare ───────────────────────────────────────────────────────
    "hospital administration", "healthcare management", "jci", "nabh",
    "patient care", "clinical governance", "medical records",
    "healthcare regulations", "insurance claims", "revenue cycle",
    "medical coding", "icd-10", "cpt", "hcpcs", "medical billing",
    "ehr", "epic", "cerner", "hipaa", "medical terminology", "anatomy",
    "clinical documentation", "coding audit", "pharmacy management",
    "nursing management", "infection control",

    # ── Education ────────────────────────────────────────────────────────
    "school administration", "curriculum development", "teacher training",
    "academic planning", "cbse", "icse", "ib", "student management",
    "educational leadership", "accreditation", "instructional design",
    "e-learning", "lms", "articulate storyline", "adobe captivate",
    "addie", "curriculum design", "training development", "moodle",
    "blended learning", "learning objectives", "assessment design",

    # ── Retail ───────────────────────────────────────────────────────────
    "retail management", "store operations", "inventory management",
    "visual merchandising", "pos", "sales targets", "shrinkage",
    "planogram", "vendor management", "footfall", "category management",
    "merchandising", "customer experience",

    # ── Manufacturing ────────────────────────────────────────────────────
    "production planning", "quality control", "iso", "lean manufacturing",
    "five s", "kaizen", "oee", "safety management", "line supervision",
    "capacity planning", "preventive maintenance", "six sigma",
    "industrial engineering", "bom", "mrp", "autocad", "solidworks",

    # ── Logistics / Supply Chain ─────────────────────────────────────────
    "supply chain management", "logistics", "procurement", "warehouse management",
    "demand planning", "freight", "customs", "import export", "last mile delivery",
    "3pl", "wms", "fleet management", "incoterms", "contract negotiation",
    "vendor development", "purchase management",

    # ── Legal ────────────────────────────────────────────────────────────
    "corporate law", "contract drafting", "legal advisory", "compliance",
    "intellectual property", "company law", "sebi", "arbitration",
    "litigation", "companies act", "legal research", "due diligence",
    "mergers acquisitions", "employment law", "trademark", "patent",
    "legal documentation", "court filings",

    # ── HR ───────────────────────────────────────────────────────────────
    "talent acquisition", "recruitment", "sourcing", "linkedin recruiter",
    "naukri", "applicant tracking system", "ats", "onboarding",
    "hr policies", "compensation", "benefits", "employee engagement",
    "hris", "workday", "successfactors", "performance management",
    "exit management", "training and development", "learning and development",
    "hr analytics", "payroll", "statutory compliance", "pf", "esi",
    "background verification", "employer branding",
]


def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    return [skill for skill in SKILL_KEYWORDS if skill in text_lower]


def embed_text(text: str) -> list[float]:
    # BGE models work best with this prefix for asymmetric search
    prefixed = f"Represent this resume for retrieval: {text[:2000]}"
    return get_model().encode(prefixed).tolist()


def _is_duplicate(file_name: str, email: str | None) -> bool:
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM profiles WHERE file_name = %s LIMIT 1", (file_name,))
        if cur.fetchone():
            return True
        if email:
            cur.execute("SELECT 1 FROM profiles WHERE email = %s LIMIT 1", (email,))
            if cur.fetchone():
                return True
    return False


def ingest_resume(file_path: str):
    parsed = parse_resume(file_path)

    if _is_duplicate(parsed["file_name"], parsed.get("email")):
        print(f"Skipping duplicate: {parsed['file_name']}")
        return

    embedding = embed_text(parsed["raw_text"])

    # LLM extraction — falls back to keyword scan if LLM fails
    print(f"  Extracting metadata via LLM for {parsed['file_name']}...")
    llm_meta = extract_profile_metadata(parsed["raw_text"])

    skills = llm_meta.get("skills") or extract_skills(parsed["raw_text"])

    # Use LLM values for title/experience only when parser's heuristic missed them
    current_title = parsed["current_title"] or llm_meta.get("current_title")
    years_experience = parsed["years_experience"] or llm_meta.get("years_experience")

    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO profiles
                (candidate_name, email, phone, current_title, years_experience,
                 skills, raw_text, embedding, file_name, file_type)
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                parsed["candidate_name"],
                parsed["email"],
                parsed["phone"],
                current_title,
                years_experience,
                skills,
                parsed["raw_text"],
                embedding,
                parsed["file_name"],
                parsed["file_type"],
            ),
        )
        row = cur.fetchone()
        print(f"Ingested: {parsed['file_name']} → profile id {row['id']} | skills: {len(skills)}")


def ingest_all(resume_dir: str):
    patterns = ["*.pdf", "*.docx", "*.doc"]
    files = []
    for pattern in patterns:
        files.extend(glob.glob(os.path.join(resume_dir, pattern)))

    print(f"Found {len(files)} resumes to ingest...")
    for i, file_path in enumerate(files, 1):
        try:
            ingest_resume(file_path)
            print(f"[{i}/{len(files)}] Done")
        except Exception as e:
            print(f"[{i}/{len(files)}] FAILED {file_path}: {e}")
        # Pace requests to stay within Bedrock rate limits
        if i < len(files):
            time.sleep(2)

    print("Ingestion complete.")
