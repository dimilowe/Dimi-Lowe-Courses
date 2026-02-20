import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { getRuntimeDbMeta, query } from "@/lib/db";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dbInfoResult, userCountResult, latestUsersResult] = await Promise.all([
      query("SELECT current_database() AS database_name, current_user AS db_user, NOW() AS server_time"),
      query("SELECT COUNT(*)::int AS user_count FROM users"),
      query("SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
    ]);

    const dbInfo = dbInfoResult.rows[0] || {};
    const userCount = Number(userCountResult.rows[0]?.user_count || 0);
    const latestUsers = latestUsersResult.rows.map((row: any) => ({
      id: row.id,
      email: typeof row.email === "string" ? maskEmail(row.email) : row.email,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      runtime: getRuntimeDbMeta(),
      database: {
        name: dbInfo.database_name || null,
        user: dbInfo.db_user || null,
        serverTime: dbInfo.server_time || null,
      },
      users: {
        count: userCount,
        latest: latestUsers,
      },
    });
  } catch (error) {
    console.error("Admin DB health check failed:", error);
    return NextResponse.json({ error: "DB health check failed" }, { status: 500 });
  }
}
