-- Backfill missing timestamp columns on global_urls for older databases.
ALTER TABLE IF EXISTS global_urls
  ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS global_urls
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

