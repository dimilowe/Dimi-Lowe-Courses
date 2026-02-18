import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { recordDbQuery } from "@/lib/ops/metrics";

// Configure Neon for serverless environments (like APE)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use Neon serverless driver for both dev and production
// This ensures one shared database across all environments
function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const defaultPoolMax = isProductionBuild ? 2 : 10;
const defaultConnectTimeoutMs = isProductionBuild ? 10000 : 30000;
const defaultIdleTimeoutMs = 30000;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: readPositiveIntEnv("DB_POOL_MAX", defaultPoolMax),
  idleTimeoutMillis: readPositiveIntEnv("DB_POOL_IDLE_TIMEOUT_MS", defaultIdleTimeoutMs),
  connectionTimeoutMillis: readPositiveIntEnv(
    "DB_POOL_CONNECT_TIMEOUT_MS",
    defaultConnectTimeoutMs
  ),
  allowExitOnIdle: true,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  recordDbQuery(duration);
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function withTransaction<T>(
  callback: (client: { query: typeof query }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const clientQuery = async (text: string, params?: any[]) => {
      const start = Date.now();
      const res = await client.query(text, params);
      const duration = Date.now() - start;
      recordDbQuery(duration);
      console.log('executed query (tx)', { text, duration, rows: res.rowCount });
      return res;
    };
    const result = await callback({ query: clientQuery });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
