import { query } from '@/lib/db';
import { 
  getCmsToolSlugs, 
  getCmsArticleSlugs, 
  classifyUrl, 
  SEO_THRESHOLDS,
  UrlClassification 
} from './urlClassifier';

export interface ReadinessResult {
  urlId: string;
  slug: string;
  pageType: string;
  healthScore: number | null;
  isReady: boolean;
  needsManualReview: boolean;
  issues: string[];
  internalLinks: number;
  expectedLinks: number | null;
  status: 'Ready' | 'Needs Links' | 'Needs Review' | 'Legacy';
  clusterId: string | null;
  classification: {
    isLegacyTool: boolean;
    isCmsTool: boolean;
    isCmsArticle: boolean;
    isPillar: boolean;
    isOtherCms: boolean;
  };
}

export interface InspectorSummary {
  evaluated: number;
  readyCount: number;
  needsLinksCount: number;
  needsReviewCount: number;
  legacyCount: number;
  noSnapshotCount: number;
  errors: number;
}

interface UrlRecord {
  id: string;
  url: string;
  type: string;
  is_indexed: boolean;
  manual_review_passed: boolean;
}

interface SnapshotRecord {
  overall_score: number;
  status_code: number;
  word_count: number;
  has_title: boolean;
  has_h1: boolean;
  has_meta_description: boolean;
  has_expected_schema: boolean;
  robots_index: string;
  internal_links_out_count: number;
}

