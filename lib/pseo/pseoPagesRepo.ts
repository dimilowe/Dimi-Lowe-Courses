import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { recordCacheMiss, recordCacheRequest } from "@/lib/ops/metrics";

const REVALIDATE_SECONDS = 60 * 60;

export type PseoFaqItem = {
  question: string;
  answer: string;
};

export type PseoPageBody = Record<string, unknown> & {
  faq?: PseoFaqItem[];
};

export type PseoPage = {
  slug: string;
  bankSlug: string;
  templateSlug: string;
  entityKey: string;
  urlPath: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  body: PseoPageBody;
  toolSlug: string;
  hubPath: string;
  siblingSlugs: string[];
  canonical: string;
  qualityScore: number;
  isIndexed: boolean;
  reasonNoindex: string | null;
};

export type PseoIndexedSlug = {
  slug: string;
  qualityScore: number;
};

type PseoPageRow = {
  slug: string;
  bank_slug: string;
  template_slug: string;
  entity_key: string;
  url_path: string;
  title: string;
  meta_description: string;
  h1: string;
  intro: string;
  body_json: PseoPageBody | null;
  tool_slug: string;
  hub_path: string;
  sibling_slugs: string[] | null;
  canonical: string;
  quality_score: number;
  is_indexed: boolean;
  reason_noindex: string | null;
};

type PseoIndexedSlugRow = {
  slug: string;
  quality_score: number | null;
};

function isMissingTableError(error: unknown): boolean {
  const candidate = error as { code?: string };
  return candidate?.code === "42P01";
}

function mapPageRow(row: PseoPageRow): PseoPage {
  return {
    slug: row.slug,
    bankSlug: row.bank_slug,
    templateSlug: row.template_slug,
    entityKey: row.entity_key,
    urlPath: row.url_path,
    title: row.title,
    metaDescription: row.meta_description,
    h1: row.h1,
    intro: row.intro,
    body: row.body_json || {},
    toolSlug: row.tool_slug,
    hubPath: row.hub_path,
    siblingSlugs: row.sibling_slugs || [],
    canonical: row.canonical,
    qualityScore: row.quality_score || 0,
    isIndexed: !!row.is_indexed,
    reasonNoindex: row.reason_noindex,
  };
}

const fetchPseoPagesByBankCached = unstable_cache(
  async (bankSlug: string, indexedOnly: boolean): Promise<PseoPageRow[]> => {
    recordCacheMiss(indexedOnly ? `pseo-${bankSlug}-pages-indexed` : `pseo-${bankSlug}-pages-all`);
    try {
      const result = await query(
        `
        SELECT slug, bank_slug, template_slug, entity_key, url_path, title, meta_description, h1, intro, body_json,
               tool_slug, hub_path, sibling_slugs, canonical, quality_score, is_indexed, reason_noindex
        FROM pseo_pages
        WHERE bank_slug = $1
          ${indexedOnly ? "AND is_indexed = true" : ""}
        ORDER BY template_slug ASC, slug ASC
        `,
        [bankSlug]
      );
      return result.rows as PseoPageRow[];
    } catch (error) {
      if (isMissingTableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["pseo-pages-by-bank-v1"],
  { revalidate: REVALIDATE_SECONDS }
);

const fetchPseoPageBySlugCached = unstable_cache(
  async (slug: string): Promise<PseoPageRow | null> => {
    recordCacheMiss("pseo-page-by-slug");
    try {
      const result = await query(
        `
        SELECT slug, bank_slug, template_slug, entity_key, url_path, title, meta_description, h1, intro, body_json,
               tool_slug, hub_path, sibling_slugs, canonical, quality_score, is_indexed, reason_noindex
        FROM pseo_pages
        WHERE slug = $1
        LIMIT 1
        `,
        [slug]
      );
      return (result.rows[0] as PseoPageRow | undefined) || null;
    } catch (error) {
      if (isMissingTableError(error)) {
        return null;
      }
      throw error;
    }
  },
  ["pseo-page-by-slug-v1"],
  { revalidate: REVALIDATE_SECONDS }
);

const fetchAllIndexedPseoPagesCached = unstable_cache(
  async (): Promise<PseoPageRow[]> => {
    recordCacheMiss("pseo-pages-all-indexed");
    try {
      const result = await query(
        `
        SELECT slug, bank_slug, template_slug, entity_key, url_path, title, meta_description, h1, intro, body_json,
               tool_slug, hub_path, sibling_slugs, canonical, quality_score, is_indexed, reason_noindex
        FROM pseo_pages
        WHERE is_indexed = true
        ORDER BY bank_slug ASC, template_slug ASC, slug ASC
        `
      );
      return result.rows as PseoPageRow[];
    } catch (error) {
      if (isMissingTableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["pseo-pages-all-indexed-v1"],
  { revalidate: REVALIDATE_SECONDS }
);

const fetchAllIndexedPseoSlugsCached = unstable_cache(
  async (): Promise<PseoIndexedSlugRow[]> => {
    recordCacheMiss("pseo-pages-indexed-slugs");
    try {
      const result = await query(
        `
        SELECT slug, quality_score
        FROM pseo_pages
        WHERE is_indexed = true
        ORDER BY quality_score DESC NULLS LAST, slug ASC
        `
      );
      return result.rows as PseoIndexedSlugRow[];
    } catch (error) {
      if (isMissingTableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["pseo-pages-indexed-slugs-v1"],
  { revalidate: REVALIDATE_SECONDS }
);

export async function getPseoPagesByBank(
  bankSlug: string,
  options?: { indexedOnly?: boolean }
): Promise<PseoPage[]> {
  const indexedOnly = options?.indexedOnly ?? false;
  recordCacheRequest(indexedOnly ? `pseo-${bankSlug}-pages-indexed` : `pseo-${bankSlug}-pages-all`);
  const rows = await fetchPseoPagesByBankCached(bankSlug, indexedOnly);
  return rows.map(mapPageRow);
}

export async function getPseoPageBySlug(slug: string): Promise<PseoPage | null> {
  recordCacheRequest("pseo-page-by-slug");
  const row = await fetchPseoPageBySlugCached(slug);
  return row ? mapPageRow(row) : null;
}

export async function getAllIndexedPseoPages(): Promise<PseoPage[]> {
  recordCacheRequest("pseo-pages-all-indexed");
  const rows = await fetchAllIndexedPseoPagesCached();
  return rows.map(mapPageRow);
}

export async function getAllIndexedPseoSlugs(): Promise<PseoIndexedSlug[]> {
  recordCacheRequest("pseo-pages-indexed-slugs");
  const rows = await fetchAllIndexedPseoSlugsCached();
  return rows.map((row) => ({
    slug: row.slug,
    qualityScore: row.quality_score || 0,
  }));
}
