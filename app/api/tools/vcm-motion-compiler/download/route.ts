import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { loadManifest } from "@/lib/motionCompiler/manifest";
import { downloadFinalVideo } from "@/lib/motionCompiler/stitch";

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

    if (!manifest.final_output?.path) {
      return NextResponse.json({
        ok: false,
        error: "Final video not yet rendered. Call /finalize first."
      }, { status: 400 });
    }

    const videoBuffer = await downloadFinalVideo(jobId);
    if (!videoBuffer) {
      return NextResponse.json({
        ok: false,
        error: "Failed to download final video"
      }, { status: 500 });
    }

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="motion-compile-${jobId}.mp4"`,
        "Content-Length": videoBuffer.length.toString()
      }
    });

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Download error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
