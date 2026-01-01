import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { getClient } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/videoAssembler/constants";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
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

  try {
    const client = getClient();
    const result = await client.downloadAsText(job.output_key);
    
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Failed to download output" }, { status: 500 });
    }

    const videoBuffer = Buffer.from(result.value, "base64");
    const meta = (job.meta_json || {}) as Record<string, any>;
    const sourceJobId = meta.source_job_id || jobId;

    const arrayBuffer = videoBuffer.buffer.slice(
      videoBuffer.byteOffset,
      videoBuffer.byteOffset + videoBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="assembled-${sourceJobId.slice(0, 8)}.mp4"`,
        "Content-Length": videoBuffer.length.toString()
      }
    });

  } catch (err: any) {
    console.error("[video-assembler] Download error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
