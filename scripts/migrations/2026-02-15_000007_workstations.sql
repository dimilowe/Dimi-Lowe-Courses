-- Modular Workstations: user-defined tool stacks

CREATE TABLE IF NOT EXISTS workstations (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_workstations_user_slug
  ON workstations (user_id, slug);

CREATE INDEX IF NOT EXISTS idx_workstations_user_updated
  ON workstations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS workstation_widgets (
  id BIGSERIAL PRIMARY KEY,
  workstation_id BIGINT NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workstation_widgets_station_pos
  ON workstation_widgets (workstation_id, position ASC, id ASC);

