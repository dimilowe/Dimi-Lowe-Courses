export type Optimization = "cheapest" | "best_value" | "best_quality" | "fastest_shipping" | "unknown";
export type Market = "retail" | "resale" | "both";
export type Condition = "any" | "new" | "used";

export interface BuyLensIntent {
  product_query: string;
  optimization: Optimization;
  market: Market;
  max_budget_usd?: number;
  condition?: Condition;
  must_include_shipping_total: boolean;
  keywords_include?: string[];
  keywords_exclude?: string[];
}

export type SourceStatus = "ok" | "robots_blocked" | "captcha" | "paywall" | "timeout" | "error" | "pending";

export interface SourceRecord {
  domain: string;
  url: string;
  status: SourceStatus;
  error_message?: string;
  visited_at: Date;
}

export interface RawListing {
  url: string;
  domain: string;
  title?: string;
  price_usd?: number;
  shipping_usd?: number;
  total_usd?: number;
  condition?: "new" | "used" | "unknown";
  seller?: string;
  currency?: string;
  key_specs?: string[];
  confidence: number;
  notes?: string;
}

export interface RankedResult extends RawListing {
  rank: number;
  why?: string;
  tradeoff?: string;
}

export interface BuyLensRunResult {
  runId: string;
  status: "success" | "partial" | "failed";
  intent: BuyLensIntent;
  results: RankedResult[];
  sources: SourceRecord[];
  duration_ms: number;
  sort_explanation?: string;
}

export const DOMAIN_ALLOWLIST = {
  resale: [
    "ebay.com",
    "grailed.com",
    "poshmark.com",
    "depop.com",
    "stockx.com",
    "goat.com",
  ],
  retail: [
    "bestbuy.com",
    "walmart.com",
    "target.com",
  ],
} as const;

export const HARD_CAPS = {
  maxDomains: 6,
  maxPagesTotal: 18,
  maxPagesPerDomain: 3,
  perPageTimeoutMs: 12000,
  runTimeoutMs: 60000,
  maxQueryLength: 300,
  maxRunsPerDay: 10,
} as const;

export const USER_AGENT = "BuyLensBot/1.0 (+https://vcmsuite.com; contact: support@vcmsuite.com)";
