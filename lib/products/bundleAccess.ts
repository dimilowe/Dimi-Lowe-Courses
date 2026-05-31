import { query } from "@/lib/db";
import { extractBundleMeta } from "@/lib/products/bundleMeta";

export interface BundleIncludedProductSummary {
  id: number;
  slug: string;
  name: string;
  type: string;
  visibility: string | null;
  thumbnail_url: string | null;
}

function parsePositiveIntCsv(raw: string | undefined): number[] {
  if (!raw) return [];

  const ids = raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  return Array.from(new Set(ids));
}

async function getExistingProductIds(productIds: number[]): Promise<number[]> {
  if (productIds.length === 0) return [];

  const result = await query(
    `SELECT id
     FROM products
     WHERE id = ANY($1::int[])`,
    [productIds]
  );

  const existing = new Set(
    (result.rows as { id: unknown }[])
      .map((row) => Number.parseInt(String(row.id), 10))
      .filter((value: number) => Number.isFinite(value) && value > 0)
  );

  return productIds.filter((productId) => existing.has(productId));
}

export function extractPurchasedProductIdsFromCheckoutMetadata(
  metadata: Record<string, string | undefined>
): number[] {
  return parsePositiveIntCsv(
    metadata.purchasedProductIds || metadata.productIds || metadata.productId
  );
}

export function extractGrantedProductIdsFromCheckoutMetadata(
  metadata: Record<string, string | undefined>
): number[] {
  return parsePositiveIntCsv(metadata.grantedProductIds);
}

export async function resolveGrantedProductIdsForPurchaseProductId(
  productId: number
): Promise<number[]> {
  const result = await query(
    `SELECT id, to_jsonb(products)->'meta' AS meta
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );

  const product = result.rows[0] as { id: number; meta: unknown } | undefined;
  if (!product) return [];

  const bundleMeta = extractBundleMeta(product.meta);
  if (!bundleMeta) return [productId];

  return getExistingProductIds(bundleMeta.included_product_ids);
}

export async function resolveGrantedProductIdsForPurchaseProductIds(
  productIds: number[]
): Promise<number[]> {
  const uniquePurchasedIds = Array.from(new Set(productIds));
  const resolved = await Promise.all(
    uniquePurchasedIds.map((productId) => resolveGrantedProductIdsForPurchaseProductId(productId))
  );

  return Array.from(new Set(resolved.flat()));
}

export async function getBundleIncludedProducts(
  productId: number
): Promise<BundleIncludedProductSummary[]> {
  const result = await query(
    `SELECT to_jsonb(products)->'meta' AS meta
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );

  const product = result.rows[0] as { meta: unknown } | undefined;
  const bundleMeta = extractBundleMeta(product?.meta);
  if (!bundleMeta) return [];

  const includedIds = bundleMeta.included_product_ids;
  if (includedIds.length === 0) return [];

  const includedResult = await query(
    `SELECT id, slug, name, type, visibility, thumbnail_url
     FROM products
     WHERE id = ANY($1::int[])`,
    [includedIds]
  );

  const byId = new Map<number, BundleIncludedProductSummary>();
  for (const row of includedResult.rows) {
    const parsedId = Number.parseInt(String(row.id), 10);
    if (!Number.isFinite(parsedId) || parsedId <= 0) continue;

    byId.set(parsedId, {
      id: parsedId,
      slug: String(row.slug || ""),
      name: String(row.name || ""),
      type: String(row.type || ""),
      visibility: row.visibility ? String(row.visibility) : null,
      thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    });
  }

  return includedIds
    .map((includedId) => byId.get(includedId))
    .filter((item): item is BundleIncludedProductSummary => Boolean(item));
}
