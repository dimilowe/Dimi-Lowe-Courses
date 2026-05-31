import { CLUSTER_REGISTRY, TopicCluster } from "@/data/clusterRegistry";
import { isToolIndexed } from "@/lib/toolRollout";
import { query } from "@/lib/db";

export interface ClusterHealthScore {
  total: number;
  breakdown: {
    pillarScore: number;
    toolsScore: number;
    articlesScore: number;
    interlinkScore: number;
  };
  issues: string[];
  status: "ready" | "needs-work" | "incomplete";
}

export interface ArticleStatus {
  slug: string;
  title?: string;
  exists: boolean;
  isDraft: boolean;
  isPublished: boolean;
  isIndexed: boolean;
  contentLength: number;
}

export interface ClusterOverview {
  id: string;
  pillarSlug: string;
  pillarTitle: string;
  pillarDescription: string;
  engineId: string;
  primaryKeyword: string;
  toolCount: number;
  indexedToolCount: number;
  articleCount: number;
  publishedArticleCount: number;
  healthScore: ClusterHealthScore;
  toolSlugs: string[];
  articleSlugs: string[];
  articleStatuses: ArticleStatus[];
}

export function calculateClusterHealth(
  cluster: TopicCluster, 
  publishedArticleCount: number
): ClusterHealthScore {
  const issues: string[] = [];
  
  let pillarScore = 25;
  
  const toolsInCluster = cluster.toolSlugs.length;
  const indexedTools = cluster.toolSlugs.filter(slug => isToolIndexed(slug)).length;
  
  let toolsScore = 0;
  if (toolsInCluster === 0) {
    issues.push("No tools in cluster");
    toolsScore = 0;
  } else if (toolsInCluster < 3) {
    issues.push(`Only ${toolsInCluster} tools (minimum 3 recommended)`);
    toolsScore = 10;
  } else {
    toolsScore = Math.min(25, Math.floor((indexedTools / toolsInCluster) * 25));
  }
  
  let articlesScore = 0;
  const plannedArticles = cluster.articleSlugs.length;
  
  if (plannedArticles === 0) {
    issues.push("No supporting articles planned");
    articlesScore = 0;
  } else if (publishedArticleCount === 0) {
    issues.push(`0/${plannedArticles} articles published`);
    articlesScore = 0;
  } else if (publishedArticleCount < 3) {
    issues.push(`Only ${publishedArticleCount}/${plannedArticles} articles published (minimum 3 recommended)`);
    articlesScore = Math.floor((publishedArticleCount / 3) * 25);
  } else {
    articlesScore = 25;
  }
  
  let interlinkScore = 25;
  if (toolsInCluster < 2) {
    issues.push("Insufficient tools for internal linking");
    interlinkScore = 10;
  }
  if (publishedArticleCount < 1) {
    interlinkScore -= 10;
  }
  
  const total = pillarScore + toolsScore + articlesScore + interlinkScore;
  
  let status: "ready" | "needs-work" | "incomplete";
  if (total >= 80 && issues.length === 0) {
    status = "ready";
  } else if (total >= 50) {
    status = "needs-work";
  } else {
    status = "incomplete";
  }
  
  return {
    total,
    breakdown: {
      pillarScore,
      toolsScore,
      articlesScore,
      interlinkScore,
    },
    issues,
    status,
  };
}

async function getArticleStatuses(articleSlugs: string[]): Promise<ArticleStatus[]> {
  if (articleSlugs.length === 0) {
    return [];
  }
  
  try {
    const placeholders = articleSlugs.map((_, i) => `$${i + 1}`).join(", ");
    // Query cms_objects for articles and join with global_urls for indexed status
    const result = await query(
      `SELECT 
         c.slug, 
         c.data->>'title' as title, 
         c.word_count,
         COALESCE(g.is_indexed, false) as is_indexed
       FROM cms_objects c
       LEFT JOIN global_urls g ON g.cms_slug = c.slug
       WHERE c.slug IN (${placeholders}) AND c.type = 'article'`,
      articleSlugs
    );
    
    const articleMap = new Map<string, {
      title: string;
      isPublished: boolean;
      isIndexed: boolean;
      contentLength: number;
    }>();
    
    for (const row of result.rows) {
      articleMap.set(row.slug as string, { 
        title: (row.title as string) || (row.slug as string), 
        // Articles in cms_objects are considered published (drafts not yet imported)
        isPublished: true,
        isIndexed: row.is_indexed === true,
        contentLength: (row.word_count as number) || 0,
      });
    }
    
    return articleSlugs.map(slug => {
      const found = articleMap.get(slug);
      if (!found) {
        return {
          slug,
          exists: false,
          isDraft: false,
          isPublished: false,
          isIndexed: false,
          contentLength: 0,
        };
      }
      return {
        slug,
        title: found.title,
        exists: true,
        isDraft: !found.isPublished,
        isPublished: found.isPublished,
        isIndexed: found.isIndexed,
        contentLength: found.contentLength,
      };
    });
  } catch (error) {
    console.error("Error fetching article statuses:", error);
    return articleSlugs.map(slug => ({ 
      slug, 
      exists: false,
      isDraft: false,
      isPublished: false, 
      isIndexed: false,
      contentLength: 0,
    }));
  }
}

