-- Migration to support Epic 7 Advanced Canvas v2
ALTER TABLE canvas_projects 
  ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT 'square',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_brief TEXT,
  ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_canvas_projects_user_id ON canvas_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_projects_updated_at ON canvas_projects(updated_at DESC);
