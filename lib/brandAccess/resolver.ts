import { query } from '../db';
import type { ResolverResult, ResolveConfidence, ResolverMethod } from './types';

const USER_AGENT = 'VCMSuiteBot/1.0 (+contact: support@vcmsuite.com)';
const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_DAYS = 7;

const CONTACT_KEYWORDS = [
  'contact',
  'contact-us',
  'support',
  'help',
  'customer-service',
  'press',
  'media',
  'partnerships',
  'affiliate',
  'influencer',
  'collab',
  'pr'
];

const KEYWORD_PRIORITY: Record<string, number> = {
  'contact': 10,
  'contact-us': 10,
  'support': 8,
  'help': 7,
  'customer-service': 6,
  'press': 5,
  'media': 5,
  'partnerships': 4,
  'affiliate': 3,
  'influencer': 3,
  'collab': 2,
  'pr': 2
};

const COMMON_PATHS = [
  '/contact',
  '/contact-us',
  '/pages/contact',
  '/pages/contact-us',
  '/support',
  '/help',
  '/customer-service',
  '/customer-service/contact-us',
  '/hc/en-us/requests/new',
  '/en-us/contact',
  '/pages/help',
  '/pages/faq'
];

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com'];

function normalizeToOrigin(input: string): string | null {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([a-zA-Z0-9.-]+)$/);
  if (!match) return null;
  const domain = match[1].toLowerCase();
  if (FREE_EMAIL_DOMAINS.includes(domain)) return null;
  return domain;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,*/*',
        ...options.headers
      },
      redirect: 'follow'
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    const headRes = await fetchWithTimeout(url, { method: 'HEAD' });
    if (headRes.ok || (headRes.status >= 300 && headRes.status < 400)) {
      return true;
    }
    if (headRes.status === 405) {
      const getRes = await fetchWithTimeout(url, { method: 'GET' });
      return getRes.ok || (getRes.status >= 300 && getRes.status < 400);
    }
    return false;
  } catch {
    try {
      const getRes = await fetchWithTimeout(url, { method: 'GET' });
      return getRes.ok || (getRes.status >= 300 && getRes.status < 400);
    } catch {
      return false;
    }
  }
}

function extractCandidateLinks(html: string, baseUrl: string): { url: string; score: number }[] {
  const candidates: { url: string; score: number }[] = [];
  const seen = new Set<string>();
  
  const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    const lowerHref = href.toLowerCase();
    
    for (const keyword of CONTACT_KEYWORDS) {
      if (lowerHref.includes(keyword)) {
        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(href, baseUrl).href;
        } catch {
          continue;
        }
        
        if (seen.has(absoluteUrl)) continue;
        seen.add(absoluteUrl);
        
        const score = KEYWORD_PRIORITY[keyword] || 1;
        candidates.push({ url: absoluteUrl, score });
        break;
      }
    }
  }
  
  return candidates.sort((a, b) => b.score - a.score);
}

async function checkCache(domain: string): Promise<ResolverResult | null> {
  const result = await query(
    `SELECT website_url, contact_url, confidence, method 
     FROM resolver_cache 
     WHERE domain = $1 AND expires_at > NOW()`,
    [domain]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      website_url: row.website_url,
      contact_url: row.contact_url,
      confidence: row.confidence as ResolveConfidence,
      method: row.method as ResolverMethod
    };
  }
  return null;
}

async function writeCache(domain: string, result: ResolverResult): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
  
  await query(
    `INSERT INTO resolver_cache (domain, website_url, contact_url, confidence, method, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (domain) DO UPDATE SET
       website_url = EXCLUDED.website_url,
       contact_url = EXCLUDED.contact_url,
       confidence = EXCLUDED.confidence,
       method = EXCLUDED.method,
       expires_at = EXCLUDED.expires_at`,
    [domain, result.website_url, result.contact_url, result.confidence, result.method, expiresAt]
  );
}

export async function resolveContactPage(input: {
  website_url?: string;
  email?: string;
}): Promise<ResolverResult> {
  let baseUrl: string | null = null;
  
  if (input.website_url) {
    baseUrl = normalizeToOrigin(input.website_url);
  } else if (input.email) {
    const domain = extractDomainFromEmail(input.email);
    if (domain) {
      baseUrl = `https://${domain}`;
    }
  }
  
  if (!baseUrl) {
    return {
      website_url: input.website_url || '',
      contact_url: null,
      confidence: 'low',
      method: 'none'
    };
  }
  
  const domain = new URL(baseUrl).hostname;
  
  const cached = await checkCache(domain);
  if (cached) {
    return cached;
  }
  
  let html: string;
  try {
    const response = await fetchWithTimeout(baseUrl);
    if (!response.ok) {
      const result: ResolverResult = {
        website_url: baseUrl,
        contact_url: null,
        confidence: 'low',
        method: 'none'
      };
      await writeCache(domain, result);
      return result;
    }
    html = await response.text();
  } catch {
    const result: ResolverResult = {
      website_url: baseUrl,
      contact_url: null,
      confidence: 'low',
      method: 'none'
    };
    await writeCache(domain, result);
    return result;
  }
  
  const candidates = extractCandidateLinks(html, baseUrl);
  
  if (candidates.length > 0) {
    const topCandidates = candidates.slice(0, 5);
    
    for (const candidate of topCandidates) {
      const isValid = await validateUrl(candidate.url);
      if (isValid) {
        const result: ResolverResult = {
          website_url: baseUrl,
          contact_url: candidate.url,
          confidence: 'high',
          method: 'homepage_links'
        };
        await writeCache(domain, result);
        return result;
      }
    }
  }
  
  for (const path of COMMON_PATHS) {
    const testUrl = `${baseUrl}${path}`;
    const isValid = await validateUrl(testUrl);
    if (isValid) {
      const result: ResolverResult = {
        website_url: baseUrl,
        contact_url: testUrl,
        confidence: 'medium',
        method: 'common_paths'
      };
      await writeCache(domain, result);
      return result;
    }
  }
  
  const result: ResolverResult = {
    website_url: baseUrl,
    contact_url: null,
    confidence: 'low',
    method: 'none'
  };
  await writeCache(domain, result);
  return result;
}
