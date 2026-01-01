import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
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

    return NextResponse.json({
      ok: true,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      error: job.error,
      hasOutput: !!job.output_key,
      shots: job.meta_json?.shots || null
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
