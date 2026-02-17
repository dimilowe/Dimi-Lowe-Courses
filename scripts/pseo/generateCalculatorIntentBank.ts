import { createDbPool, getDbTarget } from "../db/connection";
import {
  CALCULATOR_INTENT_BANK_HUB_PATH,
  CALCULATOR_INTENT_BANK_SLUG,
  calculatorIntentEntities,
  calculatorIntentTemplates,
  type CalculatorIntentEntity,
  type CalculatorIntentTemplate,
} from "../../data/pseo/calculatorIntentBank";

type GeneratedPage = {
  slug: string;
  bankSlug: string;
  templateSlug: string;
  entityKey: string;
  urlPath: string;
  canonical: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  bodyJson: Record<string, unknown>;
  toolSlug: string;
  hubPath: string;
  siblingSlugs: string[];
  qualityScore: number;
  isIndexed: boolean;
  reasonNoindex: string | null;
};

function fillTemplate(input: string, entity: CalculatorIntentEntity): string {
  return input.replaceAll("{intent}", entity.intent);
}

function wordCount(input: string): number {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function humanizePhrase(phrase: string): string {
  return phrase
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace("Bmi", "BMI")
    .replace("Ups", "UPS");
}

function buildBasePage(
  template: CalculatorIntentTemplate,
  entity: CalculatorIntentEntity
): GeneratedPage {
  const slug = `${entity.key}-${template.phraseSlug}`;
  const urlPath = `/tools/queries/${slug}`;
  const title = fillTemplate(template.titlePattern, entity);
  const metaDescription = fillTemplate(template.descriptionPattern, entity);
  const h1 = humanizePhrase(fillTemplate(template.phrase, entity));
  const intro = fillTemplate(template.introPattern, entity);

  const bodyJson: Record<string, unknown> = {
    entityName: entity.intent,
    intent: entity.intent,
    topic: entity.topic,
    audience: entity.audience,
    primaryInput: entity.primaryInput,
    primaryOutput: entity.primaryOutput,
    formulaHint: entity.formulaHint,
    bestFor: entity.bestFor,
    notes: entity.notes,
    faq: [
      {
        question: `What inputs are needed for a ${entity.intent} calculator?`,
        answer: `Typical inputs include ${entity.primaryInput}.`,
      },
      {
        question: `What does a ${entity.intent} calculator output?`,
        answer: `It usually returns ${entity.primaryOutput}.`,
      },
      {
        question: `How can I improve ${entity.intent} estimate accuracy?`,
        answer:
          "Use realistic assumptions, verify unit consistency, and compare outputs across multiple scenarios before making decisions.",
      },
    ],
  };

  return {
    slug,
    bankSlug: CALCULATOR_INTENT_BANK_SLUG,
    templateSlug: template.slug,
    entityKey: entity.key,
    urlPath,
    canonical: urlPath,
    title,
    metaDescription,
    h1,
    intro,
    bodyJson,
    toolSlug: entity.toolSlug,
    hubPath: CALCULATOR_INTENT_BANK_HUB_PATH,
    siblingSlugs: [],
    qualityScore: 0,
    isIndexed: false,
    reasonNoindex: null,
  };
}

function buildSiblingSlugs(allPages: GeneratedPage[], page: GeneratedPage): string[] {
  const sameEntityDifferentTemplate = allPages
    .filter((candidate) => candidate.entityKey === page.entityKey && candidate.slug !== page.slug)
    .map((candidate) => candidate.slug);

  const sameTemplateOtherEntities = allPages
    .filter((candidate) => candidate.templateSlug === page.templateSlug && candidate.slug !== page.slug)
    .slice(0, 4)
    .map((candidate) => candidate.slug);

  const merged = [...sameEntityDifferentTemplate, ...sameTemplateOtherEntities];
  return [...new Set(merged)].slice(0, 6);
}

function applyQualityGate(page: GeneratedPage): GeneratedPage {
  const reasons: string[] = [];
  let score = 0;

  if (page.title.length >= 35 && page.title.length <= 100) {
    score += 25;
  } else {
    reasons.push("title_length_out_of_range");
  }

  if (page.metaDescription.length >= 90 && page.metaDescription.length <= 180) {
    score += 25;
  } else {
    reasons.push("meta_description_length_out_of_range");
  }

  if (wordCount(page.intro) >= 18) {
    score += 20;
  } else {
    reasons.push("intro_too_short");
  }

  const intent = String((page.bodyJson as { intent?: string }).intent || "").trim();
  const output = String((page.bodyJson as { primaryOutput?: string }).primaryOutput || "").trim();
  if (intent.length > 0 && output.length > 0) {
    score += 15;
  } else {
    reasons.push("missing_calculator_data");
  }

  if (page.siblingSlugs.length >= 3) {
    score += 15;
  } else {
    reasons.push("insufficient_internal_links");
  }

  return {
    ...page,
    qualityScore: score,
    isIndexed: score >= 80,
    reasonNoindex: score >= 80 ? null : reasons.join(","),
  };
}

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const client = await pool.connect();
  const nowIso = new Date().toISOString();

  try {
    console.log(`[pseo:calculator-intent] target=${target}`);
    console.log(
      `[pseo:calculator-intent] templates=${calculatorIntentTemplates.length} entities=${calculatorIntentEntities.length}`
    );

    await client.query("BEGIN");

    for (const template of calculatorIntentTemplates) {
      await client.query(
        `
        INSERT INTO pseo_templates
          (slug, bank_slug, phrase, phrase_slug, title_pattern, description_pattern, cta_tool_slug, is_active, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, true, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET
          bank_slug = EXCLUDED.bank_slug,
          phrase = EXCLUDED.phrase,
          phrase_slug = EXCLUDED.phrase_slug,
          title_pattern = EXCLUDED.title_pattern,
          description_pattern = EXCLUDED.description_pattern,
          cta_tool_slug = EXCLUDED.cta_tool_slug,
          is_active = true,
          updated_at = NOW()
        `,
        [
          template.slug,
          CALCULATOR_INTENT_BANK_SLUG,
          template.phrase,
          template.phraseSlug,
          template.titlePattern,
          template.descriptionPattern,
          "all",
        ]
      );
    }

    for (const entity of calculatorIntentEntities) {
      await client.query(
        `
        INSERT INTO pseo_entities
          (bank_slug, entity_key, entity_name, search_term, data, priority, is_active, updated_at)
        VALUES
          ($1, $2, $3, $4, $5::jsonb, $6, true, NOW())
        ON CONFLICT (bank_slug, entity_key)
        DO UPDATE SET
          entity_name = EXCLUDED.entity_name,
          search_term = EXCLUDED.search_term,
          data = EXCLUDED.data,
          priority = EXCLUDED.priority,
          is_active = true,
          updated_at = NOW()
        `,
        [
          CALCULATOR_INTENT_BANK_SLUG,
          entity.key,
          humanizePhrase(entity.intent),
          `${entity.intent.toLowerCase()} calculator`,
          JSON.stringify({
            intent: entity.intent,
            topic: entity.topic,
            audience: entity.audience,
            primaryInput: entity.primaryInput,
            primaryOutput: entity.primaryOutput,
            formulaHint: entity.formulaHint,
            toolSlug: entity.toolSlug,
            bestFor: entity.bestFor,
            notes: entity.notes,
          }),
          entity.priority,
        ]
      );
    }

    const unsortedPages: GeneratedPage[] = [];
    for (const entity of [...calculatorIntentEntities].sort((a, b) => a.priority - b.priority)) {
      for (const template of calculatorIntentTemplates) {
        unsortedPages.push(buildBasePage(template, entity));
      }
    }

    const preparedPages = unsortedPages.map((page) => ({
      ...page,
      siblingSlugs: buildSiblingSlugs(unsortedPages, page),
    }));

    const generatedPages = preparedPages.map(applyQualityGate);
    const allPageSlugs = generatedPages.map((page) => page.slug);
    const allPagePaths = generatedPages.map((page) => page.urlPath);

    for (const page of generatedPages) {
      await client.query(
        `
        INSERT INTO pseo_pages
          (slug, bank_slug, template_slug, entity_key, url_path, title, meta_description, h1, intro, body_json,
           tool_slug, hub_path, sibling_slugs, canonical, quality_score, is_indexed, reason_noindex, generated_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::text[], $14, $15, $16, $17, $18::timestamptz, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET
          bank_slug = EXCLUDED.bank_slug,
          template_slug = EXCLUDED.template_slug,
          entity_key = EXCLUDED.entity_key,
          url_path = EXCLUDED.url_path,
          title = EXCLUDED.title,
          meta_description = EXCLUDED.meta_description,
          h1 = EXCLUDED.h1,
          intro = EXCLUDED.intro,
          body_json = EXCLUDED.body_json,
          tool_slug = EXCLUDED.tool_slug,
          hub_path = EXCLUDED.hub_path,
          sibling_slugs = EXCLUDED.sibling_slugs,
          canonical = EXCLUDED.canonical,
          quality_score = EXCLUDED.quality_score,
          is_indexed = EXCLUDED.is_indexed,
          reason_noindex = EXCLUDED.reason_noindex,
          generated_at = EXCLUDED.generated_at,
          updated_at = NOW()
        `,
        [
          page.slug,
          page.bankSlug,
          page.templateSlug,
          page.entityKey,
          page.urlPath,
          page.title,
          page.metaDescription,
          page.h1,
          page.intro,
          JSON.stringify(page.bodyJson),
          page.toolSlug,
          page.hubPath,
          page.siblingSlugs,
          page.canonical,
          page.qualityScore,
          page.isIndexed,
          page.reasonNoindex,
          nowIso,
        ]
      );

      await client.query(
        `
        INSERT INTO global_urls (url, title, type, is_indexed, canonical, notes)
        VALUES ($1, $2, 'tool', $3, $4, $5)
        ON CONFLICT (url)
        DO UPDATE SET
          title = EXCLUDED.title,
          type = EXCLUDED.type,
          is_indexed = EXCLUDED.is_indexed,
          canonical = EXCLUDED.canonical,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        `,
        [
          page.urlPath,
          page.title,
          page.isIndexed,
          page.canonical,
          `calculator-intent-bank:${page.templateSlug}:${page.entityKey}`,
        ]
      );
    }

    await client.query(
      `
      UPDATE pseo_pages
      SET is_indexed = false,
          reason_noindex = 'no_longer_generated',
          updated_at = NOW()
      WHERE bank_slug = $1
        AND NOT (slug = ANY($2::text[]))
      `,
      [CALCULATOR_INTENT_BANK_SLUG, allPageSlugs]
    );

    await client.query(
      `
      UPDATE global_urls
      SET is_indexed = false,
          notes = COALESCE(notes, '') || ' [stale]',
          updated_at = NOW()
      WHERE notes LIKE 'calculator-intent-bank:%'
        AND NOT (url = ANY($1::text[]))
      `,
      [allPagePaths]
    );

    await client.query(
      `
      INSERT INTO global_urls (url, title, type, is_indexed, canonical, notes)
      VALUES ($1, $2, 'tool', true, $1, $3)
      ON CONFLICT (url)
      DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        is_indexed = true,
        canonical = EXCLUDED.canonical,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      `,
      [CALCULATOR_INTENT_BANK_HUB_PATH, "Calculator Bank", "calculator-intent-bank:hub"]
    );

    await client.query("COMMIT");

    const indexedCount = generatedPages.filter((page) => page.isIndexed).length;
    const noindexCount = generatedPages.length - indexedCount;

    console.log(`[pseo:calculator-intent] generated_pages=${generatedPages.length}`);
    console.log(`[pseo:calculator-intent] indexed=${indexedCount} noindex=${noindexCount}`);
    console.log(`[pseo:calculator-intent] hub=${CALCULATOR_INTENT_BANK_HUB_PATH}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[pseo:calculator-intent] failed:", error);
  process.exit(1);
});
