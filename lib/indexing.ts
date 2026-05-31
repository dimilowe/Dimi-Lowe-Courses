import { query } from "@/lib/db";

export interface IndexingStatus {
  isIndexed: boolean;
  canonical?: string;
  exists: boolean;
}

export async function getIndexingStatus(url: string): Promise<IndexingStatus> {
  try {
    const result = await query(
      "SELECT is_indexed, canonical FROM global_urls WHERE url = $1",
      [url]
    );

    if (result.rows.length === 0) {
      return { isIndexed: false, exists: false };
    }

    return {
      isIndexed: result.rows[0].is_indexed as boolean,
      canonical: result.rows[0].canonical as string | undefined,
      exists: true,
    };
  } catch (error) {
    console.error("Error checking indexing status:", error);
    return { isIndexed: false, exists: false };
  }
}

export async function registerUrl(
  url: string,
  type: string = "unknown",
  title?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO global_urls (url, type, title, is_indexed)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (url) DO NOTHING`,
      [url, type, title]
    );
  } catch (error) {
    console.error("Error registering URL:", error);
  }
}

export async function getAllIndexedUrls(): Promise<
  Array<{ url: string; canonical?: string; updated_at: Date }>
> {
  try {
    const result = await query(
      `SELECT url, canonical, updated_at 
       FROM global_urls 
       WHERE is_indexed = true 
       ORDER BY url ASC`
    );
    return result.rows as unknown as Array<{ url: string; canonical?: string; updated_at: Date }>;
  } catch (error) {
    console.error("Error fetching indexed URLs:", error);
    return [];
  }
}

export function generateRobotsMetaTag(isIndexed: boolean): string {
  return isIndexed ? "" : '<meta name="robots" content="noindex,nofollow">';
}
