import { createDbPool, getDbTarget } from "./connection";

const PSEO_BANK_SLUGS = [
  "image-size",
  "file-convert",
  "unit-convert",
  "pdf-task",
  "calculator-intent",
  "image-format-convert",
];

const RETIRED_HUB_URLS = [
  "/tools/image-size-bank",
  "/tools/file-convert-bank",
  "/tools/unit-convert-bank",
  "/tools/pdf-task-bank",
  "/tools/calculator-bank",
  "/tools/image-format-convert-bank",
];

const NOTE_PATTERNS = [
  "image-size-bank:%",
  "file-convert-bank:%",
  "unit-convert-bank:%",
  "pdf-task-bank:%",
  "calculator-intent-bank:%",
  "image-format-convert-bank:%",
];

async function tableExists(query: (text: string, params?: unknown[]) => Promise<any>, tableName: string) {
  const result = await query("SELECT to_regclass($1) as regclass", [tableName]);
  return Boolean(result.rows[0]?.regclass);
}

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const query = (text: string, params?: unknown[]) => pool.query(text, params);

  try {
    console.log(`[db:retire:pseo] target=${target}`);

    const [globalUrlsExists, snapshotsExists, pseoPagesExists, pseoEntitiesExists, pseoTemplatesExists] =
      await Promise.all([
        tableExists(query, "global_urls"),
        tableExists(query, "seo_health_snapshots"),
        tableExists(query, "pseo_pages"),
        tableExists(query, "pseo_entities"),
        tableExists(query, "pseo_templates"),
      ]);

    await query("BEGIN");

    if (globalUrlsExists) {
      const deleted = await query(
        `DELETE FROM global_urls
         WHERE url LIKE '/tools/queries/%'
            OR url = ANY($1::text[])
            OR notes LIKE ANY($2::text[])`,
        [RETIRED_HUB_URLS, NOTE_PATTERNS]
      );
      console.log(`[db:retire:pseo] global_urls deleted=${deleted.rowCount ?? 0}`);
    } else {
      console.log("[db:retire:pseo] global_urls table missing, skipping.");
    }

    if (snapshotsExists) {
      const deleted = await query(
        `DELETE FROM seo_health_snapshots
         WHERE slug LIKE '/tools/queries/%'
            OR slug = ANY($1::text[])`,
        [RETIRED_HUB_URLS]
      );
      console.log(`[db:retire:pseo] seo_health_snapshots deleted=${deleted.rowCount ?? 0}`);
    } else {
      console.log("[db:retire:pseo] seo_health_snapshots table missing, skipping.");
    }

    if (pseoPagesExists) {
      const deleted = await query(
        `DELETE FROM pseo_pages
         WHERE bank_slug = ANY($1::text[])
            OR url_path LIKE '/tools/queries/%'
            OR hub_path = ANY($2::text[])`,
        [PSEO_BANK_SLUGS, RETIRED_HUB_URLS]
      );
      console.log(`[db:retire:pseo] pseo_pages deleted=${deleted.rowCount ?? 0}`);
    } else {
      console.log("[db:retire:pseo] pseo_pages table missing, skipping.");
    }

    if (pseoEntitiesExists) {
      const deleted = await query(
        `DELETE FROM pseo_entities
         WHERE bank_slug = ANY($1::text[])`,
        [PSEO_BANK_SLUGS]
      );
      console.log(`[db:retire:pseo] pseo_entities deleted=${deleted.rowCount ?? 0}`);
    } else {
      console.log("[db:retire:pseo] pseo_entities table missing, skipping.");
    }

    if (pseoTemplatesExists) {
      const deleted = await query(
        `DELETE FROM pseo_templates
         WHERE bank_slug = ANY($1::text[])`,
        [PSEO_BANK_SLUGS]
      );
      console.log(`[db:retire:pseo] pseo_templates deleted=${deleted.rowCount ?? 0}`);
    } else {
      console.log("[db:retire:pseo] pseo_templates table missing, skipping.");
    }

    await query("COMMIT");
    console.log("[db:retire:pseo] complete");
  } catch (error) {
    await query("ROLLBACK");
    console.error("[db:retire:pseo] failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
