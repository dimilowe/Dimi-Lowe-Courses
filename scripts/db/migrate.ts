import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createDbPool, getDbTarget } from "./connection";

type AppliedRow = {
  id: number;
  name: string;
  checksum: string;
  applied_at: string;
};

function getMigrationsDir(): string {
  return path.join(process.cwd(), "scripts", "migrations");
}

function checksumFor(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function ensureMigrationsTable(query: (sql: string, params?: unknown[]) => Promise<unknown>) {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const migrationsDir = getMigrationsDir();

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log(`[db:migrate] No migration files found in ${migrationsDir}`);
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await ensureMigrationsTable((sql, params) => client.query(sql, params as unknown[]));

    const appliedResult = await client.query<AppliedRow>(
      `SELECT id, name, checksum, applied_at FROM schema_migrations ORDER BY id ASC`,
    );
    const appliedByName = new Map(appliedResult.rows.map((row) => [row.name, row]));

    console.log(`[db:migrate] target=${target} files=${files.length} already_applied=${appliedByName.size}`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      const checksum = checksumFor(sql);
      const existing = appliedByName.get(file);

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(
            `Migration checksum mismatch for "${file}". Applied checksum differs from current file.`,
          );
        }
        console.log(`- skip ${file} (already applied)`);
        continue;
      }

      console.log(`- apply ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)`,
          [file, checksum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("[db:migrate] Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[db:migrate] Failed:", err);
  process.exit(1);
});

