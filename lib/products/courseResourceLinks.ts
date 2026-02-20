export interface CourseResourceLink {
  label: string;
  url: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractCourseResourceLinks(meta: unknown): CourseResourceLink[] {
  if (typeof meta === "string") {
    try {
      return extractCourseResourceLinks(JSON.parse(meta));
    } catch {
      return [];
    }
  }

  if (!isRecord(meta)) return [];

  const raw = meta.course_resources;
  if (!Array.isArray(raw)) return [];

  const resources: CourseResourceLink[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;
    const label = toCleanString(item.label);
    const url = toCleanString(item.url);
    if (!label || !url || !isHttpUrl(url)) continue;
    resources.push({ label, url });
  }

  return resources;
}
