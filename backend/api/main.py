from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import tempfile

from backend.ingestion.embedder import ingest_resume
from backend.auth.auth import get_current_user
from backend.api.routes.auth import router as auth_router
from backend.api.routes.chat import router as chat_router

app = FastAPI(title="GO Profile Matcher AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    allowed = {".pdf", ".docx", ".doc"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        ingest_resume(tmp_path)
    finally:
        os.unlink(tmp_path)

    return {"message": f"Resume '{file.filename}' ingested successfully."}
