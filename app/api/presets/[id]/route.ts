import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getSubscriptionCapabilitiesForUser } from "@/lib/subscription/capabilities";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.userId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const capabilities = await getSubscriptionCapabilitiesForUser(userId);
    if (!capabilities.canSavePresets) {
      return NextResponse.json(
        {
          error: "Saving presets requires an active global subscription.",
          code: "SUBSCRIPTION_REQUIRED",
          upgrade_url: "/pricing",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, preset_json } = body || {};

    if ((!name || typeof name !== "string") && preset_json === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updates: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name && typeof name === "string" && name.trim()) {
      updates.push(`title = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (preset_json !== undefined) {
      updates.push(`payload_json = $${paramIndex}`);
      values.push(JSON.stringify({ preset_json }));
      paramIndex++;
    }

    values.push(id, userId);

    const result = await query(
      `UPDATE workspace_items
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
         AND user_id = $${paramIndex + 1}
         AND type = 'tool_preset'
       RETURNING id, title, tool_id, origin_cloud_id, payload_json, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.title,
      tool_id: row.tool_id,
      origin_cloud_id: row.origin_cloud_id,
      preset_json: (row.payload_json as Record<string, unknown>)?.preset_json ?? {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error("Error updating preset:", error);
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await query(
      `DELETE FROM workspace_items
       WHERE id = $1 AND user_id = $2 AND type = 'tool_preset'
       RETURNING id`,
      [id, parseInt(session.userId, 10)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting preset:", error);
    return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
  }
}
