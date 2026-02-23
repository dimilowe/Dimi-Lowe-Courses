CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS workspace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  cloud_id VARCHAR,
  tool_id VARCHAR,
  preview_text TEXT,
  payload_json JSONB,
  file_url TEXT,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  workflow_id VARCHAR,
  thumbnail_url TEXT,
  last_opened_at TIMESTAMPTZ,
  origin_cloud_id TEXT,
  CONSTRAINT workspace_items_cloud_id_check CHECK (
    cloud_id IS NULL
    OR cloud_id = ANY (
      ARRAY[
        'creation',
        'video',
        'writing-seo',
        'file-data',
        'monetize',
        'intelligence',
        'music-performance',
        'growth-distribution'
      ]::TEXT[]
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_workspace_items_user ON workspace_items(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_user_cloud ON workspace_items(user_id, cloud_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_user_created ON workspace_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_items_user_starred ON workspace_items(user_id, is_starred);
CREATE INDEX IF NOT EXISTS workspace_items_user_recent_idx
  ON workspace_items(user_id, last_opened_at DESC, updated_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS workspace_items_user_cloud_recent_idx
  ON workspace_items(user_id, cloud_id, last_opened_at DESC, updated_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS workspace_items_user_origin_recent_idx
  ON workspace_items(user_id, origin_cloud_id, last_opened_at DESC, updated_at DESC, created_at DESC);
