import type { BuyLensIntent, Market } from "./types";
import { DOMAIN_ALLOWLIST, HARD_CAPS } from "./types";

interface SearchTarget {
  domain: string;
  searchUrl: string;
}

const SEARCH_URL_PATTERNS: Record<string, (query: string) => string> = {
  "ebay.com": (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
  "grailed.com": (q) => `https://www.grailed.com/shop?query=${encodeURIComponent(q)}`,
  "poshmark.com": (q) => `https://poshmark.com/search?query=${encodeURIComponent(q)}`,
  "depop.com": (q) => `https://www.depop.com/search/?q=${encodeURIComponent(q)}`,
  "stockx.com": (q) => `https://stockx.com/search?s=${encodeURIComponent(q)}`,
  "goat.com": (q) => `https://www.goat.com/search?query=${encodeURIComponent(q)}`,
  "bestbuy.com": (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q)}`,
  "walmart.com": (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  "target.com": (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
};

export function discoverSearchTargets(intent: BuyLensIntent): SearchTarget[] {
  const targets: SearchTarget[] = [];
  const query = intent.product_query;
  
  let domains: string[] = [];
  
  if (intent.market === "resale") {
    domains = [...DOMAIN_ALLOWLIST.resale];
  } else if (intent.market === "retail") {
    domains = [...DOMAIN_ALLOWLIST.retail];
  } else {
    domains = [...DOMAIN_ALLOWLIST.retail, ...DOMAIN_ALLOWLIST.resale];
  }
  
  const selectedDomains = domains.slice(0, HARD_CAPS.maxDomains);
  
  for (const domain of selectedDomains) {
    const urlGenerator = SEARCH_URL_PATTERNS[domain];
    if (urlGenerator) {
      targets.push({
        domain,
        searchUrl: urlGenerator(query),
      });
    }
  }
  
  return targets;
}