export function evaluateReadiness(
  url: UrlRecord,
  snapshot: SnapshotRecord | null,
  manualReviewPassed: boolean,
  classification: UrlClassification
): ReadinessResult {
  const issues: string[] = [];
  const slug = url.url;
  const pageType = url.type || 'static';

  if (!snapshot) {
    return {
      urlId: url.id,
      slug,
      pageType,
      healthScore: null,
      isReady: false,
      needsManualReview: false,
      issues: ['No SEO health snapshot available - run a scan first'],
      internalLinks: 0,
      expectedLinks: classification.expectedLinks,
      status: classification.isLegacyTool ? 'Legacy' : 'Needs Review',
      clusterId: classification.clusterId,
      classification: {
        isLegacyTool: classification.isLegacyTool,
        isCmsTool: classification.isCmsTool,
        isCmsArticle: classification.isCmsArticle,
        isPillar: classification.isPillar,
        isOtherCms: classification.isOtherCms,
      },
    };
  }

  if (classification.isLegacyTool) {
    return {
      urlId: url.id,
      slug,
      pageType,
      healthScore: snapshot.overall_score,
      isReady: false,
      needsManualReview: false,
      issues: ['Legacy tool - not in CMS architecture'],
      internalLinks: snapshot.internal_links_out_count,
      expectedLinks: null,
      status: 'Legacy',
      clusterId: null,
      classification: {
        isLegacyTool: true,
        isCmsTool: false,
        isCmsArticle: false,
        isPillar: false,
        isOtherCms: false,
      },
    };
  }

  if (snapshot.status_code !== 200) {
    issues.push(`Page returns HTTP ${snapshot.status_code} (must be 200)`);
  }

  if (snapshot.robots_index === 'noindex') {
    issues.push('Robots meta is set to noindex');
  }

  if (snapshot.overall_score < SEO_THRESHOLDS.MIN_READY_SCORE) {
    issues.push(`Health score ${snapshot.overall_score} is below minimum ${SEO_THRESHOLDS.MIN_READY_SCORE}`);
  }

  if (!snapshot.has_title) {
    issues.push('Missing page title');
  }

  if (!snapshot.has_h1) {
    issues.push('Missing H1 heading');
  }

  if (!snapshot.has_meta_description) {
    issues.push('Missing meta description');
  }

  const requiresSchema = ['tool', 'article', 'blog'].includes(pageType);
  if (requiresSchema && !snapshot.has_expected_schema) {
    issues.push(`Missing structured schema for ${pageType} page`);
  }

  const minWords = pageType === 'article' 
    ? SEO_THRESHOLDS.MIN_WORD_COUNT_ARTICLE 
    : SEO_THRESHOLDS.MIN_WORD_COUNT_OTHER;
  
  if (snapshot.word_count < minWords) {
    issues.push(`Word count ${snapshot.word_count} is below minimum ${minWords} for ${pageType}`);
  }

  const actualLinks = snapshot.internal_links_out_count;
  const expectedLinks = classification.expectedLinks;

  if (expectedLinks !== null && actualLinks < expectedLinks) {
    issues.push(`Only ${actualLinks} internal links (expected ${expectedLinks})`);
  } else if (expectedLinks === null && actualLinks < SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS) {
    issues.push(`Only ${actualLinks} internal links (minimum ${SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS})`);
  }

  const technicallyReady = issues.length === 0;
  const meetsLinkRequirement = expectedLinks !== null 
    ? actualLinks >= expectedLinks 
    : actualLinks >= SEO_THRESHOLDS.BASELINE_INTERNAL_LINKS;

  let status: 'Ready' | 'Needs Links' | 'Needs Review' | 'Legacy' = classification.status;
  
  if (!meetsLinkRequirement) {
    status = 'Needs Links';
  } else if (!technicallyReady || !manualReviewPassed) {
    status = 'Needs Review';
  } else {
    status = 'Ready';
  }

  if (!manualReviewPassed && technicallyReady && meetsLinkRequirement) {
    return {
      urlId: url.id,
      slug,
      pageType,
      healthScore: snapshot.overall_score,
      isReady: false,
      needsManualReview: true,
      issues: ['Awaiting manual visual review'],
      internalLinks: actualLinks,
      expectedLinks,
      status: 'Needs Review',
      clusterId: classification.clusterId,
      classification: {
        isLegacyTool: classification.isLegacyTool,
        isCmsTool: classification.isCmsTool,
        isCmsArticle: classification.isCmsArticle,
        isPillar: classification.isPillar,
        isOtherCms: classification.isOtherCms,
      },
    };
  }

  if (!manualReviewPassed) {
    issues.push('Manual visual review not yet passed');
  }

  return {
    urlId: url.id,
    slug,
    pageType,
    healthScore: snapshot.overall_score,
    isReady: technicallyReady && manualReviewPassed && meetsLinkRequirement,
    needsManualReview: technicallyReady && meetsLinkRequirement && !manualReviewPassed,
    issues,
    internalLinks: actualLinks,
    expectedLinks,
    status,
    clusterId: classification.clusterId,
    classification: {
      isLegacyTool: classification.isLegacyTool,
      isCmsTool: classification.isCmsTool,
      isCmsArticle: classification.isCmsArticle,
      isPillar: classification.isPillar,
      isOtherCms: classification.isOtherCms,
    },
  };
}

