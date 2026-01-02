import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/identityAnchor/types";
import { loadManifest } from "@/lib/identityAnchor/manifest";
import { Client } from "@replit/object-storage";

const client = new Client();

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const type = searchParams.get("type") as "concept" | "front" | "profile" | "action" | null;

    if (!jobId) {
      return NextResponse.json({
        ok: false,
        error: "jobId is required"
      }, { status: 400 });
    }

    if (!type || !["concept", "front", "profile", "action"].includes(type)) {
      return NextResponse.json({
        ok: false,
        error: "type must be 'concept', 'front', 'profile', or 'action'"
      }, { status: 400 });
    }

    const manifest = await loadManifest(jobId);
    if (!manifest) {
      return NextResponse.json({
        ok: false,
        error: "Job not found"
      }, { status: 404 });
    }

    let imageKey: string | undefined;
    switch (type) {
      case "concept":
        imageKey = manifest.concept_image_key;
        break;
      case "front":
        imageKey = manifest.anchor_front_key;
        break;
      case "profile":
        imageKey = manifest.anchor_profile_key;
        break;
      case "action":
        imageKey = manifest.anchor_action_key;
        break;
    }

    if (!imageKey) {
      return NextResponse.json({
        ok: false,
        error: `${type} image not found`
      }, { status: 404 });
    }

    const result = await client.downloadAsBytes(imageKey);
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: "Failed to download image"
      }, { status: 500 });
    }

    const imageBuffer = result.value as Uint8Array;
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${type}.png"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[identity-anchor-generator] Download error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
