import type { RankedResult, BuyLensIntent } from "./types";

export function generateRunSummary(
  results: RankedResult[],
  intent: BuyLensIntent,
  sortExplanation: string
): string {
  if (results.length === 0) {
    return "No results found matching your criteria.";
  }
  
  const withPrices = results.filter(r => r.price_usd !== undefined);
  
  if (withPrices.length === 0) {
    return `Found ${results.length} listings, but prices were not publicly visible.`;
  }
  
  const prices = withPrices.map(r => r.total_usd ?? r.price_usd!);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const domains = new Set(results.map(r => r.domain));
  
  let summary = `Found ${results.length} options across ${domains.size} source${domains.size > 1 ? "s" : ""}. `;
  
  if (minPrice === maxPrice) {
    summary += `Price: $${minPrice.toFixed(2)}. `;
  } else {
    summary += `Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}. `;
  }
  
  summary += sortExplanation + ".";
  
  return summary;
}

export function enrichResultsWithExplanations(
  results: RankedResult[],
  intent: BuyLensIntent
): RankedResult[] {
  return results;
}
