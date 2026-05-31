import { Pool } from "pg";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type Target = "dev" | "prod";
type PoolConnectClient = {
  query: (text: string) => Promise<unknown>;
};

function parseTarget(value: string | undefined): Target {
  if (value === "prod") return "prod";
  return "dev";
}

function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  }
}

export function getDbTarget(): Target {
  return parseTarget(process.env.DB_TARGET);
}

export function resolveDatabaseUrl(target: Target): string {
  const devUrl = process.env.DATABASE_URL_DEV;
  const prodUrl = process.env.DATABASE_URL_PROD;
  const fallback = process.env.DATABASE_URL;

  if (target === "prod") {
    return prodUrl || fallback || "";
  }
  return devUrl || fallback || "";
}

export function createDbPool(target = getDbTarget()): Pool {
  const connectionString = resolveDatabaseUrl(target);
  if (!connectionString) {
    const varName = target === "prod" ? "DATABASE_URL_PROD" : "DATABASE_URL_DEV";
    throw new Error(
      `No database URL found for target "${target}". Set ${varName} (or DATABASE_URL as fallback).`,
    );
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 30000,
    ssl: isLocalDatabaseUrl(connectionString) ? false : { rejectUnauthorized: false },
  });

  pool.on("connect", async (client: PoolConnectClient) => {
    await client.query("SET search_path TO public");
  });

  return pool;
}
