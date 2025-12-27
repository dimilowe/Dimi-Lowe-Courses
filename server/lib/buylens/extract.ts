import type { RawListing } from "./types";
import * as cheerio from "cheerio";

interface ExtractResult {
  listings: RawListing[];
  productUrls: string[];
}

export function extractListings(html: string, pageUrl: string, domain: string): ExtractResult {
  const listings: RawListing[] = [];
  const productUrls: string[] = [];
  
  const $ = cheerio.load(html);
  
  const jsonLdListings = extractFromJsonLd($, pageUrl, domain);
  if (jsonLdListings.length > 0) {
    listings.push(...jsonLdListings);
  }
  
  if (listings.length === 0) {
    const ogListing = extractFromOpenGraph($, pageUrl, domain);
    if (ogListing) {
      listings.push(ogListing);
    }
  }
  
  if (listings.length === 0) {
    const heuristicListings = extractWithHeuristics($, pageUrl, domain);
    listings.push(...heuristicListings);
  }
  
  const foundUrls = extractProductUrls($, pageUrl, domain);
  productUrls.push(...foundUrls.slice(0, 5));
  
  return { listings, productUrls };
}

function extractFromJsonLd($: cheerio.CheerioAPI, pageUrl: string, domain: string): RawListing[] {
  const listings: RawListing[] = [];
  
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes("Product")) {
          const listing = parseProductSchema(item, pageUrl, domain);
          if (listing) {
            listings.push(listing);
          }
        }
        
        if (item["@graph"]) {
          for (const graphItem of item["@graph"]) {
            if (graphItem["@type"] === "Product" || graphItem["@type"]?.includes("Product")) {
              const listing = parseProductSchema(graphItem, pageUrl, domain);
              if (listing) {
                listings.push(listing);
              }
            }
          }
        }
      }
    } catch (e) {
    }
  });
  
  return listings;
}

function parseProductSchema(data: any, pageUrl: string, domain: string): RawListing | null {
  const title = data.name;
  if (!title) return null;
  
  let price_usd: number | undefined;
  let shipping_usd: number | undefined;
  let condition: "new" | "used" | "unknown" | undefined;
  let seller: string | undefined;
  
  const offers = data.offers || data.offer;
  if (offers) {
    const offerData = Array.isArray(offers) ? offers[0] : offers;
    
    if (offerData.price) {
      const priceNum = parseFloat(String(offerData.price).replace(/[^0-9.]/g, ""));
      if (!isNaN(priceNum)) {
        price_usd = priceNum;
      }
    }
    
    if (offerData.shippingDetails?.shippingRate?.value) {
      const shippingNum = parseFloat(String(offerData.shippingDetails.shippingRate.value).replace(/[^0-9.]/g, ""));
      if (!isNaN(shippingNum)) {
        shipping_usd = shippingNum;
      }
    }
    
    if (offerData.itemCondition) {
      const conditionStr = String(offerData.itemCondition).toLowerCase();
      if (conditionStr.includes("new")) {
        condition = "new";
      } else if (conditionStr.includes("used") || conditionStr.includes("refurbished")) {
        condition = "used";
      }
    }
    
    if (offerData.seller?.name) {
      seller = offerData.seller.name;
    }
  }
  
  const key_specs: string[] = [];
  if (data.brand?.name) {
    key_specs.push(`Brand: ${data.brand.name}`);
  }
  if (data.color) {
    key_specs.push(`Color: ${data.color}`);
  }
  if (data.size) {
    key_specs.push(`Size: ${data.size}`);
  }
  
  return {
    url: data.url || pageUrl,
    domain,
    title,
    price_usd,
    shipping_usd,
    total_usd: price_usd && shipping_usd ? price_usd + shipping_usd : price_usd,
    condition,
    seller,
    key_specs: key_specs.length > 0 ? key_specs : undefined,
    confidence: 0.9,
    notes: "Extracted from JSON-LD",
  };
}

