"use client";

import { useState } from "react";
import { Search, ExternalLink, Copy, Check, Loader2 } from "lucide-react";

interface SearchLink {
  query: string;
  url: string;
  type: "primary" | "variation" | "broad";
}

const GENERIC_URL_SEGMENTS = new Set([
  "product", "products", "item", "items", "browse", "shop", "shopping", "store",
  "catalog", "catalogue", "category", "categories", "collection", "collections",
  "detail", "details", "view", "page", "pages", "buy", "order", "cart",
  "checkout", "search", "results", "listing", "listings", "offer", "offers",
  "deal", "deals", "sale", "sales", "promo", "promotion", "new", "featured",
  "best", "top", "hot", "popular", "trending", "index", "home", "main",
  "default", "display", "show", "get", "pid", "id", "sku", "ref", "dp", "gp",
  "asin", "product.do", "browse.do", "item.do", "web", "www", "en", "us",
  "com", "html", "htm", "php", "asp", "jsp", "aspx"
]);

function extractKeywordsFromUrl(url: string): string[] {
  const keywords: string[] = [];
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const searchParams = urlObj.searchParams;
    
    const productNameMatch = pathname.match(/\/([a-z][a-z0-9-]+(?:-[a-z][a-z0-9-]+)+)(?:\/|\.html?|$)/i);
    if (productNameMatch) {
      const slug = productNameMatch[1];
      const words = slug
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\d{5,}/g, "")
        .split(" ")
        .filter(w => w.length > 2 && !/^\d+$/.test(w) && !GENERIC_URL_SEGMENTS.has(w));
      keywords.push(...words);
    }
    
    const titleParam = searchParams.get("title") || searchParams.get("name") || 
                       searchParams.get("q") || searchParams.get("keywords") ||
                       searchParams.get("search") || searchParams.get("term");
    if (titleParam) {
      const words = titleParam
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(" ")
        .filter(w => w.length > 2 && !GENERIC_URL_SEGMENTS.has(w));
      keywords.push(...words);
    }
    
    const pathParts = pathname.split("/").filter(p => p.length > 2);
    for (const part of pathParts) {
      const cleanPart = part.replace(/\.(html?|php|asp|jsp|aspx|do)$/i, "");
      if (!/^\d+$/.test(cleanPart) && !GENERIC_URL_SEGMENTS.has(cleanPart)) {
        const words = cleanPart.replace(/-/g, " ").replace(/_/g, " ").split(" ");
        const validWords = words.filter(w => 
          w.length > 2 && 
          !/^\d+$/.test(w) && 
          !GENERIC_URL_SEGMENTS.has(w)
        );
        keywords.push(...validWords);
      }
    }
  } catch {
    return [];
  }
  
  const uniqueKeywords = [...new Set(keywords)];
  return uniqueKeywords.slice(0, 10);
}

function extractKeywordsFromText(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that",
    "these", "those", "i", "you", "he", "she", "we", "they", "what", "which", "who",
    "whom", "whose", "where", "when", "why", "how", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "also", "now", "here", "there",
    "like", "want", "looking", "find", "search", "buy", "get", "need", "something",
    "similar", "cheap", "cheaper", "price", "dupe", "alternative", "version", "copy"
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word));
  
  return [...new Set(words)].slice(0, 10);
}

