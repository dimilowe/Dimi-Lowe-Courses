export interface ScanConfig {
  scanId: string;
  startUrl: string;
  domain: string;
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  includeExternal: boolean;
  stripQueryParams: boolean;
  soft404Patterns: string[];
}

export interface ScanProgress {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  startedAt: Date | null;
  finishedAt: Date | null;
  pagesCrawled: number;
  linksChecked: number;
  summaryJson: ScanSummary;
  errorText: string | null;
}

export interface ScanSummary {
  totalPages?: number;
  totalLinks?: number;
  brokenLinks?: number;
  soft404s?: number;
  redirects?: number;
  errors?: number;
}

export interface PageResult {
  url: string;
  statusCode: number | null;
  errorType: string | null;
  isSoft404: boolean;
  contentType: string | null;
  title: string | null;
  responseMs: number;
  depth: number;
}

export interface LinkResult {
  sourceUrl: string;
  targetUrl: string;
  isInternal: boolean;
  linkType: 'a' | 'canonical' | 'og' | 'other';
  anchorText: string | null;
  targetStatusCode: number | null;
  targetErrorType: string | null;
  targetIsSoft404: boolean;
}

export interface BrokenTarget {
  targetUrl: string;
  statusCode: number | null;
  errorType: string | null;
  isSoft404: boolean;
  timesFound: number;
  sources: { sourceUrl: string; anchorText: string | null }[];
}

export interface SourcePage {
  sourceUrl: string;
  brokenCount: number;
  brokenLinks: {
    targetUrl: string;
    statusCode: number | null;
    errorType: string | null;
    isSoft404: boolean;
    anchorText: string | null;
  }[];
}

export interface CrawlQueueItem {
  url: string;
  depth: number;
}
