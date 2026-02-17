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
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
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
