import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { runNextStage } from "@/lib/musicVideoParser/parser";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export async function POST(request: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await request.json();
    const { jobId } = body;

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

    if (job.status === "complete" || job.status === "failed") {
      return NextResponse.json({
        ok: true,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        error: job.error,
        hasOutput: !!job.output_key
      });
    }

    const updatedJob = await runNextStage(jobId);

    return NextResponse.json({
      ok: true,
      status: updatedJob.status,
      stage: updatedJob.stage,
      progress: updatedJob.progress,
      error: updatedJob.error,
      hasOutput: !!updatedJob.output_key
    });
  } catch (error: any) {
    console.error("Run stage error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to run stage" },
      { status: 500 }
    );
  }
}
