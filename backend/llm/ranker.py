import json
import litellm
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# To switch LLM: just update LLM_MODEL in your .env file — no code change needed
LLM_MODEL = os.getenv("LLM_MODEL", "bedrock/global.anthropic.claude-haiku-4-5-20251001-v1:0")

_SYSTEM_PROMPT = """You are GO Profile Matcher AI, a recruiting assistant for Golden Opportunities Pvt Ltd.

You have access to a resume database with candidate profiles. You can either:
1. Search for matching candidates — call the search_candidates tool when the user provides a job description, lists required skills, names a role, or uses words like find/search/match/hire/looking for/need a.
2. Respond conversationally — for greetings (hi, hello, hey), thanks, questions about what you can do, or any unclear message. In that case reply warmly and guide them to paste a JD or describe the profile they need.

Never call the search tool for casual messages. Never respond with text when a clear search intent is present."""

_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_candidates",
        "description": (
            "Search the resume database for candidates matching a job description, "
            "skill set, or role requirements. Call this whenever the user wants to "
            "find, match, or hire someone."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The job description, required skills, or role description to search for",
                },
                "min_experience": {
                    "type": "number",
                    "description": "Minimum years of experience required (omit if not mentioned)",
                },
            },
            "required": ["query"],
        },
    },
}


def route_message(user_message: str) -> dict:
    """LLM decides: respond conversationally OR invoke search_candidates tool.

    Returns one of:
      {"intent": "search",  "query": "...", "min_experience": float|None}
      {"intent": "message", "content": "..."}
    """
    response = litellm.completion(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        tools=[_SEARCH_TOOL],
        tool_choice="auto",
        max_tokens=400,
        temperature=0.3,
    )

    choice = response.choices[0]

    if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
        args = json.loads(choice.message.tool_calls[0].function.arguments)
        return {
            "intent": "search",
            "query": args.get("query", user_message),
            "min_experience": args.get("min_experience"),
        }

    return {
        "intent": "message",
        "content": choice.message.content.strip(),
    }


def explain_match(jd_text: str, candidate: dict) -> str:
    prompt = f"""You are an expert recruiter AI assistant.

Job Description:
{jd_text[:1500]}

Candidate Resume (excerpt):
{candidate['raw_text'][:1500]}

Candidate Skills: {', '.join(candidate.get('skills') or [])}
Match Score: {round(candidate['similarity_score'] * 100, 1)}%

In 3-4 concise bullet points, explain:
- Why this candidate is a good match
- Key strengths relevant to this JD
- Any potential gaps

Be specific and actionable. No fluff."""

    response = litellm.completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def rank_and_explain(jd_text: str, candidates: list[dict], explain_top: int = 5) -> list[dict]:
    """Add LLM explanation to top N candidates, return full ranked list."""
    for i, candidate in enumerate(candidates):
        if i < explain_top:
            candidate["explanation"] = explain_match(jd_text, candidate)
        else:
            candidate["explanation"] = None
    return candidates
