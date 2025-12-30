export const CANONICAL_CLOUD_IDS = new Set([
  "creation",
  "video",
  "writing-seo",
  "file-data",
  "monetize",
  "intelligence",
  "music-performance",
  "growth-distribution",
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
};

export function normalizeCloudId(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = String(input).trim();
  return LEGACY_TO_CANONICAL[key] ?? null;
}

export function assertCanonicalCloudId(input: string | null | undefined): string | null {
  const normalized = normalizeCloudId(input);
  if (!normalized) return null;
  return CANONICAL_CLOUD_IDS.has(normalized) ? normalized : null;
}
