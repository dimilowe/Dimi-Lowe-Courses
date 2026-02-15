-- Brand Access tables and indexes
CREATE TABLE IF NOT EXISTS brand_access_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  website_url text,
  contact_url text NOT NULL,
  contact_type text NOT NULL DEFAULT 'brand',
  tags text[] DEFAULT '{}',
  notes text,
  country text,
  city text,
  source text DEFAULT 'curated',
  last_verified date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_brand_name text NOT NULL,
  requested_website_url text,
  request_reason text,
  user_email text,
  user_id integer,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_access_entries_brand_name_lower
  ON brand_access_entries (lower(brand_name));
CREATE INDEX IF NOT EXISTS idx_brand_access_entries_contact_type
  ON brand_access_entries (contact_type);
CREATE INDEX IF NOT EXISTS idx_brand_access_entries_is_active
  ON brand_access_entries (is_active);
CREATE INDEX IF NOT EXISTS idx_brand_access_requests_status
  ON brand_access_requests (status);
CREATE INDEX IF NOT EXISTS idx_brand_access_requests_user_id
  ON brand_access_requests (user_id);

