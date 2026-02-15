-- Backfill missing tools columns for older databases.
ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS required_clouds TEXT[] DEFAULT '{}'::text[];

ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS required_tier TEXT DEFAULT 'free';

ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS in_directory BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS tools
  ADD COLUMN IF NOT EXISTS icon_bg TEXT;

