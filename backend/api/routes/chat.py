from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.db.database import get_cursor
from backend.auth.auth import get_current_user
from backend.retrieval.matcher import match_profiles
from backend.llm.ranker import rank_and_explain, route_message
import json

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("")
def list_chats(user=Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id, title, created_at FROM chats WHERE user_id = %s ORDER BY created_at DESC",
            (user["id"],),
        )
        return [dict(r) for r in cur.fetchall()]


@router.post("")
def create_chat(user=Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO chats (user_id, title) VALUES (%s, %s) RETURNING id, title, created_at",
            (user["id"], "New Chat"),
        )
        return dict(cur.fetchone())


@router.get("/{chat_id}")
def get_chat(chat_id: str, user=Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id FROM chats WHERE id = %s AND user_id = %s", (chat_id, user["id"])
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Chat not found")
        cur.execute(
            "SELECT id, role, content, created_at FROM messages WHERE chat_id = %s ORDER BY created_at ASC",
            (chat_id,),
        )
        messages = []
        for row in cur.fetchall():
            row = dict(row)
            if row["role"] == "assistant":
                try:
                    row["content"] = json.loads(row["content"])
                except Exception:
                    pass
            messages.append(row)
    return {"chat_id": chat_id, "messages": messages}


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user=Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "DELETE FROM chats WHERE id = %s AND user_id = %s", (chat_id, user["id"])
        )
    return {"message": "Chat deleted"}


class MessageRequest(BaseModel):
    message: str
    top_k: int = 5


@router.post("/{chat_id}/message")
def message_in_chat(chat_id: str, req: MessageRequest, user=Depends(get_current_user)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    with get_cursor() as cur:
        cur.execute(
            "SELECT id, title FROM chats WHERE id = %s AND user_id = %s", (chat_id, user["id"])
        )
        chat = cur.fetchone()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        chat = dict(chat)

    # Save user message
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO messages (chat_id, role, content) VALUES (%s, %s, %s)",
            (chat_id, "user", req.message),
        )

    # Auto-title chat from first message
    if chat["title"] == "New Chat":
        title = req.message[:60].strip()
        with get_cursor() as cur:
            cur.execute("UPDATE chats SET title = %s WHERE id = %s", (title, chat_id))

    # LLM decides: conversational reply or candidate search
    routed = route_message(req.message)

    if routed["intent"] == "search":
        candidates = match_profiles(
            routed["query"],
            top_k=req.top_k,
            min_experience=routed.get("min_experience"),
        )
        if candidates:
            candidates = rank_and_explain(routed["query"], candidates, explain_top=5)
            for c in candidates:
                c["similarity_score"] = round(c["similarity_score"] * 100, 1)
                c.pop("raw_text", None)
        result = {"type": "results", "results": candidates or [], "total": len(candidates or [])}
    else:
        result = {"type": "message", "content": routed["content"]}

    # Save assistant response
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO messages (chat_id, role, content) VALUES (%s, %s, %s)",
            (chat_id, "assistant", json.dumps(result)),
        )

    return result
