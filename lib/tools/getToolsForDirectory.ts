import { query, shouldSuppressDatabaseErrorDuringBuild } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type { CloudId, EntitlementTier } from "@/lib/types/cloudEntitlements";
import type { ToolCategory, ToolTag, EngineType, InputType, OutputType, SearchIntent } from "@/data/toolsRegistry";
import { recordCacheMiss, recordCacheRequest } from "@/lib/ops/metrics";

export interface DirectoryTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  cloud_ids: CloudId[];
  required_tier: EntitlementTier;
  tags: ToolTag[];
  icon: string;
  iconBg: string;
  priority: number;
  isNew?: boolean;
  isTrending?: boolean;
  isMBB?: boolean;
  engineType: EngineType;
  inputType: InputType;
  outputType: OutputType;
  relatedTools: string[];
  relatedArticles: string[];
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
  pillarSlug?: string;
  clusterSlug?: string;
  recommendedTools?: string[];
  recommendedArticles?: string[];
}

interface ToolRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  required_clouds: string[];
  required_tier: string | null;
  tags: string[] | null;
  icon: string | null;
  icon_bg: string | null;
  priority: number | null;
  is_new: boolean | null;
  is_trending: boolean | null;
  is_mbb: boolean | null;
  engine: string | null;
  input_type: string | null;
  output_type: string | null;
  related_tools: string[] | null;
  related_articles: string[] | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  search_intent: string | null;
  pillar_slug: string | null;
  cluster: string | null;
  recommended_tools: string[] | null;
  recommended_articles: string[] | null;
}

const TOOLS_DIRECTORY_REVALIDATE_SECONDS = 30 * 60;

const DIRECTORY_TOOLS_SQL = `
  SELECT
    id, slug, name, description, category, 
    COALESCE(required_clouds, '{}') as required_clouds,
    COALESCE(required_tier, 'free') as required_tier,
    tags, icon, icon_bg, priority,
    is_new, is_trending, is_mbb,
    engine, input_type, output_type,
    related_tools, related_articles,
    primary_keyword, secondary_keywords, search_intent,
    pillar_slug, cluster,
    recommended_tools, recommended_articles
  FROM tools
  WHERE in_directory = true
    AND deleted_at IS NULL
    AND (status IS NULL OR status <> 'draft')
  ORDER BY featured DESC, priority ASC NULLS LAST, name ASC
`;

const ALL_ADMIN_TOOLS_SQL = `
  SELECT
    id, slug, name, description, category, 
    COALESCE(required_clouds, '{}') as required_clouds,
    COALESCE(required_tier, 'free') as required_tier,
    tags, icon, icon_bg, priority,
    is_new, is_trending, is_mbb,
    engine, input_type, output_type,
    related_tools, related_articles,
    primary_keyword, secondary_keywords, search_intent,
    pillar_slug, cluster,
    recommended_tools, recommended_articles
  FROM tools
  WHERE deleted_at IS NULL
  ORDER BY priority ASC NULLS LAST, name ASC
`;

const fetchDirectoryToolRowsCached = unstable_cache(
  async (): Promise<ToolRow[]> => {
    recordCacheMiss("directory-tool-rows");
    try {
      const result = await query(DIRECTORY_TOOLS_SQL);
      return result.rows as ToolRow[];
    } catch (error) {
      if (shouldSuppressDatabaseErrorDuringBuild(error)) {
        console.warn("[directory-tools] Suppressing build-time tools query failure:", error);
        return [];
      }
      throw error;
    }
  },
  ["directory-tool-rows-v1"],
  { revalidate: TOOLS_DIRECTORY_REVALIDATE_SECONDS }
);

