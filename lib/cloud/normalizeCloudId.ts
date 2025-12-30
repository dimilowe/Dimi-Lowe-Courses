/**
 * Cloud ID Normalization
 * 
 * Global Workspace Rules:
 * - Validation is optional - don't break on unknown clouds
 * - Log warnings but store the string anyway
 * - Prevents "new cloud launched → workspace breaks"
 */

export const CANONICAL_CLOUD_IDS = new Set([
  "creation",
  "video",
  "writing-seo",
  "file-data",
  "monetize",
  "intelligence",
  "music-performance",
  "growth-distribution",
  "shopping",
  "advertising",
  "gaming",
  "ecommerce",
]);

const LEGACY_TO_CANONICAL: Record<string, string> = {
  writing: "writing-seo",
  file: "file-data",
  files: "file-data",
  music: "music-performance",
  growth: "growth-distribution",

  creation: "creation",
  video: "video",
  monetize: "monetize",
  intelligence: "intelligence",
  "writing-seo": "writing-seo",
  "file-data": "file-data",
  "music-performance": "music-performance",
  "growth-distribution": "growth-distribution",
  shopping: "shopping",
  advertising: "advertising",
  gaming: "gaming",
  ecommerce: "ecommerce",
};

export function normalizeCloudId(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = String(input).trim();
  
  // Try canonical mapping first
  if (LEGACY_TO_CANONICAL[key]) {
    return LEGACY_TO_CANONICAL[key];
  }
  
  // If not in mapping, log warning but return the input as-is
  // This prevents "new cloud launched → workspace breaks"
  if (key && !CANONICAL_CLOUD_IDS.has(key)) {
    console.warn(`[normalizeCloudId] Unknown cloud ID: "${key}" - storing as-is`);
  }
  
  return key || null;
}

export function assertCanonicalCloudId(input: string | null | undefined): string | null {
  const normalized = normalizeCloudId(input);
  if (!normalized) return null;
  return CANONICAL_CLOUD_IDS.has(normalized) ? normalized : null;
}
