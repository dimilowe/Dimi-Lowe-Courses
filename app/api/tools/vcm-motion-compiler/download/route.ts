import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { getClient } from "@/lib/objectStorage/client";
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

  if (job.status !== "complete") {
    return NextResponse.json({ ok: false, error: "Job is not complete" }, { status: 400 });
  }

  if (!job.output_key) {
    return NextResponse.json({ ok: false, error: "No output available" }, { status: 404 });
  }

  try {
    const client = getClient();
    const result = await client.downloadAsBytes(job.output_key);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Failed to download output" }, { status: 500 });
    }

    return new NextResponse(Buffer.from(result.value), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="motion-${jobId}.mp4"`,
        "Cache-Control": "private, max-age=3600"
      }
    });

  } catch (err: any) {
    console.error(`[${TOOL_SLUG}] Download error:`, err);
    return NextResponse.json({ 
      ok: false, 
      error: String(err?.message || err) 
    }, { status: 500 });
  }
}
