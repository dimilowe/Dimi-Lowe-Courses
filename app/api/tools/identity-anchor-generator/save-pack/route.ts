import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG, MAX_CONCEPT_ATTEMPTS, MAX_ANCHOR_ATTEMPTS } from "@/lib/identityAnchor/types";
import { loadManifest } from "@/lib/identityAnchor/manifest";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { userSessionOptions, UserSessionData } from "@/lib/user-session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { job_id, name } = body;

    if (!job_id) {
      return NextResponse.json({
        ok: false,
        error: "job_id is required"
      }, { status: 400 });
    }

    const manifest = await loadManifest(job_id);
    if (!manifest) {
      return NextResponse.json({
        ok: false,
        error: "Job not found"
      }, { status: 404 });
    }

    if (!manifest.anchor_front_key || !manifest.anchor_profile_key || !manifest.anchor_action_key) {
      return NextResponse.json({
        ok: false,
        error: "All anchor images must be generated before saving pack"
      }, { status: 400 });
    }

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.userId ? parseInt(session.userId, 10) : null;

    const result = await query(
      `INSERT INTO character_packs (
        owner_user_id,
        name,
        locked_identity_text,
        style_preset,
        scene_description,
        concept_image_key,
        anchor_front_key,
        anchor_profile_key,
        anchor_action_key,
        concept_attempts,
        anchor_attempts,
        max_concept_attempts,
        max_anchor_attempts,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'saved')
      RETURNING id`,
      [
        userId,
        name || null,
        manifest.identity_spec.character_description,
        manifest.identity_spec.style_preset,
        manifest.identity_spec.scene_description || null,
        manifest.concept_image_key || null,
        manifest.anchor_front_key,
        manifest.anchor_profile_key,
        manifest.anchor_action_key,
        manifest.concept_attempts,
        manifest.anchor_attempts,
        MAX_CONCEPT_ATTEMPTS,
        MAX_ANCHOR_ATTEMPTS,
      ]
    );

    const packId = result.rows[0].id;

    return NextResponse.json({
      ok: true,
      character_pack_id: packId,
      message: "Character pack saved successfully"
    });
  } catch (err: any) {
    console.error("[identity-anchor-generator] Save pack error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