export async function runReadyInspector(): Promise<{
  summary: InspectorSummary;
  results: ReadinessResult[];
}> {
  const cmsToolSlugs = await getCmsToolSlugs();
  const cmsArticleSlugs = await getCmsArticleSlugs();

  const unindexedUrls = await query(
    `SELECT id, url, type, is_indexed, manual_review_passed 
     FROM global_urls 
     WHERE is_indexed = false 
       AND url NOT LIKE '/admin%'
       AND url NOT LIKE '/api%'
       AND url NOT LIKE '/login%'
       AND url NOT LIKE '/dashboard%'
     ORDER BY url ASC`
  );

  const results: ReadinessResult[] = [];
  let readyCount = 0;
  let needsLinksCount = 0;
  let needsReviewCount = 0;
  let legacyCount = 0;
  let noSnapshotCount = 0;
  let errors = 0;

  for (const url of unindexedUrls.rows as unknown as UrlRecord[]) {
    try {
      const snapshotResult = await query(
        `SELECT overall_score, status_code, word_count, has_title, has_h1, 
                has_meta_description, has_expected_schema, robots_index, internal_links_out_count
         FROM seo_health_snapshots 
         WHERE slug = $1 
         ORDER BY snapshot_date DESC 
         LIMIT 1`,
        [url.url]
      );

      const snapshot = snapshotResult.rows[0] as unknown as SnapshotRecord | undefined;
      
      const classification = await classifyUrl(
        url.url,
        snapshot?.internal_links_out_count ?? 0,
        snapshot?.overall_score ?? null,
        url.manual_review_passed,
        cmsToolSlugs,
        cmsArticleSlugs
      );

      const result = evaluateReadiness(url, snapshot || null, url.manual_review_passed, classification);
      results.push(result);

      if (!snapshot) {
        noSnapshotCount++;
      }

      switch (result.status) {
        case 'Ready':
          readyCount++;
          break;
        case 'Needs Links':
          needsLinksCount++;
          break;
        case 'Needs Review':
          needsReviewCount++;
          break;
        case 'Legacy':
          legacyCount++;
          break;
      }

      await query(
        `UPDATE global_urls 
         SET last_health_score = $1, is_ready_to_index = $2 
         WHERE id = $3`,
        [result.healthScore, result.isReady, url.id]
      );
    } catch (error) {
      console.error(`Error evaluating ${url.url}:`, error);
      errors++;
      results.push({
        urlId: url.id,
        slug: url.url,
        pageType: url.type || 'unknown',
        healthScore: null,
        isReady: false,
        needsManualReview: false,
        issues: ['Error during evaluation'],
        internalLinks: 0,
        expectedLinks: null,
        status: 'Needs Review',
        clusterId: null,
        classification: {
          isLegacyTool: false,
          isCmsTool: false,
          isCmsArticle: false,
          isPillar: false,
          isOtherCms: false,
        },
      });
    }
  }

  return {
    summary: {
      evaluated: unindexedUrls.rows.length,
      readyCount,
      needsLinksCount,
      needsReviewCount,
      legacyCount,
      noSnapshotCount,
      errors,
    },
    results,
  };
}

export async function indexReadyPages(): Promise<{
  indexedCount: number;
  indexedSlugs: string[];
}> {
  const readyPages = await query(
    `SELECT id, url FROM global_urls 
     WHERE is_indexed = false AND is_ready_to_index = true
       AND url NOT LIKE '/admin%'
       AND url NOT LIKE '/api%'
       AND url NOT LIKE '/login%'
       AND url NOT LIKE '/dashboard%'`
  );

  const indexedSlugs: string[] = [];

  for (const page of readyPages.rows as { id: string; url: string }[]) {
    await query(
      `UPDATE global_urls 
       SET is_indexed = true, indexed_at = NOW(), is_ready_to_index = false 
       WHERE id = $1`,
      [page.id]
    );
    indexedSlugs.push(page.url);
  }

  return {
    indexedCount: indexedSlugs.length,
    indexedSlugs,
  };
}

export async function toggleManualReview(
  urlId: string,
  passed: boolean
): Promise<{ isReadyToIndex: boolean; status: string }> {
  await query(
    `UPDATE global_urls SET manual_review_passed = $1 WHERE id = $2`,
    [passed, urlId]
  );

  const cmsToolSlugs = await getCmsToolSlugs();
  const cmsArticleSlugs = await getCmsArticleSlugs();

  const urlResult = await query(
    `SELECT id, url, type, is_indexed, manual_review_passed FROM global_urls WHERE id = $1`,
    [urlId]
  );
  
  if (urlResult.rows.length === 0) {
    return { isReadyToIndex: false, status: 'Needs Review' };
  }

  const url = urlResult.rows[0] as unknown as UrlRecord;
  
  const snapshotResult = await query(
    `SELECT overall_score, status_code, word_count, has_title, has_h1, 
            has_meta_description, has_expected_schema, robots_index, internal_links_out_count
     FROM seo_health_snapshots 
     WHERE slug = $1 
     ORDER BY snapshot_date DESC 
     LIMIT 1`,
    [url.url]
  );

  const snapshot = snapshotResult.rows[0] as unknown as SnapshotRecord | undefined;
  
  const classification = await classifyUrl(
    url.url,
    snapshot?.internal_links_out_count ?? 0,
    snapshot?.overall_score ?? null,
    passed,
    cmsToolSlugs,
    cmsArticleSlugs
  );

  const result = evaluateReadiness(url, snapshot || null, passed, classification);

  await query(
    `UPDATE global_urls SET is_ready_to_index = $1 WHERE id = $2`,
    [result.isReady, urlId]
  );

  return { isReadyToIndex: result.isReady, status: result.status };
}

