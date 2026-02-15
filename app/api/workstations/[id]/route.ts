import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { query, withTransaction } from "@/lib/db";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";

type WidgetInput = {
  toolSlug: string;
  position?: number;
  config?: Record<string, unknown>;
};

async function requireSession() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session;
}

async function getWorkstationForUser(id: string, userId: string) {
  const result = await query(
    `SELECT id, user_id, name, slug, description, visibility, created_at, updated_at, last_opened_at
     FROM workstations
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId],
  );
  return result.rows[0] || null;
}

async function fetchWidgets(workstationId: string) {
  const widgets = await query(
    `SELECT id, tool_slug, position, config_json, created_at, updated_at
     FROM workstation_widgets
     WHERE workstation_id = $1
     ORDER BY position ASC, id ASC`,
    [workstationId],
  );
  return widgets.rows.map((row) => ({
    id: String(row.id),
    toolSlug: row.tool_slug as string,
    position: Number(row.position ?? 0),
    config: (row.config_json as Record<string, unknown>) || {},
  }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const workstation = await getWorkstationForUser(id, session.userId);
    if (!workstation) {
      return NextResponse.json({ error: "Workstation not found" }, { status: 404 });
    }

    await query(
      `UPDATE workstations SET last_opened_at = NOW(), updated_at = updated_at WHERE id = $1`,
      [id],
    );

    const widgets = await fetchWidgets(id);
    return NextResponse.json({ ...workstation, widgets });
  } catch (error) {
    console.error("workstations/[id] GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load workstation";
    if (message.includes('relation "workstations" does not exist')) {
      return NextResponse.json(
        { error: "Workstations database tables are missing. Run migrations and restart the dev server." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to load workstation" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await getWorkstationForUser(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: "Workstation not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let p = 1;

    if (typeof body.name === "string" && body.name.trim()) {
      updates.push(`name = $${p++}`);
      values.push(body.name.trim().slice(0, 120));
    }
    if (typeof body.description === "string") {
      updates.push(`description = $${p++}`);
      values.push(body.description.trim() || null);
    }
    if (typeof body.visibility === "string" && ["private", "unlisted", "public"].includes(body.visibility)) {
      updates.push(`visibility = $${p++}`);
      values.push(body.visibility);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(id, session.userId);
      await query(
        `UPDATE workstations
         SET ${updates.join(", ")}
         WHERE id = $${p++} AND user_id = $${p}
        `,
        values,
      );
    }

    if (Array.isArray(body.widgets)) {
      const widgets = (body.widgets as WidgetInput[])
        .map((w, idx) => ({
          toolSlug: String(w.toolSlug || "").trim(),
          position: Number.isFinite(w.position) ? Number(w.position) : idx,
          config: w.config && typeof w.config === "object" ? w.config : {},
        }))
        .filter((w) => w.toolSlug.length > 0)
        .slice(0, 30);

      await withTransaction(async (tx) => {
        await tx.query(`DELETE FROM workstation_widgets WHERE workstation_id = $1`, [id]);
        for (const widget of widgets) {
          await tx.query(
            `INSERT INTO workstation_widgets (workstation_id, tool_slug, position, config_json, created_at, updated_at)
             VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
            [id, widget.toolSlug, widget.position, JSON.stringify(widget.config)],
          );
        }
      });
    }

    const workstation = await getWorkstationForUser(id, session.userId);
    const widgets = await fetchWidgets(id);
    return NextResponse.json({ ...workstation, widgets });
  } catch (error) {
    console.error("workstations/[id] PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update workstation";
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
    return NextResponse.json({ error: "Failed to update workstation" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const deleted = await query(
      `DELETE FROM workstations WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.userId],
    );

    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: "Workstation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("workstations/[id] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete workstation";
    if (message.includes('relation "workstations" does not exist')) {
      return NextResponse.json(
        { error: "Workstations database tables are missing. Run migrations and restart the dev server." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to delete workstation" }, { status: 500 });
  }
}
