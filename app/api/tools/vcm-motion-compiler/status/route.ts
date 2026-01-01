import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ ok: false, error: "jobId is required" }, { status: 400 });
  }

  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }

  if (job.tool_slug !== TOOL_SLUG) {
    return NextResponse.json({ ok: false, error: "Job belongs to different tool" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    job_id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    output_key: job.output_key,
    meta: job.meta_json
  });
}
