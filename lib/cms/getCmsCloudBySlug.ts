import { pool } from "@/lib/db";
import type { CMSObject, CloudDashboardEngineConfig } from "@/lib/types/cms";

export type CloudForRenderer = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  engine: string;
  engineConfig: CloudDashboardEngineConfig;
};

export async function getCmsCloudBySlug(slug: string): Promise<CloudForRenderer | null> {
  const result = await pool.query(
    `SELECT 
      slug,
      data->>'title' as title,
      data->>'description' as description,
      COALESCE(data->>'seo_title', data->>'title') as seo_title,
      COALESCE(data->>'seo_description', data->>'description') as seo_description,
      engine,
      engine_config
    FROM cms_objects
    WHERE slug = $1 AND type = 'cloud_dashboard'
    LIMIT 1`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as { slug: string; title: string | null; description: string | null; seo_title: string | null; seo_description: string | null; engine: string | null; engine_config: Record<string, unknown> | null };
  return {
    slug: row.slug,
    title: row.title || "Cloud Dashboard",
    description: row.description || "",
    seoTitle: row.seo_title || row.title || "Cloud Dashboard",
    seoDescription: row.seo_description || row.description || "",
    engine: row.engine || "cloud-dashboard",
    engineConfig: {
      hero: { title: "Welcome", primaryToolSlug: "", mode: "image", showModeSwitcher: false },
      featuredProducts: [],
      appRow: [],
      shortcuts: [],
      ...row.engine_config,
      showRecentFiles: true,
    },
  };
}
