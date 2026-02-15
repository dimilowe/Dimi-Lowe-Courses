-- Ensure tools soft-delete column exists for directory/query filters.
ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tools_deleted_at ON tools (deleted_at);

