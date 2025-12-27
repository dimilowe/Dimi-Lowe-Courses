import type { BuyLensIntent, Optimization, Market, Condition } from "./types";

const RESALE_KEYWORDS = ["reseller", "used", "stockx", "goat", "ebay", "grailed", "poshmark", "depop", "secondhand", "pre-owned", "thrift"];
const QUALITY_KEYWORDS = ["best", "top", "premium", "quality", "recommend", "recommended"];
const CHEAPEST_KEYWORDS = ["cheapest", "cheapest", "budget", "affordable", "lowest price", "bargain"];
const FAST_SHIPPING_KEYWORDS = ["fast shipping", "quick shipping", "fastest delivery", "next day", "same day"];

export function parseIntent(
  queryText: string,
  options?: {
    maxBudget?: number;
    market?: Market;
    condition?: Condition;
    includeShippingTotal?: boolean;
  }
): BuyLensIntent {
  const query = queryText.toLowerCase().trim();
  
  let optimization: Optimization = "best_value";
  if (CHEAPEST_KEYWORDS.some(kw => query.includes(kw))) {
    optimization = "cheapest";
  } else if (FAST_SHIPPING_KEYWORDS.some(kw => query.includes(kw))) {
    optimization = "fastest_shipping";
  } else if (query.includes("best quality") || query.includes("highest quality") || query.includes("top quality")) {
    optimization = "best_quality";
  } else if (QUALITY_KEYWORDS.some(kw => query.includes(kw))) {
    optimization = "best_value";
  }

  let market: Market = options?.market || "both";
  if (!options?.market) {
    if (RESALE_KEYWORDS.some(kw => query.includes(kw))) {
      market = "resale";
    } else if (query.includes("new only") || query.includes("brand new") || query.includes("retail")) {
      market = "retail";
    }
  }

  let condition: Condition = options?.condition || "any";
  if (!options?.condition) {
    if (query.includes("new only") || query.includes("brand new")) {
      condition = "new";
    } else if (query.includes("used") || query.includes("pre-owned") || query.includes("secondhand")) {
      condition = "used";
    }
  }

  const cleanQuery = queryText
    .replace(/cheapest|best|top|premium|quality|recommend|recommended|fast shipping|quick shipping/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    product_query: cleanQuery || queryText,
    optimization,
    market,
    max_budget_usd: options?.maxBudget,
    condition,
    must_include_shipping_total: options?.includeShippingTotal ?? true,
  };
}
