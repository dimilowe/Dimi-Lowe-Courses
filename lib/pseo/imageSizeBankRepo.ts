import { getPseoPageBySlug, getPseoPagesByBank, type PseoPage } from "@/lib/pseo/pseoPagesRepo";

type ImageSizeBody = {
  entityName?: string;
  platform?: string;
  assetType?: string;
  width?: number;
  height?: number;
  pixels?: string;
  aspectRatio?: string;
  safeAreaTips?: string;
  notes?: string;
  faq?: { question: string; answer: string }[];
} & Record<string, unknown>;

export type ImageSizeBankPage = {
  bankSlug: string;
  slug: string;
  templateSlug: string;
  entityKey: string;
  urlPath: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  body: ImageSizeBody;
  toolSlug: string;
  hubPath: string;
  siblingSlugs: string[];
  canonical: string;
  qualityScore: number;
  isIndexed: boolean;
  reasonNoindex: string | null;
};

function mapPage(page: PseoPage): ImageSizeBankPage {
  return {
    bankSlug: page.bankSlug,
    slug: page.slug,
    templateSlug: page.templateSlug,
    entityKey: page.entityKey,
    urlPath: page.urlPath,
    title: page.title,
    metaDescription: page.metaDescription,
    h1: page.h1,
    intro: page.intro,
    body: page.body as ImageSizeBody,
    toolSlug: page.toolSlug,
    hubPath: page.hubPath,
    siblingSlugs: page.siblingSlugs,
    canonical: page.canonical,
    qualityScore: page.qualityScore,
    isIndexed: page.isIndexed,
    reasonNoindex: page.reasonNoindex,
  };
}

export async function getImageSizeBankPages(options?: {
  indexedOnly?: boolean;
}): Promise<ImageSizeBankPage[]> {
  const rows = await getPseoPagesByBank("image-size", options);
  return rows.map(mapPage);
}

export async function getImageSizeBankPageBySlug(slug: string): Promise<ImageSizeBankPage | null> {
  const row = await getPseoPageBySlug(slug);
  if (!row || row.bankSlug !== "image-size") {
    return null;
  }
  return mapPage(row);
}
