import { randomBytes, createHash } from "crypto";
import { query } from "@/lib/db";

const RESET_TOKEN_TTL_MINUTES = 60;
let resetTableEnsured = false;

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function ensureResetTable() {
  if (resetTableEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_email
    ON auth_password_reset_tokens (LOWER(email))
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_expires
    ON auth_password_reset_tokens (expires_at)
  `);

  resetTableEnsured = true;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  await ensureResetTable();

  const normalizedEmail = normalizeEmail(email);
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);

  await query(
    `INSERT INTO auth_password_reset_tokens (email, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
    [normalizedEmail, tokenHash, String(RESET_TOKEN_TTL_MINUTES)]
  );

  return token;
}

export async function consumePasswordResetToken(token: string): Promise<{ email: string } | null> {
  await ensureResetTable();

  const tokenHash = sha256(token);
  const result = await query(
    `UPDATE auth_password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING email`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;
  return { email: result.rows[0].email as string };
}