const fetchClusterToolRowsCached = unstable_cache(
  async (clusterSlug: string, toolSlugsKey: string): Promise<ToolRow[]> => {
    recordCacheMiss("cluster-tool-rows");
    const normalizedToolSlugs = toolSlugsKey
      ? toolSlugsKey.split(",").filter(Boolean)
      : [];

    let slugCondition = "";
    const params: (string | string[])[] = [clusterSlug];
    if (normalizedToolSlugs.length > 0) {
      slugCondition = "OR slug = ANY($2)";
      params.push(normalizedToolSlugs);
    }

    try {
      const result = await query(
        `
        SELECT
          id, slug, name, description, category, 
          COALESCE(required_clouds, '{}') as required_clouds,
          COALESCE(required_tier, 'free') as required_tier,
          tags, icon, icon_bg, priority,
          is_new, is_trending, is_mbb,
          engine, input_type, output_type,
          related_tools, related_articles,
          primary_keyword, secondary_keywords, search_intent,
          pillar_slug, cluster,
          recommended_tools, recommended_articles
        FROM tools
        WHERE (cluster = $1 OR pillar_slug = $1 ${slugCondition})
          AND in_directory = true
          AND deleted_at IS NULL
          AND (status IS NULL OR status <> 'draft')
        ORDER BY priority ASC NULLS LAST, name ASC
        `,
        params
      );

      return result.rows as ToolRow[];
    } catch (error) {
      if (shouldSuppressDatabaseErrorDuringBuild(error)) {
        console.warn("[cluster-tools] Suppressing build-time tools query failure:", error);
        return [];
      }
      throw error;
    }
  },
  ["cluster-tool-rows-v1"],
  { revalidate: TOOLS_DIRECTORY_REVALIDATE_SECONDS }
);

function mapRowToDirectoryTool(row: ToolRow): DirectoryTool {
  return {
    id: row.id.toString(),
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    category: (row.category || "utilities") as ToolCategory,
    cloud_ids: (row.required_clouds || []) as CloudId[],
    required_tier: (row.required_tier || "free") as EntitlementTier,
    tags: (row.tags || []) as ToolTag[],
    icon: row.icon || "Star",
    iconBg: row.icon_bg || "bg-gray-100",
    priority: row.priority ?? 50,
    isNew: row.is_new ?? false,
    isTrending: row.is_trending ?? false,
    isMBB: row.is_mbb ?? false,
    engineType: (row.engine || "standalone") as EngineType,
    inputType: (row.input_type || "none") as InputType,
    outputType: (row.output_type || "display") as OutputType,
    relatedTools: row.related_tools || [],
    relatedArticles: row.related_articles || [],
    primaryKeyword: row.primary_keyword ?? undefined,
    secondaryKeywords: row.secondary_keywords ?? undefined,
    searchIntent: row.search_intent as SearchIntent | undefined,
    pillarSlug: row.pillar_slug ?? undefined,
    clusterSlug: row.cluster ?? undefined,
    recommendedTools: row.recommended_tools ?? undefined,
    recommendedArticles: row.recommended_articles ?? undefined,
  };
}

export async function getToolsForDirectory(): Promise<DirectoryTool[]> {
  recordCacheRequest("directory-tool-rows");
  const rows = await fetchDirectoryToolRowsCached();
  return rows.map(mapRowToDirectoryTool);
}

export async function getToolsForSchema(): Promise<DirectoryTool[]> {
  return getToolsForDirectory();
}

export async function getToolsByCategory(category: ToolCategory): Promise<DirectoryTool[]> {
  const tools = await getToolsForDirectory();
  return tools.filter(t => t.category === category);
}

export async function getToolsByTag(tag: ToolTag): Promise<DirectoryTool[]> {
  const tools = await getToolsForDirectory();
  return tools.filter(t => t.tags.includes(tag) || (tag === "trending" && t.isTrending) || (tag === "new" && t.isNew));
}

export async function getAllToolsForAdmin(): Promise<DirectoryTool[]> {
  const result = await query(ALL_ADMIN_TOOLS_SQL);

  return result.rows.map(mapRowToDirectoryTool);
}

export async function getToolsForCluster(clusterSlug: string, toolSlugs?: string[]): Promise<DirectoryTool[]> {
  recordCacheRequest("cluster-tool-rows");
  const normalized = [...new Set(toolSlugs || [])].sort();
  const toolSlugsKey = normalized.join(",");
  const rows = await fetchClusterToolRowsCached(clusterSlug, toolSlugsKey);
  return rows.map(mapRowToDirectoryTool);
}
