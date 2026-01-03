import { validateUrlSafety } from './ssrf';

export interface FetchResult {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  errorType: string | null;
  contentType: string | null;
  html: string | null;
  responseMs: number;
  isHtml: boolean;
}

const USER_AGENT = 'VCM-SiteScan/1.0 (+https://vcmsuite.com)';
const FETCH_TIMEOUT = 15000;

export async function fetchPage(url: string): Promise<FetchResult> {
  const start = Date.now();

  const safetyCheck = await validateUrlSafety(url);
  if (!safetyCheck.safe) {
    return {
      url,
      finalUrl: url,
      statusCode: null,
      errorType: safetyCheck.error || 'ssrf_blocked',
      contentType: null,
      html: null,
      responseMs: Date.now() - start,
      isHtml: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

    let html: string | null = null;
    if (isHtml) {
      html = await response.text();
    }

    return {
      url,
      finalUrl: response.url,
      statusCode: response.status,
      errorType: null,
      contentType,
      html,
      responseMs: Date.now() - start,
      isHtml,
    };
  } catch (err: unknown) {
    const responseMs = Date.now() - start;
    let errorType = 'unknown';

    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (err.name === 'AbortError' || msg.includes('timeout')) {
        errorType = 'timeout';
      } else if (msg.includes('dns') || msg.includes('getaddrinfo') || msg.includes('enotfound')) {
        errorType = 'dns';
      } else if (msg.includes('ssl') || msg.includes('cert') || msg.includes('tls')) {
        errorType = 'ssl';
      } else if (msg.includes('econnrefused') || msg.includes('econnreset') || msg.includes('connect')) {
        errorType = 'connect';
      }
    }

    return {
      url,
      finalUrl: url,
      statusCode: null,
      errorType,
      contentType: null,
      html: null,
      responseMs,
      isHtml: false,
    };
  }
}

export async function checkUrl(url: string): Promise<{
  statusCode: number | null;
  errorType: string | null;
  responseMs: number;
}> {
  const start = Date.now();

  const safetyCheck = await validateUrlSafety(url);
  if (!safetyCheck.safe) {
    return {
      statusCode: null,
      errorType: safetyCheck.error || 'ssrf_blocked',
      responseMs: Date.now() - start,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      statusCode: response.status,
      errorType: null,
      responseMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const responseMs = Date.now() - start;
    let errorType = 'unknown';

    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (err.name === 'AbortError' || msg.includes('timeout')) {
        errorType = 'timeout';
      } else if (msg.includes('dns') || msg.includes('enotfound')) {
        errorType = 'dns';
      } else if (msg.includes('ssl') || msg.includes('cert')) {
        errorType = 'ssl';
      } else if (msg.includes('econnrefused') || msg.includes('econnreset')) {
        errorType = 'connect';
      }
    }

    return { statusCode: null, errorType, responseMs };
  }
}
