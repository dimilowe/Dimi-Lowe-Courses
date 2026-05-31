import { query } from "@/lib/db";
import { hasGlobalSubscription } from "@/lib/subscription/capabilities";

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

  const cols = new Set(
    (result.rows as Array<{ column_name: string }>).map((row) => row.column_name)
  );
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
  const numericUserId = Number.parseInt(userId, 10);
  const productsById = new Map<string, EntitledProduct>();

  if (Number.isFinite(numericUserId) && await hasGlobalSubscription(numericUserId)) {
    const membershipResult = await query(
      `SELECT
        p.id::text AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.type AS product_type,
        p.thumbnail_url,
        p.download_url,
        p.external_url,
        NOW() AS created_at
       FROM products p
       WHERE p.visibility = 'public'
         AND p.type != 'invisible'
         AND p.price_type IN ('membership', 'free')
       ORDER BY p.created_at DESC`
    );
    for (const product of membershipResult.rows as unknown as EntitledProduct[]) {
      productsById.set(product.product_id, product);
    }
  }

  const mode = await getEntitlementMode();

  if (mode === "none") return Array.from(productsById.values());

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
    for (const product of result.rows as unknown as EntitledProduct[]) {
      productsById.set(product.product_id, product);
    }
    return Array.from(productsById.values());
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
    for (const product of result.rows as unknown as EntitledProduct[]) {
      productsById.set(product.product_id, product);
    }
    return Array.from(productsById.values());
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
  for (const product of result.rows as unknown as EntitledProduct[]) {
    productsById.set(product.product_id, product);
  }
  return Array.from(productsById.values());
}

export async function userHasProductEntitlement(
  userId: string,
  productId: number,
  productSlug: string
): Promise<boolean> {
  const numericUserId = Number.parseInt(userId, 10);
  if (Number.isFinite(numericUserId) && await hasGlobalSubscription(numericUserId)) {
    const result = await query(
      `SELECT 1
       FROM products
       WHERE id = $1
         AND slug = $2
         AND visibility = 'public'
         AND type != 'invisible'
         AND price_type IN ('membership', 'free')
       LIMIT 1`,
      [productId, productSlug]
    );
    if (result.rows.length > 0) return true;
  }

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
