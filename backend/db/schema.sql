-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Main profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id              SERIAL PRIMARY KEY,
    candidate_name  VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    current_title   VARCHAR(255),
    years_experience FLOAT,
    skills          TEXT[],               -- parsed skill tags
    raw_text        TEXT NOT NULL,        -- full resume text
    embedding       vector(384),          -- BGE-small-en embedding dimension
    file_name       VARCHAR(255),
    file_type       VARCHAR(10),          -- 'pdf' or 'docx'
    created_at      TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS profiles_embedding_idx
    ON profiles
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Index for filtering queries
CREATE INDEX IF NOT EXISTS profiles_skills_idx ON profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS profiles_experience_idx ON profiles (years_experience);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(500) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    chat_id    INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats (user_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
