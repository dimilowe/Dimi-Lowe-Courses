ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

UPDATE users
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL
   OR btrim(subscription_tier) = '';

ALTER TABLE users
  ALTER COLUMN subscription_tier SET DEFAULT 'free';

ALTER TABLE users
  ALTER COLUMN subscription_tier SET NOT NULL;
