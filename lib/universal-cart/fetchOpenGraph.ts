import { URL } from 'url';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  raw?: Record<string, string>;
}

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  'metadata.google',
  '169.254.',
];

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname.startsWith(blocked) || hostname === blocked) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function fetchOpenGraph(url: string): Promise<OpenGraphData> {
  if (!isSafeUrl(url)) {
    return { domain: extractDomain(url), raw: {} };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VCMBot/1.0; +https://vcmsuite.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { domain: extractDomain(url), raw: {} };
    }

    const html = await response.text();
    const ogData = parseOpenGraphTags(html);

    return {
      title: ogData['og:title'] || ogData['twitter:title'] || extractTitleFromHtml(html),
      description: ogData['og:description'] || ogData['twitter:description'] || ogData['description'],
      image: ogData['og:image'] || ogData['twitter:image'],
      domain: extractDomain(url),
      raw: ogData,
    };
  } catch (error) {
    console.error('[fetchOpenGraph] Error:', error);
    return { domain: extractDomain(url), raw: {} };
  }
}

function parseOpenGraphTags(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const metaRegex = /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*>/gi;
  const metaRegex2 = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["']\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["'][^>]*>/gi;

  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    result[match[1].toLowerCase()] = match[2];
  }
  while ((match = metaRegex2.exec(html)) !== null) {
    result[match[2].toLowerCase()] = match[1];
  }

  return result;
}

function extractTitleFromHtml(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : undefined;
}
