import { pool } from '@/lib/db';
import type { ScanConfig, ScanProgress, PageResult, LinkResult, BrokenTarget, SourcePage } from './types';

export async function createScan(config: {
  userId?: string;
  startUrl: string;
  domain: string;
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  includeExternal: boolean;
  stripQueryParams: boolean;
  soft404Patterns: string[];
}): Promise<string> {
  const result = await pool.query(
    `INSERT INTO site_scans (
      user_id, start_url, domain, max_pages, max_depth, concurrency,
      include_external, strip_query_params, soft404_patterns, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued')
    RETURNING id`,
    [
      config.userId || null,
      config.startUrl,
      config.domain,
      config.maxPages,
      config.maxDepth,
      config.concurrency,
      config.includeExternal,
      config.stripQueryParams,
      config.soft404Patterns,
    ]
  );
  return result.rows[0].id;
}

export async function getScan(scanId: string): Promise<ScanProgress | null> {
  const result = await pool.query(
    `SELECT id, status, started_at, finished_at, pages_crawled, links_checked, summary_json, error_text
     FROM site_scans WHERE id = $1`,
    [scanId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    pagesCrawled: row.pages_crawled,
    linksChecked: row.links_checked,
    summaryJson: row.summary_json || {},
    errorText: row.error_text,
  };
}

export async function getScanConfig(scanId: string): Promise<ScanConfig | null> {
  const result = await pool.query(
    `SELECT id, start_url, domain, max_pages, max_depth, concurrency,
            include_external, strip_query_params, soft404_patterns
     FROM site_scans WHERE id = $1`,
    [scanId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    scanId: row.id,
    startUrl: row.start_url,
    domain: row.domain,
    maxPages: row.max_pages,
    maxDepth: row.max_depth,
    concurrency: row.concurrency,
    includeExternal: row.include_external,
    stripQueryParams: row.strip_query_params,
    soft404Patterns: row.soft404_patterns || [],
  };
}

export async function updateScanStatus(
  scanId: string,
  status: string,
  extra?: { startedAt?: Date; finishedAt?: Date; errorText?: string; summaryJson?: object }
): Promise<void> {
  const sets: string[] = ['status = $2'];
  const values: unknown[] = [scanId, status];
  let idx = 3;

  if (extra?.startedAt) {
    sets.push(`started_at = $${idx++}`);
    values.push(extra.startedAt);
  }
  if (extra?.finishedAt) {
    sets.push(`finished_at = $${idx++}`);
    values.push(extra.finishedAt);
  }
  if (extra?.errorText !== undefined) {
    sets.push(`error_text = $${idx++}`);
    values.push(extra.errorText);
  }
  if (extra?.summaryJson) {
    sets.push(`summary_json = $${idx++}`);
    values.push(JSON.stringify(extra.summaryJson));
  }

  await pool.query(
    `UPDATE site_scans SET ${sets.join(', ')} WHERE id = $1`,
    values
  );
}

export async function updateScanProgress(scanId: string, pagesCrawled: number, linksChecked: number): Promise<void> {
  await pool.query(
    `UPDATE site_scans SET pages_crawled = $2, links_checked = $3 WHERE id = $1`,
    [scanId, pagesCrawled, linksChecked]
  );
}

export async function insertPage(scanId: string, page: PageResult): Promise<void> {
  await pool.query(
    `INSERT INTO site_scan_pages (scan_id, url, status_code, error_type, is_soft_404, content_type, title, response_ms, depth)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (scan_id, url) DO UPDATE SET
       status_code = EXCLUDED.status_code,
       error_type = EXCLUDED.error_type,
       is_soft_404 = EXCLUDED.is_soft_404,
       content_type = EXCLUDED.content_type,
       title = EXCLUDED.title,
       response_ms = EXCLUDED.response_ms,
       fetched_at = NOW()`,
    [scanId, page.url, page.statusCode, page.errorType, page.isSoft404, page.contentType, page.title, page.responseMs, page.depth]
  );
}

export async function insertLinks(scanId: string, links: LinkResult[]): Promise<void> {
  if (links.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let idx = 1;

  for (const link of links) {
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    values.push(
      scanId,
      link.sourceUrl,
      link.targetUrl,
      link.isInternal,
      link.linkType,
      link.anchorText,
      link.targetStatusCode,
      link.targetErrorType,
      link.targetIsSoft404
    );
  }

  await pool.query(
    `INSERT INTO site_scan_links (scan_id, source_url, target_url, is_internal, link_type, anchor_text, target_status_code, target_error_type, target_is_soft_404)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

export async function getVisitedUrls(scanId: string): Promise<Set<string>> {
  const result = await pool.query(
    `SELECT url FROM site_scan_pages WHERE scan_id = $1`,
    [scanId]
  );
  return new Set(result.rows.map(r => r.url));
}

export async function getQueuedUrls(scanId: string): Promise<{ url: string; depth: number }[]> {
  const result = await pool.query(
    `SELECT DISTINCT l.target_url as url, COALESCE(p.depth, 0) + 1 as depth
     FROM site_scan_links l
     LEFT JOIN site_scan_pages p ON l.scan_id = p.scan_id AND l.source_url = p.url
     WHERE l.scan_id = $1 
       AND l.is_internal = true
       AND l.target_url NOT IN (SELECT url FROM site_scan_pages WHERE scan_id = $1)
     ORDER BY depth ASC
     LIMIT 100`,
    [scanId]
  );
  return result.rows;
}

export async function getBrokenTargets(scanId: string): Promise<BrokenTarget[]> {
  const result = await pool.query(
    `SELECT 
       l.target_url,
       l.target_status_code as status_code,
       l.target_error_type as error_type,
       l.target_is_soft_404 as is_soft_404,
       COUNT(*) as times_found,
       json_agg(json_build_object('source_url', l.source_url, 'anchor_text', l.anchor_text)) as sources
     FROM site_scan_links l
     WHERE l.scan_id = $1
       AND (l.target_status_code IN (404, 410) 
            OR l.target_status_code >= 500 
            OR l.target_error_type IS NOT NULL 
            OR l.target_is_soft_404 = true)
     GROUP BY l.target_url, l.target_status_code, l.target_error_type, l.target_is_soft_404
     ORDER BY times_found DESC`,
    [scanId]
  );

  return result.rows.map(row => ({
    targetUrl: row.target_url,
    statusCode: row.status_code,
    errorType: row.error_type,
    isSoft404: row.is_soft_404,
    timesFound: parseInt(row.times_found),
    sources: row.sources,
  }));
}

export async function getSourcePages(scanId: string): Promise<SourcePage[]> {
  const result = await pool.query(
    `SELECT 
       l.source_url,
       COUNT(*) as broken_count,
       json_agg(json_build_object(
         'target_url', l.target_url,
         'status_code', l.target_status_code,
         'error_type', l.target_error_type,
         'is_soft_404', l.target_is_soft_404,
         'anchor_text', l.anchor_text
       )) as broken_links
     FROM site_scan_links l
     WHERE l.scan_id = $1
       AND (l.target_status_code IN (404, 410) 
            OR l.target_status_code >= 500 
            OR l.target_error_type IS NOT NULL 
            OR l.target_is_soft_404 = true)
     GROUP BY l.source_url
     ORDER BY broken_count DESC`,
    [scanId]
  );

  return result.rows.map(row => ({
    sourceUrl: row.source_url,
    brokenCount: parseInt(row.broken_count),
    brokenLinks: row.broken_links,
  }));
}

export async function getAllLinks(scanId: string): Promise<{
  sourceUrl: string;
  targetUrl: string;
  statusCode: number | null;
  errorType: string | null;
  isSoft404: boolean;
  anchorText: string | null;
  isInternal: boolean;
}[]> {
  const result = await pool.query(
    `SELECT source_url, target_url, target_status_code as status_code, 
            target_error_type as error_type, target_is_soft_404 as is_soft_404,
            anchor_text, is_internal
     FROM site_scan_links
     WHERE scan_id = $1
     ORDER BY source_url, target_url`,
    [scanId]
  );
  return result.rows.map(row => ({
    sourceUrl: row.source_url,
    targetUrl: row.target_url,
    statusCode: row.status_code,
    errorType: row.error_type,
    isSoft404: row.is_soft_404,
    anchorText: row.anchor_text,
    isInternal: row.is_internal,
  }));
}

export async function countUserScansLastHour(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM site_scans 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}
