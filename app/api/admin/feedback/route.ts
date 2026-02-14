import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    try {
      const result = await query(
        `SELECT id, feedback_type, subject, message, email, priority, author_name, author_bio, created_at
         FROM feedback
         ORDER BY created_at DESC NULLS LAST, id DESC`
      );
      return NextResponse.json({ feedback: result.rows });
    } catch (error) {
      console.warn("Feedback query with created_at failed; falling back:", error);
      const fallback = await query(
        `SELECT id, feedback_type, subject, message, email, priority, author_name, author_bio
         FROM feedback
         ORDER BY id DESC`
      );
      return NextResponse.json({ feedback: fallback.rows });
    }
  } catch (error) {
    console.error("Failed to load feedback:", error);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
