"use client";

import { useState } from "react";
import { Search, ExternalLink, Copy, Check, Loader2 } from "lucide-react";

interface SearchLink {
  query: string;
  url: string;
  type: "primary" | "variation" | "broad";
}

// ============================================
// FASHION INTENT RESOLUTION SYSTEM
// ============================================

type ItemKind = "finished_garment" | "fabric" | "accessory" | "unknown";
type Gender = "men" | "women" | "unisex" | "unknown";

type DressLength = "mini" | "short" | "midi" | "maxi" | null;

interface FashionIntent {
  itemKind: ItemKind;
  garmentType: string | null;
  gender: Gender;
  sleeve: "long sleeve" | "short sleeve" | "sleeveless" | null;
  length: DressLength;
  colors: string[];
  styleTokens: string[];
  materialTokens: string[];
  coreTokens: string[];
  negativeTokens: string[];
  silhouetteTokens: string[];
}

const GARMENT_TYPES = new Map<string, string>([
  ["shirt", "shirt"],
  ["shirts", "shirt"],
  ["button", "button up"],
  ["button-up", "button up"],
  ["buttonup", "button up"],
  ["tshirt", "t-shirt"],
  ["t-shirt", "t-shirt"],
  ["tee", "t-shirt"],
  ["dress", "dress"],
  ["dresses", "dress"],
  ["jacket", "jacket"],
  ["jackets", "jacket"],
  ["blazer", "blazer"],
  ["coat", "coat"],
  ["coats", "coat"],
  ["pants", "pants"],
  ["trousers", "pants"],
  ["jeans", "jeans"],
  ["hoodie", "hoodie"],
  ["hoodies", "hoodie"],
  ["sweatshirt", "sweatshirt"],
  ["sweater", "sweater"],
  ["cardigan", "cardigan"],
  ["skirt", "skirt"],
  ["skirts", "skirt"],
  ["blouse", "blouse"],
  ["top", "top"],
  ["tops", "top"],
  ["tank", "tank top"],
  ["shorts", "shorts"],
  ["jumpsuit", "jumpsuit"],
  ["romper", "romper"],
  ["bodysuit", "bodysuit"],
  ["vest", "vest"],
  ["polo", "polo shirt"],
  ["scarf", "scarf"],
  ["scarves", "scarf"],
  ["bag", "bag"],
  ["bags", "bag"],
  ["purse", "bag"],
  ["handbag", "bag"],
  ["backpack", "backpack"],
  ["shoe", "shoes"],
  ["shoes", "shoes"],
  ["sneakers", "sneakers"],
  ["boots", "boots"],
  ["heels", "heels"],
  ["sandals", "sandals"],
  ["loafers", "loafers"],
  ["watch", "watch"],
  ["watches", "watch"],
  ["jewelry", "jewelry"],
  ["necklace", "necklace"],
  ["bracelet", "bracelet"],
  ["earrings", "earrings"],
  ["ring", "ring"],
  ["belt", "belt"],
  ["hat", "hat"],
  ["cap", "cap"],
  ["sunglasses", "sunglasses"],
]);

const MATERIAL_TOKENS = new Set([
  "silk", "twill", "satin", "linen", "cotton", "wool", "cashmere", "polyester",
  "leather", "suede", "denim", "velvet", "viscose", "rayon", "nylon", "chiffon",
  "lace", "mesh", "fleece", "corduroy", "canvas", "jersey", "spandex", "lycra"
]);

const COLOR_TOKENS = new Set([
  "black", "white", "gold", "silver", "red", "blue", "green", "yellow", "pink", 
  "purple", "beige", "brown", "grey", "gray", "orange", "navy", "cream", "ivory",
  "burgundy", "maroon", "teal", "coral", "olive", "tan", "khaki", "champagne",
  "rose", "mint", "lavender", "turquoise", "nude", "camel", "charcoal"
]);

