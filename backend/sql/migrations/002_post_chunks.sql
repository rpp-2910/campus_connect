-- 002_post_chunks.sql
-- Migration: Add post_chunks table for chunk-based embeddings in pgvector

CREATE TABLE IF NOT EXISTS post_chunks (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(3072) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_post_chunk_order UNIQUE (post_id, chunk_index)
);

-- Index for foreign key lookups and cascading deletes
CREATE INDEX IF NOT EXISTS idx_post_chunks_post_id ON post_chunks(post_id);
