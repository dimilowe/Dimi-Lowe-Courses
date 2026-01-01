import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { uploadFromStream } from "@/lib/objectStorage/client";
import { MAX_SIZE_BYTES, TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export const runtime = "nodejs";

const VALID_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function PUT(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job || job.tool_slug !== TOOL_SLUG) {
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }
  if (job.status === "complete") {
    return NextResponse.json({ ok: false, error: "Job already complete" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!VALID_TYPES.includes(contentType)) {
    return NextResponse.json({ ok: false, error: "Invalid content-type" }, { status: 400 });
  }

  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const sizeBytes = Number(contentLengthHeader);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid content-length" }, { status: 400 });
    }
    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: "File too large" }, { status: 400 });
    }
  }

  if (!req.body) {
    return NextResponse.json({ ok: false, error: "Missing request body" }, { status: 400 });
  }

  const objectKey = `music-video-parser/${jobId}/input.mp4`;
  const nodeStream = Readable.fromWeb(req.body as any);

  await updateJob(jobId, { status: "processing", stage: "upload", progress: 5, error: null });

  try {
    await uploadFromStream(objectKey, nodeStream);

    await updateJob(jobId, { status: "pending", stage: "probe", progress: 10 });
    await appendMeta(jobId, { input_key: objectKey, content_type: contentType, uploaded: true });

    return NextResponse.json({ ok: true, jobId, inputKey: objectKey });
  } catch (err: any) {
    console.error("Upload stream error:", err);
    await updateJob(jobId, {
      status: "failed",
      stage: "upload",
      error: String(err?.message || err),
      progress: 0
    });
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
