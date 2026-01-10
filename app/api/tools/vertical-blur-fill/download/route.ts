import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob } from "@/lib/toolJobs/toolJobs";
import { TOOL_SLUG } from "@/lib/verticalBlurFill/constants";
import { Client } from "@replit/object-storage";

const storageClient = new Client();

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

  if (job.status !== "complete" || !job.output_key) {
    return NextResponse.json({ ok: false, error: "Job output not ready" }, { status: 400 });
  }

  try {
    const result = await storageClient.downloadAsBytes(job.output_key);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Failed to download output" }, { status: 500 });
    }

    const videoBuffer = new Uint8Array(Buffer.from(result.value as any));
    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="vertical-blur-fill-${jobId.slice(0, 8)}.mp4"`,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (err: any) {
    console.error("[vertical-blur-fill] Download error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
