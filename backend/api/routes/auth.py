from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.db.database import get_cursor
from backend.auth.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    with get_cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(req.password)
        cur.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id, name, email",
            (req.name, req.email, hashed),
        )
        user = dict(cur.fetchone())
    token = create_access_token(user["id"], user["email"], user["name"])
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login")
def login(req: LoginRequest):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = %s", (req.email,)
        )
        row = cur.fetchone()
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = {"id": row["id"], "name": row["name"], "email": row["email"]}
    token = create_access_token(user["id"], user["email"], user["name"])
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me")
def me(user=Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute("SELECT id, name, email, created_at FROM users WHERE id = %s", (user["id"],))
        return dict(cur.fetchone())
