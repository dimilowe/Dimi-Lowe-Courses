import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { query } from "@/lib/db";
import { ensureSignupAuditTable } from "@/lib/auth-signup-audit";

function clampLimit(value: string | null): number {
  if (!value) return 100;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(500, parsed));
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSignupAuditTable();

    const searchParams = request.nextUrl.searchParams;
    const limit = clampLimit(searchParams.get("limit"));
    const outcome = searchParams.get("outcome")?.trim() || null;
    const email = searchParams.get("email")?.trim().toLowerCase() || null;

    const where: string[] = [];
    const params: Array<string | number> = [];
    let paramIndex = 1;

    if (outcome) {
      where.push(`outcome = $${paramIndex++}`);
      params.push(outcome);
    }

    if (email) {
      where.push(`email_normalized = $${paramIndex++}`);
      params.push(email);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    params.push(limit);
    const limitParam = `$${paramIndex}`;

    const result = await query(
      `SELECT id, attempt_id, outcome, email, user_id, reason, error_code, status_code, ip, user_agent, created_at
       FROM auth_signup_audit
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${limitParam}`,
      params
    );

    return NextResponse.json({
      filters: { limit, outcome, email },
      count: result.rows.length,
      events: result.rows.map((row: any) => ({
        id: row.id,
        attemptId: row.attempt_id,
        outcome: row.outcome,
        email: maskEmail(row.email),
        userId: row.user_id,
        reason: row.reason,
        errorCode: row.error_code,
        statusCode: row.status_code,
        ip: row.ip,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch signup audit events:", error);
    return NextResponse.json({ error: "Failed to fetch signup audit events" }, { status: 500 });
  }
}
