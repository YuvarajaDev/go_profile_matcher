-- Migration 002: Change chats.id and messages.id from SERIAL to UUID
-- Profiles table is NOT touched — only chats and messages are recreated.
-- Run: docker exec -i profile_matcher_db psql -U postgres profile_matcher < backend/db/migrations/002_uuid_chat_ids.sql

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;

CREATE TABLE chats (

    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(500) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id    UUID REFERENCES chats(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,

    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats (user_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
