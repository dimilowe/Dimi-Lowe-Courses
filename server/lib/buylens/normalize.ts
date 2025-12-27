import type { RawListing, BuyLensIntent } from "./types";

export function normalizeListings(
  listings: RawListing[],
  intent: BuyLensIntent
): RawListing[] {
  const normalized: RawListing[] = [];
  
  for (const listing of listings) {
    const normalized_listing = { ...listing };
    
    if (
      normalized_listing.price_usd !== undefined &&
      normalized_listing.shipping_usd !== undefined &&
      intent.must_include_shipping_total
    ) {
      normalized_listing.total_usd = normalized_listing.price_usd + normalized_listing.shipping_usd;
    } else if (normalized_listing.price_usd !== undefined && !normalized_listing.total_usd) {
      normalized_listing.total_usd = normalized_listing.price_usd;
    }
    
    if (
      intent.max_budget_usd !== undefined &&
      normalized_listing.total_usd !== undefined &&
      normalized_listing.total_usd > intent.max_budget_usd
    ) {
      continue;
    }
    
    if (intent.condition === "new" && normalized_listing.condition === "used") {
      continue;
    }
    if (intent.condition === "used" && normalized_listing.condition === "new") {
      continue;
    }
    
    normalized.push(normalized_listing);
  }
  
  return normalized;
}

export function deduplicateListings(listings: RawListing[]): RawListing[] {
  const seen = new Map<string, RawListing>();
  
  for (const listing of listings) {
    const key = listing.url.toLowerCase();
    
    if (!seen.has(key)) {
      seen.set(key, listing);
    } else {
      const existing = seen.get(key)!;
      if (listing.confidence > existing.confidence) {
        seen.set(key, listing);
      }
    }
  }
  
  return Array.from(seen.values());
}
