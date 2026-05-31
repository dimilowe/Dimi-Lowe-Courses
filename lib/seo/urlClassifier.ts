import { query } from '@/lib/db';
import { CLUSTER_REGISTRY, TopicCluster } from '@/data/clusterRegistry';

export const SEO_THRESHOLDS = {
  MIN_READY_SCORE: 80,
  BASELINE_INTERNAL_LINKS: 3,
  MIN_WORD_COUNT_ARTICLE: 300,
  MIN_WORD_COUNT_OTHER: 150,
  MAX_ARTICLES_FOR_TOOL_LINKS: 3,
  MAX_ARTICLES_FOR_PILLAR_LINKS: 3,
} as const;

export interface UrlClassification {
  url: string;
  isLegacyTool: boolean;
  isCmsTool: boolean;
  isCmsArticle: boolean;
  isPillar: boolean;
  isOtherCms: boolean;
  cluster: TopicCluster | null;
  clusterId: string | null;
  expectedLinks: number | null;
  status: 'Ready' | 'Needs Links' | 'Needs Review' | 'Legacy';
}

export interface ClassificationInput {
  url: string;
  actualLinks: number;
  healthScore: number | null;
  manualReviewPassed: boolean;
}

export async function getCmsToolSlugs(): Promise<Set<string>> {
  const result = await query(`SELECT slug FROM cms_objects WHERE type = 'tool'`);
  return new Set(result.rows.map((r: any) => r.slug));
}

export async function getCmsArticleSlugs(): Promise<Set<string>> {
  const result = await query(`SELECT slug FROM cms_objects WHERE type IN ('article', 'answer', 'blog', 'idea')`);
  return new Set(result.rows.map((r: any) => r.slug));
}

export async function getCmsPillarSlugs(): Promise<Set<string>> {
  const result = await query(`SELECT slug FROM cms_objects WHERE type = 'pillar'`);
  return new Set(result.rows.map((r: any) => r.slug));
}

