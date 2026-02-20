export type SalesPageTemplateId = "default" | "longform_offer_v1";

export interface SalesPagePainPoint {
  title: string;
  problem: string;
  solution?: string;
}

export interface SalesPageStep {
  label?: string;
  title: string;
  description: string;
}

export interface SalesPageFaqItem {
  question: string;
  answer: string;
}

export interface SalesPageMeta {
  template_id: SalesPageTemplateId;
  hero_headline?: string;
  hero_subheadline?: string;
  hero_supporting_text?: string;
  hero_image_url?: string;
  primary_cta_label?: string;
  promise_points?: string[];
  pain_points?: SalesPagePainPoint[];
  steps?: SalesPageStep[];
  feature_bullets?: string[];
  faq?: SalesPageFaqItem[];
  guarantee_text?: string;
  theme?: {
    primary_color?: string;
    accent_color?: string;
    surface_color?: string;
    text_color?: string;
    muted_text_color?: string;
  };
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return toObject(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNonEmptyString(item))
    .filter((item): item is string => Boolean(item));
}

function toColorString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
  return validHex ? trimmed : undefined;
}

function toPainPoints(value: unknown): SalesPagePainPoint[] {
  if (!Array.isArray(value)) return [];

  const parsed: SalesPagePainPoint[] = [];
  for (const item of value) {
    const record = toObject(item);
    if (!record) continue;
    const title = toNonEmptyString(record.title);
    const problem = toNonEmptyString(record.problem);
    if (!title || !problem) continue;
    parsed.push({
      title,
      problem,
      solution: toNonEmptyString(record.solution),
    });
  }
  return parsed;
}

function toSteps(value: unknown): SalesPageStep[] {
  if (!Array.isArray(value)) return [];

  const parsed: SalesPageStep[] = [];
  for (const item of value) {
    const record = toObject(item);
    if (!record) continue;
    const title = toNonEmptyString(record.title);
    const description = toNonEmptyString(record.description);
    if (!title || !description) continue;
    parsed.push({
      label: toNonEmptyString(record.label),
      title,
      description,
    });
  }
  return parsed;
}

function toFaq(value: unknown): SalesPageFaqItem[] {
  if (!Array.isArray(value)) return [];

  const parsed: SalesPageFaqItem[] = [];
  for (const item of value) {
    const record = toObject(item);
    if (!record) continue;
    const question = toNonEmptyString(record.question);
    const answer = toNonEmptyString(record.answer);
    if (!question || !answer) continue;
    parsed.push({ question, answer });
  }
  return parsed;
}

export function extractSalesPageMeta(meta: unknown): SalesPageMeta | null {
  const parsedMeta = toObject(meta);
  if (!parsedMeta) return null;

  const raw = toObject(parsedMeta.sales_page);
  if (!raw) return null;

  const templateIdRaw = toNonEmptyString(raw.template_id);
  if (!templateIdRaw) return null;
  if (templateIdRaw !== "default" && templateIdRaw !== "longform_offer_v1") return null;

  const result: SalesPageMeta = {
    template_id: templateIdRaw,
    hero_headline: toNonEmptyString(raw.hero_headline),
    hero_subheadline: toNonEmptyString(raw.hero_subheadline),
    hero_supporting_text: toNonEmptyString(raw.hero_supporting_text),
    hero_image_url: toNonEmptyString(raw.hero_image_url),
    primary_cta_label: toNonEmptyString(raw.primary_cta_label),
    promise_points: toStringArray(raw.promise_points),
    pain_points: toPainPoints(raw.pain_points),
    steps: toSteps(raw.steps),
    feature_bullets: toStringArray(raw.feature_bullets),
    faq: toFaq(raw.faq),
    guarantee_text: toNonEmptyString(raw.guarantee_text),
    theme: {
      primary_color: toColorString(toObject(raw.theme)?.primary_color),
      accent_color: toColorString(toObject(raw.theme)?.accent_color),
      surface_color: toColorString(toObject(raw.theme)?.surface_color),
      text_color: toColorString(toObject(raw.theme)?.text_color),
      muted_text_color: toColorString(toObject(raw.theme)?.muted_text_color),
    },
  };

  return result;
}