const STYLE_MAP: Record<string, string[]> = {
  baroque: ["baroque", "vintage", "ornate"],
  versace: ["baroque", "chain", "ornate", "luxury"],
  printed: ["print"],
  print: ["print"],
  floral: ["floral", "flower"],
  striped: ["striped", "stripes"],
  stripe: ["striped"],
  plaid: ["plaid", "checkered"],
  check: ["checkered"],
  checked: ["checkered"],
  paisley: ["paisley"],
  geometric: ["geometric"],
  abstract: ["abstract"],
  animal: ["animal print"],
  leopard: ["leopard print"],
  zebra: ["zebra print"],
  snake: ["snakeskin"],
  camo: ["camouflage"],
  camouflage: ["camouflage"],
  vintage: ["vintage", "retro"],
  retro: ["retro", "vintage"],
  minimalist: ["minimalist", "simple"],
  oversized: ["oversized", "loose"],
  slim: ["slim fit"],
  fitted: ["slim fit", "bodycon"],
  regular: [],
  casual: ["casual"],
  formal: ["formal", "elegant"],
  elegant: ["elegant", "formal"],
  streetwear: ["streetwear", "urban"],
  bohemian: ["boho", "bohemian"],
  boho: ["boho"],
  gothic: ["gothic", "goth"],
  preppy: ["preppy"],
  sporty: ["sporty", "athletic"],
  athletic: ["athletic"],
  luxury: ["luxury", "designer"],
  designer: ["designer style"],
  chain: ["chain", "ornate"],
  ornate: ["ornate", "decorative"],
  embroidered: ["embroidered", "embellished"],
  embroidery: ["embroidered", "embellished", "sequin"],
  sequin: ["sequin", "sparkle", "glitter"],
  sequins: ["sequin", "sparkle"],
  beaded: ["beaded", "embellished"],
  beading: ["beaded", "embellished"],
  embellished: ["embellished", "sequin", "beaded"],
  ruffle: ["ruffle"],
  ruffled: ["ruffle"],
  lace: ["lace"],
  mesh: ["mesh", "sheer"],
  sheer: ["sheer"],
  cutout: ["cutout"],
  asymmetric: ["asymmetric"],
  wrap: ["wrap"],
  puff: ["puff sleeve"],
  lantern: ["lantern sleeve"],
  balmain: ["embellished", "sequin", "luxury", "bodycon"],
  gucci: ["luxury", "designer", "print"],
  dior: ["luxury", "elegant"],
  chanel: ["luxury", "elegant", "classic"],
};

const SILHOUETTE_MAP: Record<string, string[]> = {
  bodycon: ["bodycon", "tight", "fitted"],
  bandage: ["bandage", "bodycon"],
  aline: ["a-line", "flare"],
  "a-line": ["a-line", "flare"],
  flare: ["flare", "swing"],
  swing: ["swing", "flare"],
  fitted: ["bodycon", "fitted"],
  tight: ["bodycon", "tight"],
  loose: ["loose", "relaxed"],
  relaxed: ["relaxed", "loose"],
  shift: ["shift"],
  sheath: ["sheath", "bodycon"],
  wrap: ["wrap"],
  pencil: ["pencil", "fitted"],
  mermaid: ["mermaid", "fishtail"],
  ballgown: ["ball gown"],
};

const NEGATIVE_TOKENS_BASE = [
  "fabric", "cloth", "textile", "meter", "metre", "yard", "yards",
  "material", "mulberry", "momme", "mommes", "charmeuse", "by the",
  "diy", "sewing", "craft", "crafts", "remnant", "remnants", "bolt"
];

