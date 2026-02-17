-- Programmatic SEO bank tables for phrase+entity pages (image-size bank).

CREATE TABLE IF NOT EXISTS pseo_templates (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  bank_slug TEXT NOT NULL,
  phrase TEXT NOT NULL,
  phrase_slug TEXT NOT NULL,
  title_pattern TEXT NOT NULL,
  description_pattern TEXT NOT NULL,
  cta_tool_slug TEXT NOT NULL DEFAULT 'social-media-image-sizes',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pseo_templates_bank_slug
  ON pseo_templates (bank_slug, is_active);

CREATE TABLE IF NOT EXISTS pseo_entities (
  id BIGSERIAL PRIMARY KEY,
  bank_slug TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  search_term TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bank_slug, entity_key)
);

CREATE INDEX IF NOT EXISTS idx_pseo_entities_bank_slug
  ON pseo_entities (bank_slug, is_active, priority);

CREATE TABLE IF NOT EXISTS pseo_pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  bank_slug TEXT NOT NULL,
  template_slug TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  url_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  h1 TEXT NOT NULL,
  intro TEXT NOT NULL,
  body_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_slug TEXT NOT NULL DEFAULT 'social-media-image-sizes',
  hub_path TEXT NOT NULL,
  sibling_slugs TEXT[] NOT NULL DEFAULT '{}'::text[],
  canonical TEXT NOT NULL,
  quality_score INTEGER NOT NULL DEFAULT 0,
  is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
  reason_noindex TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bank_slug, template_slug, entity_key)
);

CREATE INDEX IF NOT EXISTS idx_pseo_pages_bank_slug
  ON pseo_pages (bank_slug, is_indexed);

CREATE INDEX IF NOT EXISTS idx_pseo_pages_template_slug
  ON pseo_pages (template_slug, is_indexed);
