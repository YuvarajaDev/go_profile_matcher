import fitz  # PyMuPDF
from docx import Document
import os
import re

TITLE_KEYWORDS = [
    "engineer", "developer", "manager", "analyst", "designer", "architect",
    "consultant", "director", "lead", "senior", "junior", "specialist",
    "scientist", "administrator", "officer", "coordinator", "executive",
    "programmer", "devops", "fullstack", "full stack", "frontend", "backend",
    "qa", "tester", "product", "data", "cloud", "security",
]


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_text(file_path: str) -> tuple[str, str]:
    """Returns (extracted_text, file_type)"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path), "pdf"
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path), "docx"
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def extract_email(text: str) -> str | None:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    match = re.search(r"(\+?\d[\d\s\-().]{8,}\d)", text)
    return match.group(0).strip() if match else None


def extract_name(text: str) -> str | None:
    """Extracts first non-empty line as candidate name (heuristic)."""
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 2 and len(line) < 60 and not any(c.isdigit() for c in line[:5]):
            return line
    return None


def extract_current_title(text: str) -> str | None:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # Skip first line (usually name), scan next ~10 lines for a title-like line
    for line in lines[1:12]:
        if len(line) > 100:
            continue
        if any(c.isdigit() for c in line[:3]):
            continue
        if any(kw in line.lower() for kw in TITLE_KEYWORDS):
            return line
    return None


def extract_years_experience(text: str) -> float | None:
    patterns = [
        r'(\d+)\+?\s*years?\s+of\s+(?:professional\s+|work\s+|total\s+)?experience',
        r'experience\s+of\s+(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s+of\s+(?:professional\s+)?experience',
        r'(\d+)\+?\s*years?\s+experience',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            val = float(match.group(1))
            if 0 < val < 50:
                return val
    return None


def parse_resume(file_path: str) -> dict:
    raw_text, file_type = extract_text(file_path)
    return {
        "raw_text":        raw_text,
        "file_type":       file_type,
        "file_name":       os.path.basename(file_path),
        "email":           extract_email(raw_text),
        "phone":           extract_phone(raw_text),
        "candidate_name":  extract_name(raw_text),
        "current_title":   extract_current_title(raw_text),
        "years_experience": extract_years_experience(raw_text),
    }