function extractFromOpenGraph($: cheerio.CheerioAPI, pageUrl: string, domain: string): RawListing | null {
  const title = $('meta[property="og:title"]').attr("content") || 
                $('meta[name="og:title"]').attr("content");
  
  if (!title) return null;
  
  const priceAmount = $('meta[property="product:price:amount"]').attr("content") ||
                      $('meta[property="og:price:amount"]').attr("content");
  
  let price_usd: number | undefined;
  if (priceAmount) {
    const priceNum = parseFloat(priceAmount.replace(/[^0-9.]/g, ""));
    if (!isNaN(priceNum)) {
      price_usd = priceNum;
    }
  }
  
  return {
    url: $('meta[property="og:url"]').attr("content") || pageUrl,
    domain,
    title,
    price_usd,
    confidence: 0.7,
    notes: "Extracted from OpenGraph",
  };
}

function extractWithHeuristics($: cheerio.CheerioAPI, pageUrl: string, domain: string): RawListing[] {
  const listings: RawListing[] = [];
  
  const title = $("h1").first().text().trim() || $("title").text().trim();
  
  if (!title) return listings;
  
  let price_usd: number | undefined;
  
  const pricePatterns = [
    /\$\s*([\d,]+(?:\.\d{2})?)/,
    /USD\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*USD/i,
  ];
  
  const priceSelectors = [
    '[class*="price"]',
    '[data-testid*="price"]',
    '[itemprop="price"]',
    '.price',
    '#price',
  ];
  
  for (const selector of priceSelectors) {
    const priceEl = $(selector).first();
    if (priceEl.length) {
      const text = priceEl.text();
      for (const pattern of pricePatterns) {
        const match = text.match(pattern);
        if (match) {
          const priceNum = parseFloat(match[1].replace(/,/g, ""));
          if (!isNaN(priceNum) && priceNum > 0 && priceNum < 100000) {
            price_usd = priceNum;
            break;
          }
        }
      }
      if (price_usd) break;
    }
  }
  
  if (!price_usd) {
    const bodyText = $("body").text();
    for (const pattern of pricePatterns) {
      const matches = bodyText.match(new RegExp(pattern, "g"));
      if (matches && matches.length > 0) {
        const match = matches[0].match(pattern);
        if (match) {
          const priceNum = parseFloat(match[1].replace(/,/g, ""));
          if (!isNaN(priceNum) && priceNum > 0 && priceNum < 100000) {
            price_usd = priceNum;
            break;
          }
        }
      }
    }
  }
  
  listings.push({
    url: pageUrl,
    domain,
    title,
    price_usd,
    confidence: price_usd ? 0.5 : 0.3,
    notes: price_usd ? "Extracted with heuristics" : "Price not publicly visible",
  });
  
  return listings;
}

function extractProductUrls($: cheerio.CheerioAPI, pageUrl: string, domain: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  
  const baseUrl = new URL(pageUrl);
  
  const productLinkSelectors = [
    'a[href*="/product/"]',
    'a[href*="/item/"]',
    'a[href*="/p/"]',
    'a[href*="/dp/"]',
    'a[href*="/itm/"]',
    '[class*="product"] a[href]',
    '[data-testid*="product"] a[href]',
    '.listing a[href]',
    '.item a[href]',
  ];
  
  for (const selector of productLinkSelectors) {
    $(selector).each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      
      try {
        const fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).toString();
        
        if (!fullUrl.includes(domain)) return;
        
        const path = new URL(fullUrl).pathname.toLowerCase();
        if (path.includes("/login") || path.includes("/cart") || path.includes("/checkout")) {
          return;
        }
        
        if (!seen.has(fullUrl)) {
          seen.add(fullUrl);
          urls.push(fullUrl);
        }
      } catch (e) {
      }
    });
    
    if (urls.length >= 5) break;
  }
  
  return urls;
}
