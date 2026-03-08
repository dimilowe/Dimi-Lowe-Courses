export interface ProductBundleMeta {
  included_product_ids: number[];
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return toObject(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toPositiveIntList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  const ids = value
    .map((item) => Number.parseInt(String(item), 10))
    .filter((item) => Number.isFinite(item) && item > 0);

  return Array.from(new Set(ids));
}

export function extractBundleMeta(meta: unknown): ProductBundleMeta | null {
  const parsedMeta = toObject(meta);
  if (!parsedMeta) return null;

  const raw = toObject(parsedMeta.bundle);
  if (!raw) return null;

  const includedProductIds = toPositiveIntList(raw.included_product_ids);
  if (includedProductIds.length === 0) return null;

  return {
    included_product_ids: includedProductIds,
  };
}