const ACCESSORY_TYPES = new Set([
  "scarf", "bag", "shoes", "sneakers", "boots", "heels", "sandals", "loafers",
  "watch", "jewelry", "necklace", "bracelet", "earrings", "ring", "belt",
  "hat", "cap", "sunglasses", "backpack"
]);

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function inferGender(rawUrl: string, keywords: string[]): Gender {
  const s = rawUrl.toLowerCase();
  const k = keywords.map(x => x.toLowerCase());
  
  if (s.includes("/women") || s.includes("/woman") || s.includes("womens") ||
      k.includes("women") || k.includes("womens") || k.includes("woman") ||
      k.includes("ladies") || k.includes("female")) {
    return "women";
  }
  if (s.includes("/men") || s.includes("/man") || s.includes("mens") ||
      k.includes("men") || k.includes("mens") || k.includes("man") ||
      k.includes("male") || k.includes("guys")) {
    return "men";
  }
  if (k.includes("unisex")) return "unisex";
  return "unknown";
}

function detectSleeve(keywords: string[]): FashionIntent["sleeve"] {
  const lower = keywords.map(k => k.toLowerCase());
  const joined = lower.join(" ");
  
  if (lower.includes("sleeveless") || joined.includes("sleeveless") || lower.includes("tank")) {
    return "sleeveless";
  }
  
  if (joined.includes("long sleeve") || joined.includes("longsleeve") || joined.includes("long-sleeve") ||
      (lower.includes("long") && lower.includes("sleeve") && !lower.includes("sleeveless"))) {
    return "long sleeve";
  }
  
  if (joined.includes("short sleeve") || joined.includes("shortsleeve") || joined.includes("short-sleeve")) {
    return "short sleeve";
  }
  
  if (lower.includes("short") && lower.includes("sleeve") && !lower.includes("sleeveless")) {
    return "short sleeve";
  }
  
  return null;
}

function resolveLength(keywords: string[], garmentType: string | null): DressLength {
  if (garmentType !== "dress" && garmentType !== "skirt") return null;
  
  const lower = keywords.map(k => k.toLowerCase());
  
  if (lower.includes("mini")) return "mini";
  if (lower.includes("maxi")) return "maxi";
  if (lower.includes("midi")) return "midi";
  
  if (lower.includes("short")) {
    const hasShortSleeve = lower.includes("short-sleeve") || lower.includes("shortsleeve") ||
      (lower.includes("short") && lower.includes("sleeve") && !lower.includes("sleeveless"));
    
    if (!hasShortSleeve) {
      return "short";
    }
  }
  
  return null;
}

function resolveSilhouette(keywords: string[]): string[] {
  const lower = keywords.map(k => k.toLowerCase());
  const silhouettes: string[] = [];
  
  for (const k of lower) {
    const mapped = SILHOUETTE_MAP[k];
    if (mapped) {
      silhouettes.push(...mapped);
    }
  }
  
  return dedupe(silhouettes);
}

function resolveFashionIntent(inputUrl: string, keywords: string[]): FashionIntent {
  const lower = keywords.map(k => k.toLowerCase());

  let garmentType: string | null = null;
  for (const k of lower) {
    if (GARMENT_TYPES.has(k)) {
      garmentType = GARMENT_TYPES.get(k)!;
      break;
    }
  }

  let itemKind: ItemKind = "unknown";
  const hasFabricSignals = lower.some(k => 
    ["fabric", "cloth", "textile", "meter", "metre", "yard", "yards", "material", "mulberry", "momme"].includes(k)
  );
  
  if (hasFabricSignals) {
    itemKind = "fabric";
  } else if (garmentType) {
    if (ACCESSORY_TYPES.has(garmentType)) {
      itemKind = "accessory";
    } else {
      itemKind = "finished_garment";
    }
  } else {
    const clothingHints = ["shirt", "dress", "jacket", "coat", "pants", "jeans", "hoodie", 
                          "sweater", "blouse", "top", "shorts", "jumpsuit", "romper", "bodysuit"];
    if (lower.some(k => clothingHints.includes(k))) {
      itemKind = "finished_garment";
    }
  }

  const gender = inferGender(inputUrl, lower);
  const sleeve = detectSleeve(lower);
  const length = resolveLength(lower, garmentType);
  const silhouetteTokens = resolveSilhouette(lower);

  const colors = lower.filter(k => COLOR_TOKENS.has(k));
  const materialTokens = lower.filter(k => MATERIAL_TOKENS.has(k));

  const styleTokens: string[] = [];
  for (const k of lower) {
    const mapped = STYLE_MAP[k];
    if (mapped) {
      styleTokens.push(...mapped);
    }
  }

  const coreTokens: string[] = [];

  if (gender !== "unknown") {
    coreTokens.push(gender);
  }

  if (itemKind === "finished_garment") {
    coreTokens.push(garmentType ?? "shirt");
    
    if (sleeve) {
      coreTokens.push(sleeve);
    }
    
    if (length) {
      coreTokens.push(length === "short" ? "mini" : length);
    }
  } else if (itemKind === "accessory" && garmentType) {
    coreTokens.push(garmentType);
  }

  coreTokens.push(...dedupe(styleTokens).slice(0, 3));
  coreTokens.push(...dedupe(colors).slice(0, 2));

  const negativeTokens = [...NEGATIVE_TOKENS_BASE];

  return {
    itemKind,
    garmentType: garmentType ?? (itemKind === "finished_garment" ? "shirt" : null),
    gender,
    sleeve,
    length,
    colors: dedupe(colors),
    styleTokens: dedupe(styleTokens),
    materialTokens: dedupe(materialTokens),
    coreTokens: dedupe(coreTokens),
    negativeTokens: dedupe(negativeTokens),
    silhouetteTokens,
  };
}

