from backend.ml.model import get_model
from backend.db.database import get_cursor


def embed_jd(jd_text: str) -> list[float]:
    prefixed = f"Represent this job description for retrieval: {jd_text[:2000]}"
    return get_model().encode(prefixed).tolist()


def match_profiles(
    jd_text: str,
    top_k: int = 5,
    min_experience: float = None,
    min_score: float = 0.60,
) -> list[dict]:
    query_embedding = embed_jd(jd_text)

    experience_filter = ""
    if min_experience is not None:
        experience_filter = "WHERE years_experience >= %s"

    query = f"""
        SELECT * FROM (
            SELECT
                id,
                candidate_name,
                email,
                phone,
                current_title,
                years_experience,
                skills,
                raw_text,
                file_name,
                1 - (embedding <=> %s::vector) AS similarity_score
            FROM profiles
            {experience_filter}
        ) ranked
        WHERE similarity_score >= %s
        ORDER BY similarity_score DESC
        LIMIT %s
    """

    if min_experience is not None:
        params = [query_embedding, min_experience, min_score, top_k]
    else:
        params = [query_embedding, min_score, top_k]

    with get_cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()

    return [dict(row) for row in results]
