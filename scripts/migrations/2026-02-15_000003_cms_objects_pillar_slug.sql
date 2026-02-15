-- Standardize pillar membership on pillar_slug across tools/cms objects.
ALTER TABLE cms_objects ADD COLUMN IF NOT EXISTS pillar_slug TEXT;

UPDATE cms_objects
SET pillar_slug = cluster_slug
WHERE pillar_slug IS NULL
  AND cluster_slug IS NOT NULL;

