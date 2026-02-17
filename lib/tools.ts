import { query } from "./db";
import { unstable_cache } from "next/cache";
import { recordCacheMiss, recordCacheRequest } from "./ops/metrics";

export type CmsToolSummary = {
  slug: string;
  title: string;
};

const CMS_TOOL_SUMMARY_REVALIDATE_SECONDS = 60 * 60;

type CmsToolSummaryRow = {
  slug: string;
  title: string | null;
};

const fetchAllCmsToolSummariesCached = unstable_cache(
  async (): Promise<CmsToolSummaryRow[]> => {
    recordCacheMiss("cms-tool-summaries-all");
    const result = await query(
      `SELECT slug, data->>'title' as title
       FROM cms_objects
       WHERE type = 'tool'
       ORDER BY created_at ASC`
    );
    return result.rows as CmsToolSummaryRow[];
  },
  ["cms-tool-summaries-all-v1"],
  { revalidate: CMS_TOOL_SUMMARY_REVALIDATE_SECONDS }
);

const fetchFeaturedCmsToolSummariesCached = unstable_cache(
  async (): Promise<CmsToolSummaryRow[]> => {
    recordCacheMiss("cms-tool-summaries-featured");
    const result = await query(
      `SELECT slug, data->>'title' as title
       FROM cms_objects
       WHERE type = 'tool' AND featured = true
       ORDER BY created_at ASC`
    );
    return result.rows as CmsToolSummaryRow[];
  },
  ["cms-tool-summaries-featured-v1"],
  { revalidate: CMS_TOOL_SUMMARY_REVALIDATE_SECONDS }
);

export async function getAllCmsTools(): Promise<CmsToolSummary[]> {
  recordCacheRequest("cms-tool-summaries-all");
  const rows = await fetchAllCmsToolSummariesCached();
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title || row.slug,
  }));
}

export async function getFeaturedTools(): Promise<CmsToolSummary[]> {
  recordCacheRequest("cms-tool-summaries-featured");
  const rows = await fetchFeaturedCmsToolSummariesCached();
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title || row.slug,
  }));
}
