import { createDbPool, getDbTarget } from "./connection";

const HIDDEN_SLUGS = ["bpm-key-chord-analyzer"] as const;

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);

  try {
    console.log(`[db:sync:visibility] target=${target}`);
    const result = await pool.query(
      `UPDATE tools
       SET status = 'draft',
           in_directory = false,
           is_indexed = false,
           deleted_at = COALESCE(deleted_at, NOW()),
           updated_at = NOW()
       WHERE slug = ANY($1::text[])`,
      [HIDDEN_SLUGS],
    );
    console.log(`[db:sync:visibility] hidden rows updated: ${result.rowCount}`);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[db:sync:visibility] Failed:", err);
  process.exit(1);
});

