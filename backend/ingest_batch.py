"""Run this script to batch-ingest all resumes from data/resumes/"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ingestion.embedder import ingest_all

if __name__ == "__main__":
    resume_dir = os.path.join(os.path.dirname(__file__), "..", "data", "resumes")
    ingest_all(os.path.abspath(resume_dir))
