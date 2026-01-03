import { fetchPage, checkUrl } from './fetcher';
import { parseHtml, detectSoft404 } from './parser';
import { isInternalUrl, normalizeUrl } from './urlUtils';
import * as db from './db';
import type { ScanConfig, LinkResult, CrawlQueueItem } from './types';

const BATCH_SIZE = 25;

export async function runScanTick(scanId: string): Promise<{
  done: boolean;
  pagesCrawled: number;
  linksChecked: number;
  error?: string;
}> {
  const config = await db.getScanConfig(scanId);
  if (!config) {
    return { done: true, pagesCrawled: 0, linksChecked: 0, error: 'Scan not found' };
  }

  const scan = await db.getScan(scanId);
  if (!scan) {
    return { done: true, pagesCrawled: 0, linksChecked: 0, error: 'Scan not found' };
  }

  if (scan.status === 'done' || scan.status === 'failed') {
    return { done: true, pagesCrawled: scan.pagesCrawled, linksChecked: scan.linksChecked };
  }

  if (scan.status === 'queued') {
    await db.updateScanStatus(scanId, 'running', { startedAt: new Date() });
    
    const startNorm = normalizeUrl(config.startUrl, config.startUrl, config.stripQueryParams);
    if (startNorm) {
      await db.insertLinks(scanId, [{
        sourceUrl: '__seed__',
        targetUrl: startNorm,
        isInternal: true,
        linkType: 'other',
        anchorText: null,
        targetStatusCode: null,
        targetErrorType: null,
        targetIsSoft404: false,
      }]);
    }
  }

  const visited = await db.getVisitedUrls(scanId);
  
  if (visited.size >= config.maxPages) {
    await finalizeScan(scanId);
    const finalScan = await db.getScan(scanId);
    return { 
      done: true, 
      pagesCrawled: finalScan?.pagesCrawled || visited.size, 
      linksChecked: finalScan?.linksChecked || 0 
    };
  }

  const queue = await db.getQueuedUrls(scanId);
  
  if (queue.length === 0) {
    await finalizeScan(scanId);
    const finalScan = await db.getScan(scanId);
    return { 
      done: true, 
      pagesCrawled: finalScan?.pagesCrawled || visited.size, 
      linksChecked: finalScan?.linksChecked || 0 
    };
  }

  const batch = queue
    .filter(item => !visited.has(item.url) && item.depth <= config.maxDepth)
    .slice(0, Math.min(BATCH_SIZE, config.maxPages - visited.size));

  if (batch.length === 0) {
    await finalizeScan(scanId);
    const finalScan = await db.getScan(scanId);
    return { 
      done: true, 
      pagesCrawled: finalScan?.pagesCrawled || visited.size, 
      linksChecked: finalScan?.linksChecked || 0 
    };
  }

  const concurrency = Math.min(config.concurrency, batch.length);
  const chunks: CrawlQueueItem[][] = [];
  for (let i = 0; i < batch.length; i += concurrency) {
    chunks.push(batch.slice(i, i + concurrency));
  }

  let totalLinksFound = 0;

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(item => processUrl(scanId, config, item.url, item.depth))
    );
    totalLinksFound += results.reduce((sum, r) => sum + r.linksFound, 0);
  }

  const newVisited = await db.getVisitedUrls(scanId);
  await db.updateScanProgress(scanId, newVisited.size, scan.linksChecked + totalLinksFound);

  const remainingQueue = await db.getQueuedUrls(scanId);
  const isDone = remainingQueue.length === 0 || newVisited.size >= config.maxPages;

  if (isDone) {
    await finalizeScan(scanId);
  }

  const updatedScan = await db.getScan(scanId);
  return {
    done: isDone,
    pagesCrawled: updatedScan?.pagesCrawled || newVisited.size,
    linksChecked: updatedScan?.linksChecked || 0,
  };
}

async function processUrl(
  scanId: string,
  config: ScanConfig,
  url: string,
  depth: number
): Promise<{ linksFound: number }> {
  const result = await fetchPage(url);

  const isSoft404 = result.html 
    ? detectSoft404(result.html, result.statusCode || 0, config.soft404Patterns)
    : false;

  await db.insertPage(scanId, {
    url,
    statusCode: result.statusCode,
    errorType: result.errorType,
    isSoft404,
    contentType: result.contentType,
    title: result.html ? extractTitle(result.html) : null,
    responseMs: result.responseMs,
    depth,
  });

  if (!result.isHtml || !result.html) {
    return { linksFound: 0 };
  }

  const parsed = parseHtml(result.html, url, config.stripQueryParams);
  
  const links: LinkResult[] = [];
  const externalChecks: { link: typeof parsed.links[0]; isInternal: boolean }[] = [];

  for (const link of parsed.links) {
    const isInternal = isInternalUrl(link.href, config.domain);
    
    if (isInternal) {
      links.push({
        sourceUrl: url,
        targetUrl: link.href,
        isInternal: true,
        linkType: link.type,
        anchorText: link.anchorText,
        targetStatusCode: null,
        targetErrorType: null,
        targetIsSoft404: false,
      });
    } else if (config.includeExternal) {
      externalChecks.push({ link, isInternal: false });
    }
  }

  if (externalChecks.length > 0) {
    const checkResults = await Promise.all(
      externalChecks.slice(0, 10).map(async ({ link }) => {
        const check = await checkUrl(link.href);
        return {
          sourceUrl: url,
          targetUrl: link.href,
          isInternal: false,
          linkType: link.type,
          anchorText: link.anchorText,
          targetStatusCode: check.statusCode,
          targetErrorType: check.errorType,
          targetIsSoft404: false,
        } as LinkResult;
      })
    );
    links.push(...checkResults);
  }

  if (links.length > 0) {
    await db.insertLinks(scanId, links);
  }

  return { linksFound: links.length };
}

async function finalizeScan(scanId: string): Promise<void> {
  const brokenTargets = await db.getBrokenTargets(scanId);
  const scan = await db.getScan(scanId);
  
  const summary = {
    totalPages: scan?.pagesCrawled || 0,
    totalLinks: scan?.linksChecked || 0,
    brokenLinks: brokenTargets.length,
    soft404s: brokenTargets.filter(t => t.isSoft404).length,
    errors: brokenTargets.filter(t => t.errorType !== null).length,
  };

  await db.updateScanStatus(scanId, 'done', {
    finishedAt: new Date(),
    summaryJson: summary,
  });
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim().slice(0, 200) : null;
}

export async function markScanFailed(scanId: string, error: string): Promise<void> {
  await db.updateScanStatus(scanId, 'failed', {
    finishedAt: new Date(),
    errorText: error,
  });
}
