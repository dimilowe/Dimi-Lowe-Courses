import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";

type WorkstationRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: "private" | "unlisted" | "public";
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

async function requireSession() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await query(
      `SELECT id, user_id, name, slug, description, visibility, created_at, updated_at, last_opened_at
       FROM workstations
       WHERE user_id = $1
       ORDER BY COALESCE(last_opened_at, updated_at) DESC, id DESC`,
      [session.userId],
    );

    return NextResponse.json({ workstations: rows.rows as WorkstationRow[] });
  } catch (error) {
    console.error("workstations GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load workstations";
    if (message.includes('relation "workstations" does not exist')) {
      return NextResponse.json(
        { error: "Workstations database tables are missing. Run migrations and restart the dev server." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to load workstations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const nameRaw = String(body?.name || "").trim();
    if (!nameRaw) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const description = String(body?.description || "").trim() || null;
    const visibilityInput = String(body?.visibility || "private");
    const visibility = (["private", "unlisted", "public"].includes(visibilityInput)
      ? visibilityInput
      : "private") as "private" | "unlisted" | "public";

    const base = slugify(nameRaw) || "workstation";
    let finalSlug = base;
    let suffix = 2;

    // Ensure user-local slug uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await query(
        `SELECT 1 FROM workstations WHERE user_id = $1 AND slug = $2 LIMIT 1`,
        [userId, finalSlug],
      );
      if (exists.rows.length === 0) break;
      finalSlug = `${base}-${suffix++}`;
    }

    const inserted = await query(
      `INSERT INTO workstations (user_id, name, slug, description, visibility, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, user_id, name, slug, description, visibility, created_at, updated_at, last_opened_at`,
      [userId, nameRaw, finalSlug, description, visibility],
    );

    return NextResponse.json(inserted.rows[0] as WorkstationRow, { status: 201 });
  } catch (error) {
    console.error("workstations POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create workstation";
    if (message.includes('relation "workstations" does not exist')) {
      return NextResponse.json(
        { error: "Workstations database tables are missing. Run migrations and restart the dev server." },
        { status: 500 },
      );
    }
    if (message.includes("violates foreign key constraint")) {
      return NextResponse.json(
        { error: "Your account session is out of sync with users. Sign out and sign back in, then retry." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to create workstation" }, { status: 500 });
  }
}