function compileAliExpressQueries(intent: FashionIntent): string[] {
  const queries: string[] = [];
  const base = [...intent.coreTokens];

  const q1 = base.join(" ");
  if (q1.trim()) queries.push(q1);

  if (intent.itemKind === "finished_garment") {
    const genderPrefix = intent.gender !== "unknown" ? intent.gender : "";
    const garment = intent.garmentType ?? "dress";
    const lengthToken = intent.length ? (intent.length === "short" ? "mini" : intent.length) : "";
    
    const q2Parts: string[] = [];
    if (genderPrefix) q2Parts.push(genderPrefix);
    q2Parts.push(garment);
    
    if (intent.silhouetteTokens.length > 0) {
      q2Parts.push(intent.silhouetteTokens[0]);
    } else if (garment === "dress" && intent.styleTokens.some(s => ["embellished", "sequin", "beaded", "luxury"].includes(s))) {
      q2Parts.push("bodycon");
    }
    
    if (lengthToken) q2Parts.push(lengthToken);
    
    if (intent.styleTokens.length > 0) {
      q2Parts.push(intent.styleTokens[0]);
    }
    
    const q2 = q2Parts.join(" ");
    if (q2.trim() && q2 !== q1) queries.push(q2);

    const q3Parts: string[] = [];
    if (genderPrefix) q3Parts.push(genderPrefix);
    
    if (intent.styleTokens.includes("sequin") || intent.styleTokens.includes("embellished")) {
      q3Parts.push("sequin");
    }
    
    if (intent.silhouetteTokens.length > 0) {
      q3Parts.push(intent.silhouetteTokens[0]);
    } else {
      q3Parts.push("bodycon");
    }
    
    if (lengthToken) q3Parts.push(lengthToken);
    q3Parts.push(garment);
    
    if (intent.colors.length > 0) {
      q3Parts.push(intent.colors[0]);
    }
    
    const q3 = q3Parts.join(" ");
    if (q3.trim() && !queries.includes(q3)) queries.push(q3);

    if (intent.garmentType === "shirt") {
      const q4Parts = [...base];
      if (!q4Parts.includes("button up")) {
        q4Parts.push("button up");
      }
      if (intent.styleTokens.includes("baroque") && !q4Parts.includes("baroque")) {
        q4Parts.push("baroque");
      }
      const q4 = q4Parts.join(" ");
      if (q4.trim() && !queries.includes(q4)) queries.push(q4);
    }

    if (intent.colors.length > 0 && intent.styleTokens.length > 0) {
      const q5Parts = [
        genderPrefix,
        garment,
        intent.colors[0],
        intent.styleTokens[0]
      ].filter(Boolean);
      const q5 = q5Parts.join(" ");
      if (q5.trim() && !queries.includes(q5)) queries.push(q5);
    }
  }

  if (queries.length === 0 && intent.garmentType) {
    queries.push(intent.garmentType);
  }

  return dedupe(queries).slice(0, 5);
}

