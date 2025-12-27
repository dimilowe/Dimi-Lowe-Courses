import type { RawListing, RankedResult, BuyLensIntent, Optimization } from "./types";

interface RankingResult {
  results: RankedResult[];
  sortExplanation: string;
}

export function rankListings(
  listings: RawListing[],
  intent: BuyLensIntent,
  maxResults: number = 10
): RankingResult {
  const { optimization, must_include_shipping_total } = intent;
  
  let sortExplanation = "";
  let sorted: RawListing[];
  
  switch (optimization) {
    case "cheapest":
      if (must_include_shipping_total) {
        sorted = [...listings].sort((a, b) => {
          const aTotal = a.total_usd ?? a.price_usd ?? Infinity;
          const bTotal = b.total_usd ?? b.price_usd ?? Infinity;
          if (aTotal !== bTotal) return aTotal - bTotal;
          return b.confidence - a.confidence;
        });
        
        const hasShippingData = listings.some(l => l.shipping_usd !== undefined);
        if (hasShippingData) {
          sortExplanation = "Sorted by total price (item + shipping)";
        } else {
          sortExplanation = "Sorted by price (shipping unknown for all items)";
        }
      } else {
        sorted = [...listings].sort((a, b) => {
          const aPrice = a.price_usd ?? Infinity;
          const bPrice = b.price_usd ?? Infinity;
          if (aPrice !== bPrice) return aPrice - bPrice;
          return b.confidence - a.confidence;
        });
        sortExplanation = "Sorted by item price only";
      }
      break;
      
    case "best_value":
      sorted = [...listings].sort((a, b) => {
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        const aTotal = a.total_usd ?? a.price_usd ?? Infinity;
        const bTotal = b.total_usd ?? b.price_usd ?? Infinity;
        return aTotal - bTotal;
      });
      sortExplanation = "Sorted by data confidence, then price";
      break;
      
    case "best_quality":
      sorted = [...listings].sort((a, b) => {
        const aPrice = a.total_usd ?? a.price_usd ?? 0;
        const bPrice = b.total_usd ?? b.price_usd ?? 0;
        if (aPrice !== bPrice) return bPrice - aPrice;
        return b.confidence - a.confidence;
      });
      sortExplanation = "Sorted by price (highest first, assuming quality correlation)";
      break;
      
    case "fastest_shipping":
      sorted = [...listings].sort((a, b) => {
        const aShipping = a.shipping_usd ?? Infinity;
        const bShipping = b.shipping_usd ?? Infinity;
        if (aShipping !== bShipping) return aShipping - bShipping;
        const aTotal = a.total_usd ?? a.price_usd ?? Infinity;
        const bTotal = b.total_usd ?? b.price_usd ?? Infinity;
        return aTotal - bTotal;
      });
      sortExplanation = "Sorted by shipping cost (lower shipping often means faster)";
      break;
      
    default:
      sorted = [...listings].sort((a, b) => b.confidence - a.confidence);
      sortExplanation = "Sorted by data confidence";
  }
  
  const results: RankedResult[] = sorted.slice(0, maxResults).map((listing, index) => ({
    ...listing,
    rank: index + 1,
    why: generateWhy(listing, optimization),
    tradeoff: generateTradeoff(listing, sorted, optimization),
  }));
  
  return { results, sortExplanation };
}

function generateWhy(listing: RawListing, optimization: Optimization): string {
  const parts: string[] = [];
  
  if (listing.price_usd !== undefined) {
    parts.push(`$${listing.price_usd.toFixed(2)}`);
  }
  
  if (listing.shipping_usd !== undefined) {
    parts.push(`+$${listing.shipping_usd.toFixed(2)} shipping`);
  } else if (listing.price_usd !== undefined) {
    parts.push("shipping unknown");
  }
  
  if (listing.condition && listing.condition !== "unknown") {
    parts.push(listing.condition);
  }
  
  if (listing.seller) {
    parts.push(`from ${listing.seller}`);
  }
  
  if (parts.length === 0) {
    return "Limited data available";
  }
  
  return parts.join(" | ");
}

function generateTradeoff(
  listing: RawListing,
  allListings: RawListing[],
  optimization: Optimization
): string {
  const withPrices = allListings.filter(l => l.price_usd !== undefined);
  
  if (withPrices.length < 2) {
    return "Not enough data for comparison";
  }
  
  const prices = withPrices.map(l => l.total_usd ?? l.price_usd!);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  const thisPrice = listing.total_usd ?? listing.price_usd;
  
  if (thisPrice === undefined) {
    return "Price not available for comparison";
  }
  
  if (thisPrice === minPrice) {
    const savings = avgPrice - thisPrice;
    if (savings > 1) {
      return `Cheapest option, $${savings.toFixed(0)} below average`;
    }
    return "Cheapest option found";
  }
  
  if (thisPrice === maxPrice) {
    const premium = thisPrice - avgPrice;
    if (premium > 1) {
      return `Premium option, $${premium.toFixed(0)} above average`;
    }
    return "Higher-priced option";
  }
  
  const diffFromCheapest = thisPrice - minPrice;
  if (diffFromCheapest > 1) {
    return `$${diffFromCheapest.toFixed(0)} more than cheapest`;
  }
  
  return "Mid-range option";
}