export async function getUnindexedPagesWithStatus(): Promise<{
  pages: Array<{
    id: string;
    url: string;
    type: string;
    last_health_score: number | null;
    is_ready_to_index: boolean;
    manual_review_passed: boolean;
    word_count: number | null;
    internal_links: number;
    internal_links_in: number;
    expected_links: number | null;
    issues: string[];
    needsManualReview?: boolean;
    status: 'Ready' | 'Needs Links' | 'Needs Review' | 'Legacy';
    clusterId: string | null;
    classification: {
      isLegacyTool: boolean;
      isCmsTool: boolean;
      isCmsArticle: boolean;
      isPillar: boolean;
      isOtherCms: boolean;
    };
  }>;
  stats: {
    total: number;
    ready: number;
    needsLinks: number;
    needsReview: number;
    legacy: number;
  };
}> {
  const cmsToolSlugs = await getCmsToolSlugs();
  const cmsArticleSlugs = await getCmsArticleSlugs();

  const urlsResult = await query(
    `SELECT g.id, g.url, g.type, g.last_health_score, g.is_ready_to_index, g.manual_review_passed,
            s.word_count, s.internal_links_out_count, s.internal_links_in_count, s.has_title, s.has_h1, s.has_meta_description,
            s.has_expected_schema, s.status_code, s.robots_index, s.overall_score
     FROM global_urls g
     LEFT JOIN LATERAL (
       SELECT * FROM seo_health_snapshots 
       WHERE slug = g.url 
       ORDER BY snapshot_date DESC 
       LIMIT 1
     ) s ON true
     WHERE g.is_indexed = false
       AND g.url NOT LIKE '/admin%'
       AND g.url NOT LIKE '/api%'
       AND g.url NOT LIKE '/login%'
       AND g.url NOT LIKE '/dashboard%'
     ORDER BY g.url ASC`
  );

  const pages = await Promise.all(urlsResult.rows.map(async (row: any) => {
    const snapshot = row.overall_score !== null ? {
      overall_score: row.overall_score,
      status_code: row.status_code,
      word_count: row.word_count,
      has_title: row.has_title,
      has_h1: row.has_h1,
      has_meta_description: row.has_meta_description,
      has_expected_schema: row.has_expected_schema,
      robots_index: row.robots_index,
      internal_links_out_count: row.internal_links_out_count,
    } : null;

    const classification = await classifyUrl(
      row.url,
      snapshot?.internal_links_out_count ?? 0,
      snapshot?.overall_score ?? null,
      row.manual_review_passed ?? false,
      cmsToolSlugs,
      cmsArticleSlugs
    );

    const result = evaluateReadiness(
      {
        id: row.id,
        url: row.url,
        type: row.type,
        is_indexed: false,
        manual_review_passed: row.manual_review_passed,
      },
      snapshot,
      row.manual_review_passed,
      classification
    );

    return {
      id: row.id,
      url: row.url,
      type: row.type || 'static',
      last_health_score: snapshot?.overall_score ?? row.last_health_score,
      is_ready_to_index: result.isReady,
      manual_review_passed: row.manual_review_passed,
      word_count: row.word_count,
      internal_links: row.internal_links_out_count ?? 0,
      internal_links_in: row.internal_links_in_count ?? 0,
      expected_links: result.expectedLinks,
      issues: result.issues,
      needsManualReview: result.needsManualReview,
      status: result.status,
      clusterId: result.clusterId,
      classification: result.classification,
    };
  }));

  const stats = {
    total: pages.length,
    ready: pages.filter((p: any) => p.status === 'Ready').length,
    needsLinks: pages.filter((p: any) => p.status === 'Needs Links').length,
    needsReview: pages.filter((p: any) => p.status === 'Needs Review').length,
    legacy: pages.filter((p: any) => p.status === 'Legacy').length,
  };

  return { pages, stats };
}
