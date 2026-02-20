import { query } from "@/lib/db";

export type SignupAuditOutcome =
  | "attempt"
  | "success"
  | "validation_error"
  | "duplicate_email"
  | "error";

export type SignupAuditEvent = {
  attemptId: string;
  outcome: SignupAuditOutcome;
  email?: string | null;
  userId?: string | number | null;
  reason?: string | null;
  errorCode?: string | null;
  statusCode?: number | null;
  ip?: string | null;
  userAgent?: string | null;
};

let tableReady = false;

export async function ensureSignupAuditTable(): Promise<void> {
  if (tableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS auth_signup_audit (
      id BIGSERIAL PRIMARY KEY,
      attempt_id UUID NOT NULL,
      outcome VARCHAR(32) NOT NULL,
      email TEXT,
      email_normalized TEXT,
      user_id BIGINT,
      reason TEXT,
      error_code TEXT,
      status_code INTEGER,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(
    "CREATE INDEX IF NOT EXISTS idx_auth_signup_audit_created_at ON auth_signup_audit (created_at DESC)"
  );
  await query(
    "CREATE INDEX IF NOT EXISTS idx_auth_signup_audit_email_normalized ON auth_signup_audit (email_normalized)"
  );
  await query(
    "CREATE INDEX IF NOT EXISTS idx_auth_signup_audit_outcome ON auth_signup_audit (outcome)"
  );
  await query(
    "CREATE INDEX IF NOT EXISTS idx_auth_signup_audit_attempt_id ON auth_signup_audit (attempt_id)"
  );

  tableReady = true;
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  return value || null;
}

function normalizeText(value: string | null | undefined, maxLen: number): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export async function logSignupAuditEvent(event: SignupAuditEvent): Promise<void> {
  try {
    await ensureSignupAuditTable();

    const email = normalizeText(event.email ?? null, 320);
    const emailNormalized = normalizeEmail(email);
    const reason = normalizeText(event.reason ?? null, 500);
    const errorCode = normalizeText(event.errorCode ?? null, 120);
    const ip = normalizeText(event.ip ?? null, 80);
    const userAgent = normalizeText(event.userAgent ?? null, 800);
    const userIdValue = event.userId !== undefined && event.userId !== null ? Number(event.userId) : null;
    const userId = userIdValue !== null && Number.isFinite(userIdValue) ? Math.trunc(userIdValue) : null;
    const statusCode =
      typeof event.statusCode === "number" && Number.isFinite(event.statusCode)
        ? Math.trunc(event.statusCode)
        : null;

    await query(
      `INSERT INTO auth_signup_audit (
         attempt_id, outcome, email, email_normalized, user_id, reason, error_code, status_code, ip, user_agent
       ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        event.attemptId,
        event.outcome,
        email,
        emailNormalized,
        userId,
        reason,
        errorCode,
        statusCode,
        ip,
        userAgent,
      ]
    );
  } catch (auditError) {
    console.error("Failed to write signup audit event:", auditError);
  }
}
