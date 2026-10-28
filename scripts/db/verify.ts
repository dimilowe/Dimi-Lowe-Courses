import { createDbPool, getDbTarget } from "./connection";

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const query = (text: string, params?: unknown[]) => pool.query(text, params);

  try {
    console.log(`[db:verify] target=${target}`);

    for (const table of ["users", "products", "entitlements", "purchases", "workspace_items"]) {
      const result = await query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      console.log(`[db:verify] ${table}: ${result.rows[0]?.count ?? 0}`);
    }

  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[db:verify] Failed:", err);
  process.exit(1);
});
