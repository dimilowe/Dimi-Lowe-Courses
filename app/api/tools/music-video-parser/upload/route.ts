import { NextRequest, NextResponse } from "next/server";
import { Readable, Transform } from "stream";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { uploadFromStream } from "@/lib/objectStorage/client";
import { MAX_SIZE_BYTES, TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export const runtime = "nodejs";

const VALID_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface StreamInfo {
  bytes: number;
  firstHex: string | null;
  event: string;
  err?: string;
}

function createCountingTransform(label: string): { transform: Transform; getInfo: () => StreamInfo } {
  let bytes = 0;
  let first: Buffer | null = null;
  let finalInfo: StreamInfo = { bytes: 0, firstHex: null, event: "pending" };

  const transform = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      bytes += chunk.length;
      if (!first && chunk.length > 0) {
        first = Buffer.from(chunk.slice(0, 16));
      }
      callback(null, chunk);
    },
    flush(callback) {
      finalInfo = { bytes, firstHex: first?.toString("hex") || null, event: "end" };
      console.log(`[${label}] transform flush:`, finalInfo);
      callback();
    }
  });

  transform.on("error", (e) => {
    finalInfo = { bytes, firstHex: first?.toString("hex") || null, event: "error", err: String(e) };
    console.log(`[${label}] transform error:`, finalInfo);
  });

  return {
    transform,
    getInfo: () => ({ bytes, firstHex: first?.toString("hex") || null, event: finalInfo.event })
  };
}

export async function PUT(req: NextRequest) {
  const contentLength = req.headers.get("content-length");
  const contentType = req.headers.get("content-type") || "";
  const transferEncoding = req.headers.get("transfer-encoding");

  console.log("[upload] Request headers:", {
    contentLength,
    contentType,
    transferEncoding,
    url: req.url
  });

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

  if (!VALID_TYPES.includes(contentType)) {
    return NextResponse.json({ ok: false, error: "Invalid content-type" }, { status: 400 });
  }

  if (contentLength) {
    const sizeBytes = Number(contentLength);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid content-length" }, { status: 400 });
    }
    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: "File too large" }, { status: 400 });
    }
  }

  if (!req.body) {
    console.log("[upload] req.body is null/undefined");
    return NextResponse.json({ ok: false, error: "Missing request body" }, { status: 400 });
  }

  const objectKey = `music-video-parser/${jobId}/input.mp4`;
  const nodeStream = Readable.fromWeb(req.body as any);
  const { transform: countingTransform, getInfo } = createCountingTransform(`upload-${jobId}`);
  const tapped = nodeStream.pipe(countingTransform);

  await updateJob(jobId, { status: "processing", stage: "upload", progress: 5, error: null });

  try {
    await uploadFromStream(objectKey, tapped);

    const streamInfo = getInfo();
    console.log("[upload] Upload complete. Stream info:", streamInfo);

    await updateJob(jobId, { status: "pending", stage: "probe", progress: 10 });
    await appendMeta(jobId, {
      input_key: objectKey,
      content_type: contentType,
      uploaded: true,
      uploaded_bytes: streamInfo.bytes,
      first_hex: streamInfo.firstHex
    });

    return NextResponse.json({
      ok: true,
      jobId,
      inputKey: objectKey,
      bytesReceived: streamInfo.bytes
    });
  } catch (err: any) {
    const streamInfo = getInfo();
    console.error("[upload] Upload stream error:", err, "Stream info:", streamInfo);
    await updateJob(jobId, {
      status: "failed",
      stage: "upload",
      error: String(err?.message || err),
      progress: 0
    });
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
