import { query, withTransaction } from "./db";
import { refreshToolsCache } from "./toolsCache";

export interface ToolFilters {
  status?: string | string[];
  engine?: string;
  cluster?: string;
  segment?: string;
  category?: string;
  isIndexed?: boolean;
  inDirectory?: boolean;
  isFeatured?: boolean;
  search?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface ToolRecord {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  engine: string | null;
  cluster: string | null;
  segment: string | null;
  status: string;
  linkStatus: string;
  isIndexed: boolean;
  inDirectory: boolean;
  featured: boolean;
  blueprintId: string | null;
  dimensions: Record<string, any> | null;
  linkRules: Record<string, any> | null;
  category: string | null;
  tags: string[] | null;
  icon: string | null;
  iconBg: string | null;
  priority: number;
  isNew: boolean;
  isTrending: boolean;
  isMbb: boolean;
  inputType: string | null;
  outputType: string | null;
  primaryKeyword: string | null;
  secondaryKeywords: string[] | null;
  searchIntent: string | null;
  pillarSlug: string | null;
  recommendedTools: string[] | null;
  recommendedArticles: string[] | null;
  relatedTools: string[] | null;
  relatedArticles: string[] | null;
  source: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NewToolInput {
  slug: string;
  name: string;
  description?: string;
  engine?: string;
  cluster?: string;
  segment?: string;
  status?: string;
  linkStatus?: string;
  isIndexed?: boolean;
  inDirectory?: boolean;
  featured?: boolean;
  blueprintId?: string;
  dimensions?: Record<string, any>;
  linkRules?: Record<string, any>;
  category?: string;
  tags?: string[];
  icon?: string;
  iconBg?: string;
  priority?: number;
  isNew?: boolean;
  isTrending?: boolean;
  isMbb?: boolean;
  inputType?: string;
  outputType?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
  pillarSlug?: string;
  recommendedTools?: string[];
  recommendedArticles?: string[];
  relatedTools?: string[];
  relatedArticles?: string[];
  source?: string;
}

function mapRowToTool(row: any): ToolRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    engine: row.engine,
    cluster: row.cluster,
    segment: row.segment,
    status: row.status || 'draft',
    linkStatus: row.link_status || 'Not Ready',
    isIndexed: row.is_indexed ?? false,
    inDirectory: row.in_directory ?? false,
    featured: row.featured ?? false,
    blueprintId: row.blueprint_id,
    dimensions: row.dimensions,
    linkRules: row.link_rules,
    category: row.category,
    tags: row.tags,
    icon: row.icon,
    iconBg: row.icon_bg,
    priority: row.priority ?? 50,
    isNew: row.is_new ?? false,
    isTrending: row.is_trending ?? false,
    isMbb: row.is_mbb ?? false,
    inputType: row.input_type,
    outputType: row.output_type,
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: row.secondary_keywords,
    searchIntent: row.search_intent,
    pillarSlug: row.pillar_slug,
    recommendedTools: row.recommended_tools,
    recommendedArticles: row.recommended_articles,
    relatedTools: row.related_tools,
    relatedArticles: row.related_articles,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getToolBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<ToolRecord | null> {
  const includeDrafts = options?.includeDrafts ?? true;
  
  let sql = `SELECT * FROM tools WHERE slug = $1 AND deleted_at IS NULL`;
  if (!includeDrafts) {
    sql += ` AND status = 'published'`;
  }
  
  const result = await query(sql, [slug]);
  if (result.rows.length === 0) return null;
  return mapRowToTool(result.rows[0]);
}

export async function listTools(filters: ToolFilters = {}): Promise<ToolRecord[]> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`status = ANY($${paramIndex})`);
      params.push(filters.status);
    } else {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
    }
    paramIndex++;
  }

  if (filters.engine) {
    conditions.push(`engine = $${paramIndex}`);
    params.push(filters.engine);
    paramIndex++;
  }

  if (filters.cluster) {
    conditions.push(`cluster = $${paramIndex}`);
    params.push(filters.cluster);
    paramIndex++;
  }

  if (filters.segment) {
    conditions.push(`segment = $${paramIndex}`);
    params.push(filters.segment);
    paramIndex++;
  }

  if (filters.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.isIndexed !== undefined) {
    conditions.push(`is_indexed = $${paramIndex}`);
    params.push(filters.isIndexed);
    paramIndex++;
  }

  if (filters.inDirectory !== undefined) {
    conditions.push(`in_directory = $${paramIndex}`);
    params.push(filters.inDirectory);
    paramIndex++;
  }

  if (filters.isFeatured !== undefined) {
    conditions.push(`featured = $${paramIndex}`);
    params.push(filters.isFeatured);
    paramIndex++;
  }

  if (filters.source) {
    conditions.push(`source = $${paramIndex}`);
    params.push(filters.source);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex} OR primary_keyword ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  let sql = `SELECT * FROM tools`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY priority ASC, name ASC`;

  if (filters.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }

  const result = await query(sql, params);
  return result.rows.map(mapRowToTool);
}

export async function createTool(data: NewToolInput): Promise<ToolRecord> {
  const result = await query(
    `INSERT INTO tools (
      slug, name, description, engine, cluster, segment, status, link_status,
      is_indexed, in_directory, featured, blueprint_id, dimensions, link_rules,
      category, tags, icon, icon_bg, priority, is_new, is_trending, is_mbb,
      input_type, output_type, primary_keyword, secondary_keywords, search_intent,
      pillar_slug, recommended_tools, recommended_articles, related_tools, related_articles, source,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
      NOW(), NOW()
    ) RETURNING *`,
    [
      data.slug,
      data.name,
      data.description || null,
      data.engine || null,
      data.cluster || null,
      data.segment || null,
      data.status || 'draft',
      data.linkStatus || 'Not Ready',
      data.isIndexed ?? false,
      data.inDirectory ?? false,
      data.featured ?? false,
      data.blueprintId || null,
      data.dimensions ? JSON.stringify(data.dimensions) : null,
      data.linkRules ? JSON.stringify(data.linkRules) : null,
      data.category || null,
      data.tags || null,
      data.icon || null,
      data.iconBg || null,
      data.priority ?? 50,
      data.isNew ?? false,
      data.isTrending ?? false,
      data.isMbb ?? false,
      data.inputType || null,
      data.outputType || null,
      data.primaryKeyword || null,
      data.secondaryKeywords || null,
      data.searchIntent || null,
      data.pillarSlug || null,
      data.recommendedTools || null,
      data.recommendedArticles || null,
      data.relatedTools || null,
      data.relatedArticles || null,
      data.source || 'manual',
    ]
  );
  const tool = mapRowToTool(result.rows[0]);
  await refreshToolsCache();
  return tool;
}

export async function updateTool(
  slug: string,
  data: Partial<NewToolInput>
): Promise<ToolRecord | null> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    engine: 'engine',
    cluster: 'cluster',
    segment: 'segment',
    status: 'status',
    linkStatus: 'link_status',
    isIndexed: 'is_indexed',
    inDirectory: 'in_directory',
    featured: 'featured',
    blueprintId: 'blueprint_id',
    dimensions: 'dimensions',
    linkRules: 'link_rules',
    category: 'category',
    tags: 'tags',
    icon: 'icon',
    iconBg: 'icon_bg',
    priority: 'priority',
    isNew: 'is_new',
    isTrending: 'is_trending',
    isMbb: 'is_mbb',
    inputType: 'input_type',
    outputType: 'output_type',
    primaryKeyword: 'primary_keyword',
    secondaryKeywords: 'secondary_keywords',
    searchIntent: 'search_intent',
    pillarSlug: 'pillar_slug',
    recommendedTools: 'recommended_tools',
    recommendedArticles: 'recommended_articles',
    relatedTools: 'related_tools',
    relatedArticles: 'related_articles',
    source: 'source',
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (key in data) {
      let value = (data as any)[key];
      if (key === 'dimensions' || key === 'linkRules') {
        value = value ? JSON.stringify(value) : null;
      }
      updates.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = NOW()`);
  params.push(slug);

  const result = await query(
    `UPDATE tools SET ${updates.join(', ')} WHERE slug = $${paramIndex} RETURNING *`,
    params
  );

  if (result.rows.length === 0) return null;
  const tool = mapRowToTool(result.rows[0]);
  await refreshToolsCache();
  return tool;
}

export async function upsertTool(data: NewToolInput): Promise<ToolRecord> {
  const existing = await getToolBySlug(data.slug);
  if (existing) {
    const updated = await updateTool(data.slug, data);
    return updated || existing;
  }
  return createTool(data);
}

export async function getToolCount(filters: ToolFilters = {}): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`status = ANY($${paramIndex})`);
      params.push(filters.status);
    } else {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
    }
    paramIndex++;
  }

  if (filters.engine) {
    conditions.push(`engine = $${paramIndex}`);
    params.push(filters.engine);
    paramIndex++;
  }

  if (filters.source) {
    conditions.push(`source = $${paramIndex}`);
    params.push(filters.source);
    paramIndex++;
  }

  let sql = `SELECT COUNT(*) as count FROM tools`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
}

export async function getToolsByCluster(clusterSlug: string): Promise<ToolRecord[]> {
  return listTools({ cluster: clusterSlug });
}

export async function getPublishedTools(): Promise<ToolRecord[]> {
  return listTools({ status: 'published', inDirectory: true });
}

export async function getIndexedTools(): Promise<ToolRecord[]> {
  return listTools({ isIndexed: true });
}
