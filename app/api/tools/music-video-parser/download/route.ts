import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { getObjectBuffer } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export async function GET(request: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ ok: false, error: "jobId is required" }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    }

    if (job.tool_slug !== TOOL_SLUG) {
      return NextResponse.json({ ok: false, error: "Job does not belong to this tool" }, { status: 403 });
    }

    if (job.status !== "complete") {
      return NextResponse.json({ ok: false, error: "Job is not complete" }, { status: 400 });
    }

    if (!job.output_key) {
      return NextResponse.json({ ok: false, error: "No output available" }, { status: 404 });
    }

    const zipData = await getObjectBuffer(job.output_key);
    const originalFilename = job.meta_json?.original_filename || "video";
    const baseName = originalFilename.replace(/\.[^/.]+$/, "");

    return new Response(new Uint8Array(zipData), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${baseName}-template-pack.zip"`,
        "Content-Length": zipData.length.toString()
      }
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to download" },
      { status: 500 }
    );
  }
}
