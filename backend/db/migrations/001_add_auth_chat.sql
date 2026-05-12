-- Run this against existing DB to add auth + chat history tables

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(500) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    chat_id    INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats (user_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