function generateSearchLinks(keywords: string[]): SearchLink[] {
  if (keywords.length === 0) return [];
  
  const links: SearchLink[] = [];
  const baseUrl = "https://www.aliexpress.com/wholesale";
  
  const primaryQuery = keywords.slice(0, 4).join(" ");
  links.push({
    query: primaryQuery,
    url: `${baseUrl}?SearchText=${encodeURIComponent(primaryQuery)}`,
    type: "primary"
  });
  
  if (keywords.length >= 3) {
    const variation1 = [keywords[0], keywords[2], keywords[1]].filter(Boolean).slice(0, 3).join(" ");
    if (variation1 !== primaryQuery) {
      links.push({
        query: variation1,
        url: `${baseUrl}?SearchText=${encodeURIComponent(variation1)}`,
        type: "variation"
      });
    }
  }
  
  if (keywords.length >= 2) {
    const coreQuery = keywords.slice(0, 2).join(" ");
    links.push({
      query: coreQuery,
      url: `${baseUrl}?SearchText=${encodeURIComponent(coreQuery)}`,
      type: "broad"
    });
  }
  
  if (keywords.length >= 4) {
    const altQuery = keywords.slice(1, 4).join(" ");
    links.push({
      query: altQuery,
      url: `${baseUrl}?SearchText=${encodeURIComponent(altQuery)}`,
      type: "variation"
    });
  }
  
  if (keywords.length >= 5) {
    const broadQuery = [keywords[0], keywords[4]].join(" ");
    links.push({
      query: broadQuery,
      url: `${baseUrl}?SearchText=${encodeURIComponent(broadQuery)}`,
      type: "broad"
    });
  }
  
  const uniqueLinks = links.reduce((acc, link) => {
    if (!acc.find(l => l.query === link.query)) {
      acc.push(link);
    }
    return acc;
  }, [] as SearchLink[]);
  
  return uniqueLinks.slice(0, 5);
}

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return text.startsWith("http://") || text.startsWith("https://") || text.includes(".com") || text.includes(".co");
  }
}

export default function AliExpressDupeFinderClient() {
  const [input, setInput] = useState("");
  const [searchLinks, setSearchLinks] = useState<SearchLink[]>([]);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    setTimeout(() => {
      let keywords: string[];
      
      if (isUrl(input.trim())) {
        keywords = extractKeywordsFromUrl(input.trim());
        if (keywords.length === 0) {
          keywords = extractKeywordsFromText(input.trim());
        }
      } else {
        keywords = extractKeywordsFromText(input.trim());
      }
      
      setExtractedKeywords(keywords);
      const links = generateSearchLinks(keywords);
      setSearchLinks(links);
      setIsLoading(false);
    }, 300);
  };

  const handleCopy = async (url: string, index: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getTypeLabel = (type: SearchLink["type"]) => {
    switch (type) {
      case "primary":
        return "Best Match";
      case "variation":
        return "Variation";
      case "broad":
        return "Broad Search";
    }
  };

  const getTypeBadgeClass = (type: SearchLink["type"]) => {
    switch (type) {
      case "primary":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "variation":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "broad":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Input Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Paste a product link or describe what you're looking for
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., https://amazon.com/... or 'minimalist leather crossbody bag'"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Find Dupes</span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Works with Amazon, Shein, ASOS, Zara, or any product URL. You can also just describe the item.
            </p>
          </div>

          {/* Results Section */}
          {hasSearched && !isLoading && (
            <div className="mt-8">
              {searchLinks.length > 0 ? (
                <>
                  {/* Extracted Keywords */}
                  {extractedKeywords.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-600 mb-2">Extracted keywords:</div>
                      <div className="flex flex-wrap gap-2">
                        {extractedKeywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Links */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Click any link to search AliExpress:
                    </div>
                    {searchLinks.map((link, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getTypeBadgeClass(link.type)}`}>
                              {getTypeLabel(link.type)}
                            </span>
                          </div>
                          <div className="text-gray-900 font-medium truncate">
                            "{link.query}"
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleCopy(link.url, i)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                            title="Copy link"
                          >
                            {copiedIndex === i ? (
                              <Check className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all"
                          >
                            <span>Search</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-sm font-medium text-amber-800 mb-1">Pro tips for finding the best dupe:</div>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Filter by 4+ star ratings and 100+ orders</li>
                      <li>• Look for listings with photo reviews</li>
                      <li>• Check seller rating (95%+ is ideal)</li>
                      <li>• Compare sizing charts carefully</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-amber-800 font-medium mb-2">
                    This URL doesn't contain product keywords
                  </div>
                  <div className="text-sm text-amber-700 mb-4">
                    Some websites (like Old Navy, Gap, Target) use generic URLs without product names.
                  </div>
                  <div className="text-sm text-amber-800 font-medium">
                    Try describing the item instead:
                  </div>
                  <div className="mt-2 text-sm text-amber-700">
                    Example: "mid rise baggy jeans women" or "straight leg denim pants blue"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!hasSearched && (
            <div className="mt-8 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-gray-600 font-medium mb-1">
                Find cheaper alternatives in seconds
              </div>
              <div className="text-sm text-gray-400">
                Paste a product link or describe what you want to find
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