function generateSearchLinksFashionAware(
  url: string,
  extractedKeywords: string[]
): { intent: FashionIntent; links: SearchLink[] } {
  const intent = resolveFashionIntent(url, extractedKeywords);
  const queries = compileAliExpressQueries(intent);

  const links: SearchLink[] = queries.map((q, index) => ({
    query: q,
    url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`,
    type: index === 0 ? "primary" : index === 1 ? "variation" : "broad"
  }));

  return { intent, links };
}

// ============================================
// ORIGINAL KEYWORD EXTRACTION (kept for URL parsing)
// ============================================

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
  const [fashionIntent, setFashionIntent] = useState<FashionIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    setTimeout(() => {
      const trimmedInput = input.trim();
      let keywords: string[];
      let inputUrl = "";
      
      if (isUrl(trimmedInput)) {
        inputUrl = trimmedInput;
        keywords = extractKeywordsFromUrl(trimmedInput);
        if (keywords.length === 0) {
          keywords = extractKeywordsFromText(trimmedInput);
        }
      } else {
        keywords = extractKeywordsFromText(trimmedInput);
      }
      
      setExtractedKeywords(keywords);
      
      const { intent, links } = generateSearchLinksFashionAware(inputUrl, keywords);
      setFashionIntent(intent);
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
            <p className="text-xs text-amber-600 mt-1">
              Pro tip: URLs work best when they contain product keywords (like "mens-puffer-jacket"). If not, just describe the item instead.
            </p>
          </div>

          {/* Results Section */}
          {hasSearched && !isLoading && (
            <div className="mt-8">
              {searchLinks.length > 0 ? (
                <>
                  {/* Fashion Intent Detection */}
                  {fashionIntent && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-800 mb-3">Detected item details:</div>
                      <div className="flex flex-wrap gap-2">
                        {fashionIntent.itemKind !== "unknown" && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                            {fashionIntent.itemKind === "finished_garment" ? "Clothing" : 
                             fashionIntent.itemKind === "accessory" ? "Accessory" : "Fabric"}
                          </span>
                        )}
                        {fashionIntent.gender !== "unknown" && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                            {fashionIntent.gender === "men" ? "Men's" : fashionIntent.gender === "women" ? "Women's" : "Unisex"}
                          </span>
                        )}
                        {fashionIntent.garmentType && (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                            {fashionIntent.garmentType}
                          </span>
                        )}
                        {fashionIntent.sleeve && (
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
                            {fashionIntent.sleeve}
                          </span>
                        )}
                        {fashionIntent.length && (
                          <span className="px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full border border-pink-200">
                            {fashionIntent.length}
                          </span>
                        )}
                        {fashionIntent.silhouetteTokens.slice(0, 2).map((silhouette, i) => (
                          <span key={`sil-${i}`} className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full border border-rose-200">
                            {silhouette}
                          </span>
                        ))}
                        {fashionIntent.styleTokens.slice(0, 3).map((style, i) => (
                          <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                            {style}
                          </span>
                        ))}
                        {fashionIntent.colors.slice(0, 2).map((color, i) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                            {color}
                          </span>
                        ))}
                      </div>
                      {fashionIntent.materialTokens.length > 0 && (
                        <div className="mt-2 text-xs text-emerald-600">
                          Materials detected (downweighted to avoid fabric results): {fashionIntent.materialTokens.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Keywords (collapsed by default) */}
                  {extractedKeywords.length > 0 && (
                    <details className="mb-6">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        View raw extracted keywords ({extractedKeywords.length})
                      </summary>
                      <div className="mt-2 p-4 bg-gray-50 rounded-xl">
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
                    </details>
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
