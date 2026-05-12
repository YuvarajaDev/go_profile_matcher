from backend.ml.model import get_model
from backend.db.database import get_cursor


def embed_jd(jd_text: str) -> list[float]:
    prefixed = f"Represent this job description for retrieval: {jd_text[:2000]}"
    return get_model().encode(prefixed).tolist()


def match_profiles(jd_text: str, top_k: int = 10, min_experience: float = None) -> list[dict]:
    query_embedding = embed_jd(jd_text)

    filters = ""
    params = [query_embedding, top_k]

    if min_experience is not None:
        filters = "WHERE years_experience >= %s"
        params = [query_embedding, min_experience, top_k]

    query = f"""
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
        {filters}
        ORDER BY similarity_score DESC
        LIMIT %s
    """

    with get_cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()

    return [dict(row) for row in results]
