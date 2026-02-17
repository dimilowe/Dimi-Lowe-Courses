export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";

  let normalized = pathname;

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");
  normalized = normalized.toLowerCase();

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

export function normalizeToolSlug(slug: string): string {
  return normalizePathname(`/tools/${slug}`)
    .replace(/^\/tools\//, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCanonicalToolPath(slug: string): string {
  return `/tools/${normalizeToolSlug(slug)}`;
}
