import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { loadManifest } from "@/lib/motionCompiler/manifest";
import { generateRenderPacket, formatPacketForDisplay } from "@/lib/motionCompiler/packet";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const beatIndexStr = searchParams.get("beatIndex");

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

    const beatIndex = beatIndexStr !== null 
      ? parseInt(beatIndexStr, 10) 
      : manifest.current_beat_index;

    if (beatIndex < 0 || beatIndex >= manifest.beats.length) {
      return NextResponse.json({
        ok: false,
        error: `Invalid beat index: ${beatIndex}. Valid range: 0-${manifest.beats.length - 1}`
      }, { status: 400 });
    }

    const packet = await generateRenderPacket(jobId, beatIndex);

    if (!packet) {
      return NextResponse.json({
        ok: false,
        error: "Failed to generate render packet"
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      beat_index: beatIndex,
      beat_status: manifest.beats[beatIndex].status,
      packet,
      packet_json: formatPacketForDisplay(packet)
    });

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Packet error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
