-- Alter users table to track generation credits
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS generation_credits INTEGER DEFAULT 10 NOT NULL;

-- Local fallback authentication credentials table
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL
);
