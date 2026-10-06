-- Initial schema migration for users and credit limits

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  phase VARCHAR(50) DEFAULT 'phase_1' NOT NULL
);
