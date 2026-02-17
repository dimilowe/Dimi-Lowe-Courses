import { query } from "../db";
import { unstable_cache } from "next/cache";
import { recordCacheMiss, recordCacheRequest } from "../ops/metrics";

export interface PillarInfo {
  slug: string;
  title: string;
  description: string;
  isIndexed: boolean;
}

const CMS_PILLARS_REVALIDATE_SECONDS = 60 * 60;

type PillarRow = {
  slug: string;
  title: string | null;
  description: string | null;
  is_indexed: boolean | null;
};

const fetchPillarBySlugCached = unstable_cache(
  async (slug: string): Promise<PillarRow | null> => {
    recordCacheMiss("pillar-by-slug");
    const result = await query(
      `SELECT slug, data->>'title' as title, data->>'description' as description, 
              COALESCE((data->>'is_indexed')::boolean, false) as is_indexed
       FROM cms_objects 
       WHERE type = 'pillar' AND slug = $1
       LIMIT 1`,
      [slug]
    );
    return (result.rows[0] as PillarRow | undefined) || null;
  },
  ["pillar-by-slug-v1"],
  { revalidate: CMS_PILLARS_REVALIDATE_SECONDS }
);

const fetchAllIndexedPillarsCached = unstable_cache(
  async (): Promise<PillarRow[]> => {
    recordCacheMiss("pillars-indexed");
    const result = await query(
      `SELECT slug, data->>'title' as title, data->>'description' as description,
              COALESCE((data->>'is_indexed')::boolean, false) as is_indexed
       FROM cms_objects 
       WHERE type = 'pillar' AND COALESCE((data->>'is_indexed')::boolean, false) = true
       ORDER BY data->>'title' ASC`
    );
    return result.rows as PillarRow[];
  },
  ["pillars-indexed-v1"],
  { revalidate: CMS_PILLARS_REVALIDATE_SECONDS }
);

const fetchRelatedPillarsCached = unstable_cache(
  async (currentSlug: string): Promise<PillarRow[]> => {
    recordCacheMiss("pillars-related");
    const result = await query(
      `SELECT slug, data->>'title' as title, data->>'description' as description,
              COALESCE((data->>'is_indexed')::boolean, false) as is_indexed
       FROM cms_objects 
       WHERE type = 'pillar' 
         AND slug != $1 
         AND COALESCE((data->>'is_indexed')::boolean, false) = true
       ORDER BY data->>'title' ASC`,
      [currentSlug]
    );
    return result.rows as PillarRow[];
  },
  ["pillars-related-v1"],
  { revalidate: CMS_PILLARS_REVALIDATE_SECONDS }
);

function mapPillarRow(row: PillarRow): PillarInfo {
  return {
    slug: row.slug,
    title: row.title || row.slug,
    description: row.description || "",
    isIndexed: !!row.is_indexed,
  };
}

export async function getPillarBySlug(slug: string): Promise<PillarInfo | null> {
  recordCacheRequest("pillar-by-slug");
  const row = await fetchPillarBySlugCached(slug);
  return row ? mapPillarRow(row) : null;
}

export async function getAllIndexedPillars(): Promise<PillarInfo[]> {
  recordCacheRequest("pillars-indexed");
  const rows = await fetchAllIndexedPillarsCached();
  return rows.map(mapPillarRow);
}

export async function getRelatedPillars(currentSlug: string): Promise<PillarInfo[]> {
  recordCacheRequest("pillars-related");
  const rows = await fetchRelatedPillarsCached(currentSlug);
  return rows.map(mapPillarRow);
}
