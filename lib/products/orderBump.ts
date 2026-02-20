export interface OrderBumpMeta {
  product_id: number;
  headline?: string;
  description?: string;
  cta_label?: string;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return toObject(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function extractOrderBumpMeta(meta: unknown): OrderBumpMeta | null {
  const parsedMeta = toObject(meta);
  if (!parsedMeta) return null;

  const raw = toObject(parsedMeta.order_bump);
  if (!raw) return null;

  const productId = Number.parseInt(String(raw.product_id || ""), 10);
  if (!Number.isFinite(productId) || productId <= 0) return null;

  const headline = typeof raw.headline === "string" ? raw.headline.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const ctaLabel = typeof raw.cta_label === "string" ? raw.cta_label.trim() : "";

  return {
    product_id: productId,
    headline: headline || undefined,
    description: description || undefined,
    cta_label: ctaLabel || undefined,
  };
}

