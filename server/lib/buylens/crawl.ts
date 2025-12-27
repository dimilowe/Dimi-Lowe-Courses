import type { SourceRecord, SourceStatus, RawListing } from "./types";
import { HARD_CAPS, USER_AGENT } from "./types";
import { checkRobotsAllowed } from "./robots";
import { extractListings } from "./extract";

const BLOCKED_PATH_PATTERNS = [
  "/login", "/signin", "/sign-in", "/signup", "/sign-up", "/register",
  "/checkout", "/cart", "/basket", "/payment", "/account", "/my-account",
  "/auth", "/oauth", "/sso", "/password", "/forgot-password",
];

const CAPTCHA_INDICATORS = [
  "captcha", "recaptcha", "hcaptcha", "challenge", "robot", "verify you're human",
  "access denied", "403 forbidden", "blocked", "unusual traffic",
];

interface CrawlResult {
  sources: SourceRecord[];
  listings: RawListing[];
  pagesVisited: number;
  domainsVisited: number;
}

export async function crawlSearchTargets(
  targets: { domain: string; searchUrl: string }[]
): Promise<CrawlResult> {
  const sources: SourceRecord[] = [];
  const listings: RawListing[] = [];
  let pagesVisited = 0;
  const domainsVisited = new Set<string>();
  const pagesPerDomain = new Map<string, number>();
  
  const startTime = Date.now();
  
  for (const target of targets) {
    if (Date.now() - startTime > HARD_CAPS.runTimeoutMs) {
      break;
    }
    
    if (pagesVisited >= HARD_CAPS.maxPagesTotal) {
      break;
    }
    
    const domainPages = pagesPerDomain.get(target.domain) || 0;
    if (domainPages >= HARD_CAPS.maxPagesPerDomain) {
      continue;
    }
    
    const result = await crawlPage(target.domain, target.searchUrl, startTime);
    sources.push(result.source);
    
    if (result.source.status === "ok") {
      pagesVisited++;
      domainsVisited.add(target.domain);
      pagesPerDomain.set(target.domain, domainPages + 1);
      
      if (result.listings) {
        listings.push(...result.listings);
      }
      
      if (result.productUrls && result.productUrls.length > 0) {
        const remainingDomainPages = HARD_CAPS.maxPagesPerDomain - (pagesPerDomain.get(target.domain) || 0);
        const remainingTotalPages = HARD_CAPS.maxPagesTotal - pagesVisited;
        const maxProductPages = Math.min(remainingDomainPages, remainingTotalPages, 2);
        
        for (let i = 0; i < Math.min(result.productUrls.length, maxProductPages); i++) {
          if (Date.now() - startTime > HARD_CAPS.runTimeoutMs) {
            break;
          }
          
          const productUrl = result.productUrls[i];
          const productResult = await crawlPage(target.domain, productUrl, startTime);
          sources.push(productResult.source);
          
          if (productResult.source.status === "ok") {
            pagesVisited++;
            pagesPerDomain.set(target.domain, (pagesPerDomain.get(target.domain) || 0) + 1);
            
            if (productResult.listings) {
              listings.push(...productResult.listings);
            }
          }
        }
      }
    }
  }
  
  return {
    sources,
    listings,
    pagesVisited,
    domainsVisited: domainsVisited.size,
  };
}

async function crawlPage(
  domain: string,
  url: string,
  runStartTime: number
): Promise<{
  source: SourceRecord;
  listings?: RawListing[];
  productUrls?: string[];
}> {
  const source: SourceRecord = {
    domain,
    url,
    status: "pending",
    visited_at: new Date(),
  };
  
  try {
    const urlPath = new URL(url).pathname;
    
    if (BLOCKED_PATH_PATTERNS.some(pattern => urlPath.toLowerCase().includes(pattern))) {
      source.status = "paywall";
      source.error_message = "Blocked path (login/checkout/account)";
      return { source };
    }
    
    const robotsAllowed = await checkRobotsAllowed(domain, urlPath);
    if (!robotsAllowed) {
      source.status = "robots_blocked";
      source.error_message = "Disallowed by robots.txt";
      return { source };
    }
    
    const remainingTime = HARD_CAPS.runTimeoutMs - (Date.now() - runStartTime);
    const pageTimeout = Math.min(HARD_CAPS.perPageTimeoutMs, remainingTime);
    
    if (pageTimeout <= 0) {
      source.status = "timeout";
      source.error_message = "Run timeout exceeded";
      return { source };
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), pageTimeout);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        source.status = "captcha";
        source.error_message = `HTTP ${response.status} - Access denied`;
        return { source };
      }
      source.status = "error";
      source.error_message = `HTTP ${response.status}`;
      return { source };
    }
    
    const html = await response.text();
    
    const htmlLower = html.toLowerCase();
    if (CAPTCHA_INDICATORS.some(indicator => htmlLower.includes(indicator))) {
      source.status = "captcha";
      source.error_message = "Captcha or bot detection detected";
      return { source };
    }
    
    const extractResult = extractListings(html, url, domain);
    
    source.status = "ok";
    
    return {
      source,
      listings: extractResult.listings,
      productUrls: extractResult.productUrls,
    };
    
  } catch (error: any) {
    if (error.name === "AbortError") {
      source.status = "timeout";
      source.error_message = "Page fetch timeout";
    } else {
      source.status = "error";
      source.error_message = error.message || "Unknown error";
    }
    return { source };
  }
}
