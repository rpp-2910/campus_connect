-- 001_phase1_ownership_and_roles.sql
-- Phase 1 Migration: Add role column to users and add indexes for ownership and lookup performance

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Ensure existing users have a valid role
UPDATE users SET role = 'student' WHERE role IS NULL;

-- Indexes for performance and foreign key lookups
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_user ON votes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON post_attachments(post_id);