export function normalizeToSlug(urlOrSlug: string): string {
  return urlOrSlug
    .replace(/^\/tools\//, '')
    .replace(/^\/mbb\//, '')
    .replace(/^\/blog\//, '')
    .replace(/^\/answers\//, '');
}

export function normalizeToToolUrl(slug: string): string {
  if (slug.startsWith('/')) return slug;
  return `/tools/${slug}`;
}

function findClusterByToolSlug(slug: string): { cluster: TopicCluster; clusterId: string } | null {
  const normalizedSlug = normalizeToSlug(slug);
  for (const [clusterId, cluster] of Object.entries(CLUSTER_REGISTRY)) {
    if (cluster.toolSlugs.includes(normalizedSlug)) {
      return { cluster, clusterId };
    }
  }
  return null;
}

function findClusterByArticleSlug(slug: string): { cluster: TopicCluster; clusterId: string } | null {
  const normalizedSlug = normalizeToSlug(slug);
  for (const [clusterId, cluster] of Object.entries(CLUSTER_REGISTRY)) {
    if (cluster.articleSlugs.includes(normalizedSlug)) {
      return { cluster, clusterId };
    }
  }
  return null;
}

function findClusterByPillarUrl(url: string): { cluster: TopicCluster; clusterId: string } | null {
  for (const [clusterId, cluster] of Object.entries(CLUSTER_REGISTRY)) {
    const pillarUrl = cluster.pillarSlug.startsWith('/') 
      ? cluster.pillarSlug 
      : `/tools/${cluster.pillarSlug}`;
    if (url === pillarUrl) {
      return { cluster, clusterId };
    }
  }
  return null;
}

function isPillarUrl(url: string): boolean {
  return findClusterByPillarUrl(url) !== null;
}

export function computeExpectedLinks(classification: {
  isLegacyTool: boolean;
  isCmsTool: boolean;
  isCmsArticle: boolean;
  isPillar: boolean;
  isOtherCms: boolean;
  cluster: TopicCluster | null;
}): number | null {
  if (classification.isLegacyTool) {
    return null;
  }

  const cluster = classification.cluster;

  if (classification.isCmsTool && cluster) {
    const siblingTools = cluster.toolSlugs.length - 1;
    const articleCount = cluster.articleSlugs?.length ?? 0;
    const pillar = 1;
    return siblingTools + Math.min(articleCount, SEO_THRESHOLDS.MAX_ARTICLES_FOR_TOOL_LINKS) + pillar;
  }

  if (classification.isCmsArticle && cluster) {
    return SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS;
  }

  if (classification.isPillar && cluster) {
    const tools = cluster.toolSlugs.length;
    const articles = cluster.articleSlugs?.length ?? 0;
    return tools + Math.min(articles, SEO_THRESHOLDS.MAX_ARTICLES_FOR_PILLAR_LINKS);
  }

  if (classification.isOtherCms) {
    return SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS;
  }

  return SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS;
}

export function computeStatus(input: {
  isLegacyTool: boolean;
  healthScore: number | null;
  actualLinks: number;
  expectedLinks: number | null;
  manualReviewPassed: boolean;
}): 'Ready' | 'Needs Links' | 'Needs Review' | 'Legacy' {
  if (input.isLegacyTool) {
    return 'Legacy';
  }

  if (input.expectedLinks === null) {
    if ((input.healthScore ?? 0) >= SEO_THRESHOLDS.MIN_READY_SCORE && 
        input.actualLinks >= SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS && 
        input.manualReviewPassed) {
      return 'Ready';
    }
    return 'Needs Review';
  }

  if (input.actualLinks < input.expectedLinks) {
    return 'Needs Links';
  }

  if ((input.healthScore ?? 0) < SEO_THRESHOLDS.MIN_READY_SCORE) {
    return 'Needs Review';
  }

  if (!input.manualReviewPassed) {
    return 'Needs Review';
  }

  return 'Ready';
}

export async function classifyUrl(
  url: string,
  actualLinks: number,
  healthScore: number | null,
  manualReviewPassed: boolean,
  cmsToolSlugs: Set<string>,
  cmsArticleSlugs: Set<string>
): Promise<UrlClassification> {
  const isToolUrl = url.startsWith('/tools/') && 
    !url.includes('/all') && 
    !url.includes('/clusters/') &&
    !url.includes('[slug]') &&
    !url.includes('/embed') &&
    !url.includes('/success');
  
  const toolSlug = isToolUrl ? normalizeToSlug(url) : null;
  
  const isArticleUrl = url.startsWith('/mbb/') || url.startsWith('/blog/') || url.startsWith('/answers/');
  const articleSlug = isArticleUrl ? normalizeToSlug(url) : null;

  const isPillar = isPillarUrl(url);
  const isCmsTool = toolSlug !== null && cmsToolSlugs.has(toolSlug);
  const isCmsArticle = articleSlug !== null && cmsArticleSlugs.has(articleSlug);
  const isLegacyTool = isToolUrl && !isPillar && !isCmsTool;
  
  let cluster: TopicCluster | null = null;
  let clusterId: string | null = null;
  
  if (isPillar) {
    const found = findClusterByPillarUrl(url);
    if (found) {
      cluster = found.cluster;
      clusterId = found.clusterId;
    }
  } else if (isCmsTool && toolSlug) {
    const found = findClusterByToolSlug(toolSlug);
    if (found) {
      cluster = found.cluster;
      clusterId = found.clusterId;
    }
  } else if (isCmsArticle && articleSlug) {
    const found = findClusterByArticleSlug(articleSlug);
    if (found) {
      cluster = found.cluster;
      clusterId = found.clusterId;
    }
  }

  const isOtherCms = !isLegacyTool && !isCmsTool && !isCmsArticle && !isPillar;

  const expectedLinks = computeExpectedLinks({
    isLegacyTool,
    isCmsTool,
    isCmsArticle,
    isPillar,
    isOtherCms,
    cluster,
  });

  const status = computeStatus({
    isLegacyTool,
    healthScore,
    actualLinks,
    expectedLinks,
    manualReviewPassed,
  });

  return {
    url,
    isLegacyTool,
    isCmsTool,
    isCmsArticle,
    isPillar,
    isOtherCms,
    cluster,
    clusterId,
    expectedLinks,
    status,
  };
}

export async function classifyAllUrls(): Promise<Map<string, UrlClassification>> {
  const cmsToolSlugs = await getCmsToolSlugs();
  const cmsArticleSlugs = await getCmsArticleSlugs();
  
  const urlsResult = await query(`
    SELECT g.url, g.manual_review_passed,
           COALESCE(s.internal_links_out_count, 0) as actual_links,
           s.overall_score as health_score
    FROM global_urls g
    LEFT JOIN LATERAL (
      SELECT internal_links_out_count, overall_score
      FROM seo_health_snapshots
      WHERE slug = g.url
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) s ON true
    WHERE g.url NOT LIKE '/admin%'
      AND g.url NOT LIKE '/api%'
      AND g.url NOT LIKE '/login%'
      AND g.url NOT LIKE '/dashboard%'
  `);

  const classifications = new Map<string, UrlClassification>();

  for (const row of urlsResult.rows) {
    const classification = await classifyUrl(
      row.url as string,
      (row.actual_links as number) ?? 0,
      (row.health_score as number) ?? null,
      (row.manual_review_passed as boolean) ?? false,
      cmsToolSlugs,
      cmsArticleSlugs
    );
    classifications.set(row.url as string, classification);
  }

  return classifications;
}

export function getAllExpectedLinksFromRegistry(): Record<string, { expected: number | null; cluster: string | null; type: string }> {
  const result: Record<string, { expected: number | null; cluster: string | null; type: string }> = {};

  for (const [clusterId, cluster] of Object.entries(CLUSTER_REGISTRY)) {
    const pillarUrl = cluster.pillarSlug.startsWith('/')
      ? cluster.pillarSlug
      : `/tools/${cluster.pillarSlug}`;
    
    const toolCount = cluster.toolSlugs.length;
    const articleCount = cluster.articleSlugs?.length ?? 0;
    
    result[pillarUrl] = {
      expected: toolCount + Math.min(articleCount, SEO_THRESHOLDS.MAX_ARTICLES_FOR_PILLAR_LINKS),
      cluster: clusterId,
      type: 'pillar',
    };

    for (const toolSlug of cluster.toolSlugs) {
      const toolUrl = `/tools/${toolSlug}`;
      const siblingCount = toolCount - 1;
      const linksFromArticles = Math.min(articleCount, SEO_THRESHOLDS.MAX_ARTICLES_FOR_TOOL_LINKS);
      result[toolUrl] = {
        expected: siblingCount + linksFromArticles + 1,
        cluster: clusterId,
        type: 'tool',
      };
    }

    for (const articleSlug of cluster.articleSlugs) {
      const articleUrl = `/mbb/${articleSlug}`;
      result[articleUrl] = {
        expected: SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS,
        cluster: clusterId,
        type: 'article',
      };
    }
  }

  return result;
}
