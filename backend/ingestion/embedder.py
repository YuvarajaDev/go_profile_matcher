from backend.ml.model import get_model
from backend.db.database import get_cursor
from backend.ingestion.parser import parse_resume
import os
import glob

SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "react", "node", "angular",
    "vue", "sql", "postgresql", "mysql", "mongodb", "aws", "azure", "gcp",
    "docker", "kubernetes", "fastapi", "django", "flask", "machine learning",
    "deep learning", "nlp", "data science", "tensorflow", "pytorch", "spark",
    "hadoop", "kafka", "redis", "elasticsearch", "git", "ci/cd", "devops",
    "rest api", "graphql", "html", "css", "linux", "agile", "scrum",
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
    skills = extract_skills(parsed["raw_text"])

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
                parsed["current_title"],
                parsed["years_experience"],
                skills,
                parsed["raw_text"],
                embedding,
                parsed["file_name"],
                parsed["file_type"],
            ),
        )
        row = cur.fetchone()
        print(f"Ingested: {parsed['file_name']} → profile id {row['id']}")


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

    print("Ingestion complete.")
