import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await request.json();
    
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
    }

    const checkResult = await query(
      `SELECT id, deleted_at FROM tools WHERE slug = $1`,
      [slug]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    if (checkResult.rows[0].deleted_at) {
      return NextResponse.json({ ok: true, message: "Already deleted" });
    }

    await query(
      `UPDATE tools SET deleted_at = NOW(), updated_at = NOW() WHERE slug = $1`,
      [slug]
    );

    await query(
      `UPDATE global_urls SET is_indexed = false WHERE url = $1`,
      [`/tools/${slug}`]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete tool error:", error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
