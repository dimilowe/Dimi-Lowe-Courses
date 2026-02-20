export interface PostPurchaseOffersMeta {
  upsell_product_id?: number;
  downsell_product_id?: number;
  upsell_headline?: string;
  upsell_description?: string;
  upsell_cta_label?: string;
  downsell_headline?: string;
  downsell_description?: string;
  downsell_cta_label?: string;
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

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function extractPostPurchaseOffersMeta(meta: unknown): PostPurchaseOffersMeta | null {
  const parsedMeta = toObject(meta);
  if (!parsedMeta) return null;

  const raw = toObject(parsedMeta.post_purchase_offers);
  if (!raw) return null;

  const result: PostPurchaseOffersMeta = {
    upsell_product_id: toPositiveInt(raw.upsell_product_id),
    downsell_product_id: toPositiveInt(raw.downsell_product_id),
    upsell_headline: toTrimmedString(raw.upsell_headline),
    upsell_description: toTrimmedString(raw.upsell_description),
    upsell_cta_label: toTrimmedString(raw.upsell_cta_label),
    downsell_headline: toTrimmedString(raw.downsell_headline),
    downsell_description: toTrimmedString(raw.downsell_description),
    downsell_cta_label: toTrimmedString(raw.downsell_cta_label),
  };

  const hasOfferIds = Boolean(result.upsell_product_id || result.downsell_product_id);
  return hasOfferIds ? result : null;
}

