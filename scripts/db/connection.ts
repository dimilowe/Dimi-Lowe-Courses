import { Pool } from "pg";

type Target = "dev" | "prod";

function parseTarget(value: string | undefined): Target {
  if (value === "prod") return "prod";
  return "dev";
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

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 30000,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });
}

