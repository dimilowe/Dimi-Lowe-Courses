import { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { getSiteUrl } from '@/lib/site-url';
import { normalizePathname } from '@/lib/seo/urlNormalization';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const registryResult = await query(
    `SELECT url, canonical, updated_at 
     FROM global_urls 
     WHERE is_indexed = true 
     ORDER BY url ASC`
  );

  return registryResult.rows.map((entry: any) => ({
    url: `${baseUrl}${normalizePathname(entry.canonical || entry.url || "/")}`,
    lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
    changeFrequency: getChangeFrequency(entry.url),
    priority: getPriority(entry.url),
  }));
}

function getChangeFrequency(url: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (url === '/') return 'daily';
  if (url.startsWith('/newsletter') || url.startsWith('/ideas') || url.startsWith('/answers')) return 'daily';
  if (url.startsWith('/tools') || url.startsWith('/articles')) return 'weekly';
  if (url.startsWith('/products')) return 'weekly';
  return 'weekly';
}

function getPriority(url: string): number {
  if (url === '/') return 1;
  if (url === '/tools' || url === '/newsletter' || url === '/ideas' || url === '/answers') return 0.9;
  if (url.startsWith('/tools/')) return 0.8;
  if (url.startsWith('/newsletter/') || url.startsWith('/articles/')) return 0.8;
  if (url.startsWith('/products/')) return 0.8;
  if (url.startsWith('/ideas/') || url.startsWith('/answers/')) return 0.7;
  return 0.6;
}
