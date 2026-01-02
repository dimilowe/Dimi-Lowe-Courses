import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/identityAnchor/types";
import { loadManifest } from "@/lib/identityAnchor/manifest";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({
        ok: false,
        error: "jobId is required"
      }, { status: 400 });
    }

    const manifest = await loadManifest(jobId);
    if (!manifest) {
      return NextResponse.json({
        ok: false,
        error: "Job not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      status: manifest.status,
      mode: manifest.mode,
      concept_image_key: manifest.concept_image_key,
      anchor_front_key: manifest.anchor_front_key,
      anchor_profile_key: manifest.anchor_profile_key,
      anchor_action_key: manifest.anchor_action_key,
      concept_attempts: manifest.concept_attempts,
      anchor_attempts: manifest.anchor_attempts,
      error: manifest.error
    });
  } catch (err: any) {
    console.error("[identity-anchor-generator] Status error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
