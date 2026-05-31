import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { CLUSTER_REGISTRY, TopicCluster } from "@/data/clusterRegistry";
import { 
  getCmsToolSlugs, 
  getCmsArticleSlugs, 
  normalizeToSlug,
  computeExpectedLinks,
  computeStatus,
  SEO_THRESHOLDS
} from "@/lib/seo/urlClassifier";

export type UrlKind = 
  | "cms-tool"
  | "cms-article" 
  | "cms-pillar"
  | "cms-product"
  | "system"
  | "legacy";

export type UrlStatus = 
  | "Ready"
  | "Needs Links"
  | "Needs Review"
  | "Legacy"
  | "System";

export interface EnrichedUrlRow {
  id: string;
  url: string;
  kind: UrlKind;
  status: UrlStatus;
  isIndexed: boolean;
  cmsId: string | null;
  cmsType: string | null;
  clusterSlug: string | null;
  engine: string | null;
  linksInbound: number;
  linksOutbound: number;
  expectedLinks: number | null;
  seoScore: number | null;
  cloudTags: string[];
}

const SYSTEM_URLS = new Set([
  "/",
  "/store",
  "/tools",
  "/tools/all",
  "/settings",
  "/saved",
  "/ideas",
  "/ideas/new",
  "/answers",
  "/answers/new",
  "/blog",
  "/newsletter",
  "/dashboard",
  "/strategy-ai",
  "/admin",
]);

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

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSessionData>(cookieStore, sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [cmsToolSlugs, cmsArticleSlugs] = await Promise.all([
      getCmsToolSlugs(),
      getCmsArticleSlugs()
    ]);

    const urlsResult = await query(`
      SELECT 
        gu.id,
        gu.url,
        gu.type as global_type,
        gu.is_indexed,
        co.id as cms_id,
        co.type as cms_type,
        co.cluster_slug,
        co.data->'engine_config'->>'engine' as engine,
        co.cloud_tags
      FROM global_urls gu
      LEFT JOIN cms_objects co ON 
        (gu.url LIKE '/tools/%' AND co.slug = SUBSTRING(gu.url FROM 8) AND co.type = 'tool')
      ORDER BY gu.url
    `);

    const snapshotsResult = await query(`
      SELECT slug, internal_links_out_count, internal_links_in_count, overall_score
      FROM seo_health_snapshots
      WHERE snapshot_date = (
        SELECT MAX(snapshot_date) FROM seo_health_snapshots s2 WHERE s2.slug = seo_health_snapshots.slug
      )
    `);

    const snapshotMap = new Map<string, { linksIn: number; linksOut: number; score: number }>();
    for (const row of snapshotsResult.rows) {
      snapshotMap.set(row.slug as string, {
        linksIn: (row.internal_links_in_count as number) || 0,
        linksOut: (row.internal_links_out_count as number) || 0,
        score: (row.overall_score as number) || 0
      });
    }

    const enrichedRows: EnrichedUrlRow[] = [];

    for (const row of urlsResult.rows) {
      const url = row.url as string;
      const snapshot = snapshotMap.get(url);
      const linksInbound = snapshot?.linksIn || 0;
      const linksOutbound = snapshot?.linksOut || 0;
      const seoScore = snapshot?.score || null;

      const isSystem = SYSTEM_URLS.has(url) || url.startsWith('/admin');
      
      const isToolUrl = url.startsWith('/tools/') && 
        !url.includes('/all') && 
        !url.includes('/clusters/') &&
        !url.includes('[slug]') &&
        !url.includes('/embed') &&
        !url.includes('/success');
      
      const toolSlug = isToolUrl ? normalizeToSlug(url) : null;
      const isCmsTool = toolSlug !== null && cmsToolSlugs.has(toolSlug);
      
      const isArticleUrl = url.startsWith('/mbb/') || url.startsWith('/blog/') || url.startsWith('/answers/');
      const articleSlug = isArticleUrl ? normalizeToSlug(url) : null;
      const isCmsArticle = articleSlug !== null && cmsArticleSlugs.has(articleSlug);
      
      const isPillarResult = findClusterByPillarUrl(url);
      const isPillar = isPillarResult !== null;
      
      const isLegacyTool = isToolUrl && !isPillar && !isCmsTool;
      
      const isCmsProduct = row.cms_type === 'product';
      const isOtherCms = !isSystem && !isLegacyTool && !isCmsTool && !isCmsArticle && !isPillar && !isCmsProduct && row.cms_id;

      let kind: UrlKind;
      if (isSystem) {
        kind = "system";
      } else if (isLegacyTool) {
        kind = "legacy";
      } else if (isCmsTool) {
        kind = "cms-tool";
      } else if (isCmsArticle) {
        kind = "cms-article";
      } else if (isPillar) {
        kind = "cms-pillar";
      } else if (isCmsProduct) {
        kind = "cms-product";
      } else if (isOtherCms) {
        kind = "legacy";
      } else {
        kind = "legacy";
      }

      let cluster: TopicCluster | null = null;
      let clusterId: string | null = (row.cluster_slug as string) || null;
      
      if (isPillar && isPillarResult) {
        cluster = isPillarResult.cluster;
        clusterId = isPillarResult.clusterId;
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

      const expectedLinks = computeExpectedLinks({
        isLegacyTool,
        isCmsTool,
        isCmsArticle,
        isPillar,
        isOtherCms: !!isOtherCms,
        cluster
      });

      let status: UrlStatus;
      if (isSystem) {
        status = "System";
      } else {
        status = computeStatus({
          isLegacyTool,
          healthScore: seoScore,
          actualLinks: linksOutbound,
          expectedLinks,
          manualReviewPassed: false
        });
      }

      enrichedRows.push({
        id: row.id as string,
        url,
        kind,
        status,
        isIndexed: row.is_indexed as boolean,
        cmsId: (row.cms_id as string) || null,
        cmsType: (row.cms_type as string) || null,
        clusterSlug: clusterId,
        engine: (row.engine as string) || null,
        linksInbound,
        linksOutbound,
        expectedLinks,
        seoScore,
        cloudTags: (row.cloud_tags as string[]) || []
      });
    }

    const summary = {
      total: enrichedRows.length,
      indexed: enrichedRows.filter(r => r.isIndexed).length,
      byKind: {
        "cms-tool": enrichedRows.filter(r => r.kind === "cms-tool").length,
        "cms-article": enrichedRows.filter(r => r.kind === "cms-article").length,
        "cms-pillar": enrichedRows.filter(r => r.kind === "cms-pillar").length,
        "cms-product": enrichedRows.filter(r => r.kind === "cms-product").length,
        "system": enrichedRows.filter(r => r.kind === "system").length,
        "legacy": enrichedRows.filter(r => r.kind === "legacy").length,
      },
      byStatus: {
        "Ready": enrichedRows.filter(r => r.status === "Ready").length,
        "Needs Links": enrichedRows.filter(r => r.status === "Needs Links").length,
        "Needs Review": enrichedRows.filter(r => r.status === "Needs Review").length,
        "Legacy": enrichedRows.filter(r => r.status === "Legacy").length,
        "System": enrichedRows.filter(r => r.status === "System").length,
      }
    };

    return NextResponse.json({ 
      rows: enrichedRows,
      summary
    });
  } catch (error) {
    console.error("Error fetching enriched URL registry:", error);
    return NextResponse.json(
      { error: "Failed to fetch enriched registry" },
      { status: 500 }
    );
  }
}
