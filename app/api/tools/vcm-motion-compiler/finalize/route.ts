import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { loadManifest, appendLog } from "@/lib/motionCompiler/manifest";
import { canFinalize, stitchBeats } from "@/lib/motionCompiler/stitch";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { jobId } = body;

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

    const { canFinalize: ready, reason } = await canFinalize(jobId);
    if (!ready) {
      return NextResponse.json({
        ok: false,
        error: `Cannot finalize: ${reason}`
      }, { status: 400 });
    }

    await appendLog(jobId, "info", "finalize", "Starting final render", {
      total_beats: manifest.beats.length
    });

    const result = await stitchBeats(jobId);

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: `Stitch failed: ${result.error}`
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      output_path: result.output_path,
      duration: result.duration,
      message: "Final video rendered successfully"
    });

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Finalize error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
