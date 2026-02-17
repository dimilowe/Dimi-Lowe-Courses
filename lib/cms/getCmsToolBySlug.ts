import { query } from "../db";
import { unstable_cache } from "next/cache";
import type { CloudSlug } from "../clouds";
import { recordCacheMiss, recordCacheRequest } from "../ops/metrics";

export interface ToolEngineConfig {
  engine: string;
  preset?: string;
  mode?: string;
}

export interface ToolSeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ToolMonetization {
  type: 'free' | 'paid' | 'freemium';
  price_id?: string;
  offer_key?: string;
}

export interface CmsToolData {
  slug: string;
  type: 'tool';
  title: string;
  description: string;
  isIndexed: boolean;
  engine_config: ToolEngineConfig;
  seo?: ToolSeoConfig;
  monetization?: ToolMonetization;
  interlink_parent?: string;
  interlink_siblings?: string[];
  interlink_tools?: string[];
}

export interface CmsToolRecord {
  id: number;
  slug: string;
  type: 'tool';
  cluster_slug: string | null;
  data: CmsToolData;
  word_count: number;
  health: 'thin' | 'ok' | 'strong';
  created_at: Date;
  updated_at: Date;
}

export interface ToolForRenderer {
  slug: string;
  name: string;
  description: string;
  engine: string;
  preset?: string;
  mode?: string;
  isIndexed: boolean;
  pillarSlug?: string | null;
  clusterSlug?: string | null;
  cloudTags?: CloudSlug[];
  seo?: ToolSeoConfig;
  monetization?: ToolMonetization;
  interlinkParent?: string;
  interlinkSiblings?: string[];
  interlinkTools?: string[];
  requiredClouds?: string[];
  requiredTier?: string;
}

export const ENGINE_TO_CATEGORY: Record<string, { label: string; key: string }> = {
  'zip': { label: 'File Tools', key: 'file' },
  'calculator': { label: 'Calculators', key: 'calculators' },
  'platform-resizer': { label: 'Image Tools', key: 'image' },
  'image-compress': { label: 'Image Tools', key: 'image' },
  'image-convert': { label: 'Image Tools', key: 'image' },
  'text-transform': { label: 'Writing Tools', key: 'writing' },
  'text-analysis': { label: 'Writing Tools', key: 'writing' },
  'ai-analysis': { label: 'AI Tools', key: 'ai' },
  'ai-generate': { label: 'AI Tools', key: 'ai' },
  'file-convert': { label: 'File Tools', key: 'file' },
  'file-edit': { label: 'File Tools', key: 'file' },
  'community': { label: 'Creator Tools', key: 'creator' },
  'static': { label: 'Utilities', key: 'utilities' },
  'standalone': { label: 'Creator Tools', key: 'creator' },
  'outfit': { label: 'AI Tools', key: 'ai' },
  'price-engine': { label: 'Shopping Tools', key: 'shopping' },
};

const CMS_TOOLS_REVALIDATE_SECONDS = 60 * 60;

type CmsToolRow = {
  slug: string;
  pillar_slug: string | null;
  cluster_slug: string | null;
  cloud_tags: CloudSlug[] | null;
  data: CmsToolData;
};

const fetchCmsToolRowBySlugCached = unstable_cache(
  async (slug: string): Promise<CmsToolRow | null> => {
    recordCacheMiss("cms-tool-row-by-slug");
    const result = await query(
      `SELECT id, slug, type, pillar_slug, cluster_slug, COALESCE(cloud_tags, '{}') AS cloud_tags, data, word_count, health, created_at, updated_at
       FROM cms_objects
       WHERE type = 'tool' AND slug = $1
       LIMIT 1`,
      [slug]
    );
    return (result.rows[0] as CmsToolRow | undefined) || null;
  },
  ["cms-tool-row-by-slug-v1"],
  { revalidate: CMS_TOOLS_REVALIDATE_SECONDS }
);

const fetchAllCmsToolRowsCached = unstable_cache(
  async (): Promise<CmsToolRow[]> => {
    recordCacheMiss("cms-tools-all-rows");
    const result = await query(
      `SELECT id, slug, type, pillar_slug, cluster_slug, COALESCE(cloud_tags, '{}') AS cloud_tags, data, word_count, health, created_at, updated_at
       FROM cms_objects
       WHERE type = 'tool'
       ORDER BY slug ASC`
    );
    return result.rows as CmsToolRow[];
  },
  ["cms-tools-all-rows-v1"],
  { revalidate: CMS_TOOLS_REVALIDATE_SECONDS }
);

const fetchIndexedCmsToolRowsCached = unstable_cache(
  async (): Promise<CmsToolRow[]> => {
    recordCacheMiss("cms-tools-indexed-rows");
    const result = await query(
      `SELECT id, slug, type, pillar_slug, cluster_slug, COALESCE(cloud_tags, '{}') AS cloud_tags, data, word_count, health, created_at, updated_at
       FROM cms_objects
       WHERE type = 'tool'
         AND (data->>'isIndexed')::boolean = true
       ORDER BY slug ASC`
    );
    return result.rows as CmsToolRow[];
  },
  ["cms-tools-indexed-rows-v1"],
  { revalidate: CMS_TOOLS_REVALIDATE_SECONDS }
);

function mapCmsToolRowToRenderer(row: CmsToolRow): ToolForRenderer {
  const data = row.data as CmsToolData;
  return {
    slug: row.slug,
    name: data.title,
    description: data.description,
    engine: data.engine_config?.engine || "",
    preset: data.engine_config?.preset,
    mode: data.engine_config?.mode,
    isIndexed: data.isIndexed ?? false,
    pillarSlug: row.pillar_slug,
    clusterSlug: row.cluster_slug,
    cloudTags: (row.cloud_tags ?? []) as CloudSlug[],
    seo: data.seo,
    monetization: data.monetization,
    interlinkParent: data.interlink_parent,
    interlinkSiblings: data.interlink_siblings,
    interlinkTools: data.interlink_tools,
  };
}

export async function getCmsToolBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<ToolForRenderer | null> {
  recordCacheRequest("cms-tool-row-by-slug");
  const row = await fetchCmsToolRowBySlugCached(slug);
  if (!row) {
    return null;
  }
  const data = row.data as CmsToolData;
  const isIndexed = data.isIndexed ?? false;
  if (!options?.includeDrafts && !isIndexed) {
    return null;
  }
  return mapCmsToolRowToRenderer(row);
}

export async function getAllCmsTools(
  options?: { includeDrafts?: boolean }
): Promise<ToolForRenderer[]> {
  recordCacheRequest(options?.includeDrafts ? "cms-tools-all-rows" : "cms-tools-indexed-rows");
  const rows = options?.includeDrafts
    ? await fetchAllCmsToolRowsCached()
    : await fetchIndexedCmsToolRowsCached();
  return rows.map(mapCmsToolRowToRenderer);
}
