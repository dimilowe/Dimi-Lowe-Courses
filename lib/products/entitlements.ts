import { query } from "@/lib/db";

export interface EntitledProduct {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_type: string;
  thumbnail_url: string | null;
  download_url: string | null;
  external_url: string | null;
  created_at: Date;
}

type EntitlementMode = "product_id" | "product_slug" | "both" | "none";

let entitlementModeCache: EntitlementMode | null = null;

async function getEntitlementMode(): Promise<EntitlementMode> {
  if (entitlementModeCache) return entitlementModeCache;

  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'entitlements'
       AND column_name IN ('product_id', 'product_slug')`
  );

  const cols = new Set(result.rows.map((row: { column_name: string }) => row.column_name));
  const hasProductId = cols.has("product_id");
  const hasProductSlug = cols.has("product_slug");

  if (hasProductId && hasProductSlug) {
    entitlementModeCache = "both";
  } else if (hasProductId) {
    entitlementModeCache = "product_id";
  } else if (hasProductSlug) {
    entitlementModeCache = "product_slug";
  } else {
    entitlementModeCache = "none";
  }

  return entitlementModeCache;
}

export async function getEntitledProductsForUser(userId: string): Promise<EntitledProduct[]> {
  const mode = await getEntitlementMode();

  if (mode === "none") return [];

  if (mode === "both") {
    const result = await query(
      `SELECT DISTINCT ON (p.id)
        p.id::text AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.type AS product_type,
        p.thumbnail_url,
        p.download_url,
        p.external_url,
        e.created_at
       FROM entitlements e
       JOIN products p
         ON (e.product_id = p.id OR e.product_slug = p.slug)
       WHERE e.user_id = $1
       ORDER BY p.id, e.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  if (mode === "product_id") {
    const result = await query(
      `SELECT 
        p.id::text AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.type AS product_type,
        p.thumbnail_url,
        p.download_url,
        p.external_url,
        e.created_at
       FROM entitlements e
       JOIN products p ON e.product_id = p.id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  const result = await query(
    `SELECT 
      p.id::text AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.type AS product_type,
      p.thumbnail_url,
      p.download_url,
      p.external_url,
      e.created_at
     FROM entitlements e
     JOIN products p ON e.product_slug = p.slug
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function userHasProductEntitlement(
  userId: string,
  productId: number,
  productSlug: string
): Promise<boolean> {
  const mode = await getEntitlementMode();

  if (mode === "none") return false;

  if (mode === "both") {
    const result = await query(
      `SELECT 1
       FROM entitlements
       WHERE user_id = $1
         AND (product_id = $2 OR product_slug = $3)
       LIMIT 1`,
      [userId, productId, productSlug]
    );
    return result.rows.length > 0;
  }

  if (mode === "product_id") {
    const result = await query(
      `SELECT 1
       FROM entitlements
       WHERE user_id = $1
         AND product_id = $2
       LIMIT 1`,
      [userId, productId]
    );
    return result.rows.length > 0;
  }

  const result = await query(
    `SELECT 1
     FROM entitlements
     WHERE user_id = $1
       AND product_slug = $2
     LIMIT 1`,
    [userId, productSlug]
  );
  return result.rows.length > 0;
}
