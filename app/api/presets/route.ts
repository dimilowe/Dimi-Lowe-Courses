import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getSubscriptionCapabilitiesForUser } from "@/lib/subscription/capabilities";
import { normalizeCloudId } from "@/lib/cloud/normalizeCloudId";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get("tool_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const conditions: string[] = ["user_id = $1", "type = 'tool_preset'"];
    const params: (string | number)[] = [parseInt(session.userId, 10)];
    let paramIndex = 2;

    if (toolId && toolId.trim()) {
      conditions.push(`tool_id = $${paramIndex}`);
      params.push(toolId.trim());
      paramIndex++;
    }

    const sql = `
      SELECT id, title, tool_id, origin_cloud_id, payload_json, created_at, updated_at
      FROM workspace_items
      WHERE ${conditions.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    return NextResponse.json({
      presets: result.rows.map((row) => ({
        id: row.id,
        name: row.title,
        tool_id: row.tool_id,
        origin_cloud_id: row.origin_cloud_id,
        preset_json: row.payload_json?.preset_json ?? row.payload_json ?? {},
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching presets:", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { tool_id, name, preset_json, origin_cloud_id } = body || {};

    if (!tool_id || typeof tool_id !== "string" || !tool_id.trim()) {
      return NextResponse.json({ error: "tool_id is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const normalizedOrigin = origin_cloud_id && typeof origin_cloud_id === "string"
      ? (normalizeCloudId(origin_cloud_id) || origin_cloud_id)
      : null;

    const result = await query(
      `INSERT INTO workspace_items
        (user_id, title, type, tool_id, origin_cloud_id, payload_json)
       VALUES ($1, $2, 'tool_preset', $3, $4, $5)
       RETURNING id, title, tool_id, origin_cloud_id, payload_json, created_at, updated_at`,
      [userId, name.trim(), tool_id.trim(), normalizedOrigin, JSON.stringify({ preset_json: preset_json || {} })]
    );

    const row = result.rows[0];
    return NextResponse.json(
      {
        id: row.id,
        name: row.title,
        tool_id: row.tool_id,
        origin_cloud_id: row.origin_cloud_id,
        preset_json: row.payload_json?.preset_json ?? {},
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating preset:", error);
    return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
  }
}
