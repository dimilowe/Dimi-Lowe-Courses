import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { loadManifest, loadLog } from "@/lib/motionCompiler/manifest";
import { canFinalize } from "@/lib/motionCompiler/stitch";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const includeLogs = searchParams.get("logs") === "true";

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

    const finalizeCheck = await canFinalize(jobId);

    const response: Record<string, any> = {
      ok: true,
      job_id: jobId,
      status: manifest.status,
      current_beat_index: manifest.current_beat_index,
      total_beats: manifest.beats.length,
      can_finalize: finalizeCheck.canFinalize,
      finalize_reason: finalizeCheck.reason,
      beats: manifest.beats.map(b => ({
        id: b.id,
        index: b.index,
        status: b.status,
        duration_target: b.duration_target,
        attempts: b.attempts,
        max_attempts: b.max_attempts,
        has_clip: !!b.clip_path,
        has_boundary_start: !!b.boundary_start?.state,
        has_boundary_end: !!b.boundary_end?.state,
        error: b.error
      })),
      final_output: manifest.final_output,
      error: manifest.error
    };

    if (includeLogs) {
      const log = await loadLog(jobId);
      response.logs = log?.entries || [];
    }

    return NextResponse.json(response);

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Status error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
