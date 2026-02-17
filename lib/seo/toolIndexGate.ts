import { unstable_cache } from "next/cache";
import type { ToolForRenderer } from "@/lib/cms/getCmsToolBySlug";
import { getAllCmsTools } from "@/lib/cms/getCmsToolBySlug";
import { getCanonicalToolPath } from "@/lib/seo/urlNormalization";

const TOOL_INDEXING_REVALIDATE_SECONDS = 60 * 60;
const MIN_DESCRIPTION_WORDS = 10;
const MIN_DESCRIPTION_CHARS = 70;
const MIN_TITLE_CHARS = 12;

type DuplicateMap = Record<string, { canonicalSlug: string; groupSize: number }>;

type IndexReason =
  | "explicit_noindex"
  | "thin_title"
  | "thin_description"
  | "duplicate_variant";

export interface ToolIndexDecision {
  shouldIndex: boolean;
  canonicalPath: string;
  reasons: IndexReason[];
  duplicateGroupSize: number;
}

function normalizeTitleForDedup(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(input: string): number {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

const getDuplicateCanonicalMapCached = unstable_cache(
  async (): Promise<DuplicateMap> => {
    const tools = await getAllCmsTools({ includeDrafts: true });
    const groups = new Map<string, string[]>();

    for (const tool of tools) {
      const normalizedTitle = normalizeTitleForDedup(tool.name || "");
      if (!normalizedTitle) continue;
      const list = groups.get(normalizedTitle) ?? [];
      list.push(tool.slug);
      groups.set(normalizedTitle, list);
    }

    const duplicateMap: DuplicateMap = {};

    for (const slugs of groups.values()) {
      if (slugs.length < 2) continue;
      const sorted = [...slugs].sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
      });
      const canonicalSlug = sorted[0];
      for (const slug of sorted) {
        duplicateMap[slug] = {
          canonicalSlug,
          groupSize: sorted.length,
        };
      }
    }

    return duplicateMap;
  },
  ["tool-duplicate-canonical-map-v1"],
  { revalidate: TOOL_INDEXING_REVALIDATE_SECONDS }
);

export async function getToolIndexDecision(tool: ToolForRenderer): Promise<ToolIndexDecision> {
  const reasons: IndexReason[] = [];
  const duplicateMap = await getDuplicateCanonicalMapCached();
  const duplicate = duplicateMap[tool.slug];
  const canonicalSlug = duplicate?.canonicalSlug ?? tool.slug;
  const canonicalPath = getCanonicalToolPath(canonicalSlug);

  if (!tool.isIndexed) {
    reasons.push("explicit_noindex");
  }

  if ((tool.name || "").trim().length < MIN_TITLE_CHARS) {
    reasons.push("thin_title");
  }

  const candidateDescription = (tool.seo?.metaDescription || tool.description || "").trim();
  if (
    candidateDescription.length < MIN_DESCRIPTION_CHARS ||
    countWords(candidateDescription) < MIN_DESCRIPTION_WORDS
  ) {
    reasons.push("thin_description");
  }

  if (duplicate && duplicate.canonicalSlug !== tool.slug) {
    reasons.push("duplicate_variant");
  }

  return {
    shouldIndex: reasons.length === 0,
    canonicalPath,
    reasons,
    duplicateGroupSize: duplicate?.groupSize ?? 1,
  };
}