export async function getAllClustersOverview(): Promise<ClusterOverview[]> {
  const clusters = Object.values(CLUSTER_REGISTRY);
  
  const allArticleSlugs = clusters.flatMap(c => c.articleSlugs);
  const uniqueSlugs = [...new Set(allArticleSlugs)];
  
  let articleStatusMap = new Map<string, ArticleStatus>();
  
  if (uniqueSlugs.length > 0) {
    try {
      const placeholders = uniqueSlugs.map((_, i) => `$${i + 1}`).join(", ");
      // Query cms_objects for articles and join with global_urls for indexed status
      const result = await query(
        `SELECT 
           c.slug, 
           c.data->>'title' as title, 
           c.word_count,
           COALESCE(g.is_indexed, false) as is_indexed
         FROM cms_objects c
         LEFT JOIN global_urls g ON g.cms_slug = c.slug
         WHERE c.slug IN (${placeholders}) AND c.type = 'article'`,
        uniqueSlugs
      );
      
      for (const row of result.rows) {
        articleStatusMap.set(row.slug as string, {
          slug: row.slug as string,
          title: (row.title as string) || (row.slug as string),
          exists: true,
          isDraft: false,
          isPublished: true,
          isIndexed: row.is_indexed === true,
          contentLength: (row.word_count as number) || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching articles for clusters:", error);
    }
  }
  
  return clusters.map(cluster => {
    const indexedToolCount = cluster.toolSlugs.filter(slug => isToolIndexed(slug)).length;
    
    const articleStatuses = cluster.articleSlugs.map(slug => 
      articleStatusMap.get(slug) || { 
        slug, 
        exists: false,
        isDraft: false,
        isPublished: false,
        isIndexed: false,
        contentLength: 0,
      }
    );
    const publishedArticleCount = articleStatuses.filter(a => a.isPublished).length;
    
    return {
      id: cluster.id,
      pillarSlug: cluster.pillarSlug,
      pillarTitle: cluster.pillarTitle,
      pillarDescription: cluster.pillarDescription,
      engineId: cluster.engineId,
      primaryKeyword: cluster.primaryKeyword,
      toolCount: cluster.toolSlugs.length,
      indexedToolCount,
      articleCount: cluster.articleSlugs.length,
      publishedArticleCount,
      healthScore: calculateClusterHealth(cluster, publishedArticleCount),
      toolSlugs: cluster.toolSlugs,
      articleSlugs: cluster.articleSlugs,
      articleStatuses,
    };
  });
}

export async function getClusterOverviewById(clusterId: string): Promise<ClusterOverview | null> {
  const cluster = CLUSTER_REGISTRY[clusterId];
  if (!cluster) return null;
  
  const indexedToolCount = cluster.toolSlugs.filter(slug => isToolIndexed(slug)).length;
  const articleStatuses = await getArticleStatuses(cluster.articleSlugs);
  const publishedArticleCount = articleStatuses.filter(a => a.isPublished).length;
  
  return {
    id: cluster.id,
    pillarSlug: cluster.pillarSlug,
    pillarTitle: cluster.pillarTitle,
    pillarDescription: cluster.pillarDescription,
    engineId: cluster.engineId,
    primaryKeyword: cluster.primaryKeyword,
    toolCount: cluster.toolSlugs.length,
    indexedToolCount,
    articleCount: cluster.articleSlugs.length,
    publishedArticleCount,
    healthScore: calculateClusterHealth(cluster, publishedArticleCount),
    toolSlugs: cluster.toolSlugs,
    articleSlugs: cluster.articleSlugs,
    articleStatuses,
  };
}
