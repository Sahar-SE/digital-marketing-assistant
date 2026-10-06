-- Migration to support Epic 4: Self-Growing Prompt Library & Publishing states

ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' NOT NULL;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
