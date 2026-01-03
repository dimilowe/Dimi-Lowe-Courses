import * as cheerio from 'cheerio';
import { normalizeUrl } from './urlUtils';

export interface ParsedLink {
  href: string;
  type: 'a' | 'canonical' | 'og' | 'other';
  anchorText: string | null;
}

export interface ParsedPage {
  title: string | null;
  links: ParsedLink[];
}

export function parseHtml(html: string, baseUrl: string, stripQueryParams: boolean): ParsedPage {
  const $ = cheerio.load(html);
  const links: ParsedLink[] = [];
  const seen = new Set<string>();

  const title = $('title').first().text().trim() || null;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const normalized = normalizeUrl(href, baseUrl, stripQueryParams);
    if (!normalized || seen.has(normalized)) return;

    seen.add(normalized);
    links.push({
      href: normalized,
      type: 'a',
      anchorText: $(el).text().trim().slice(0, 200) || null,
    });
  });

  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    const normalized = normalizeUrl(canonical, baseUrl, stripQueryParams);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      links.push({ href: normalized, type: 'canonical', anchorText: null });
    }
  }

  const ogUrl = $('meta[property="og:url"]').attr('content');
  if (ogUrl) {
    const normalized = normalizeUrl(ogUrl, baseUrl, stripQueryParams);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      links.push({ href: normalized, type: 'og', anchorText: null });
    }
  }

  return { title, links };
}

export function detectSoft404(html: string, statusCode: number, customPatterns: string[]): boolean {
  if (statusCode !== 200) return false;

  const lowerHtml = html.toLowerCase();

  const defaultPatterns = [
    'page not found',
    'not found',
    "doesn't exist",
    'does not exist',
    'no longer available',
    'has been removed',
    'could not be found',
    '404 error',
    'error 404',
  ];

  const allPatterns = [...defaultPatterns, ...customPatterns.map(p => p.toLowerCase())];

  const $ = cheerio.load(html);
  const title = $('title').text().toLowerCase();
  
  if (title.includes('404') || title.includes('not found') || title.includes('page not found')) {
    return true;
  }

  const bodyText = $('body').text().toLowerCase().slice(0, 5000);
  
  for (const pattern of allPatterns) {
    if (bodyText.includes(pattern)) {
      const h1 = $('h1').first().text().toLowerCase();
      const h2 = $('h2').first().text().toLowerCase();
      
      if (h1.includes(pattern) || h2.includes(pattern) || title.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}
