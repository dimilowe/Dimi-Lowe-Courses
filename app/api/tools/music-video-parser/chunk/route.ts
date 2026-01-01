import { NextRequest, NextResponse } from "next/server";
import { Readable, Transform } from "stream";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { uploadFromStream } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export const runtime = "nodejs";

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CHUNK_SIZE = CHUNK_SIZE + 1024;
const MAX_CHUNKS = 50;

function createCountingTransform(maxBytes: number): { transform: Transform; getBytes: () => number; overflow: () => boolean } {
  let bytes = 0;
  let overflowed = false;
  const transform = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        overflowed = true;
      }
      callback(null, chunk);
    }
  });
  return { transform, getBytes: () => bytes, overflow: () => overflowed };
}

export async function PUT(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  const chunkIndexStr = req.nextUrl.searchParams.get("index");
  const totalChunksStr = req.nextUrl.searchParams.get("total");

  if (!jobId || !chunkIndexStr || !totalChunksStr) {
    return NextResponse.json({ ok: false, error: "Missing jobId, index, or total" }, { status: 400 });
  }

  const chunkIndex = parseInt(chunkIndexStr, 10);
  const totalChunks = parseInt(totalChunksStr, 10);

  if (!Number.isFinite(chunkIndex) || chunkIndex < 0 || chunkIndex >= MAX_CHUNKS) {
    return NextResponse.json({ ok: false, error: "Invalid chunk index" }, { status: 400 });
  }
  if (!Number.isFinite(totalChunks) || totalChunks <= 0 || totalChunks > MAX_CHUNKS) {
    return NextResponse.json({ ok: false, error: "Invalid total chunks" }, { status: 400 });
  }
  if (chunkIndex >= totalChunks) {
    return NextResponse.json({ ok: false, error: "Chunk index exceeds total" }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job || job.tool_slug !== TOOL_SLUG) {
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }
  if (job.status === "complete") {
    return NextResponse.json({ ok: false, error: "Job already complete" }, { status: 400 });
  }

  if (!req.body) {
    return NextResponse.json({ ok: false, error: "Missing request body" }, { status: 400 });
  }

  const chunkKey = `music-video-parser/${jobId}/chunks/part-${String(chunkIndex).padStart(4, "0")}`;
  const nodeStream = Readable.fromWeb(req.body as any);
  const { transform, getBytes, overflow } = createCountingTransform(MAX_CHUNK_SIZE);
  const countedStream = nodeStream.pipe(transform);

  try {
    await uploadFromStream(chunkKey, countedStream);

    const bytesReceived = getBytes();

    if (overflow()) {
      console.log(`[chunk] Job ${jobId} chunk ${chunkIndex} rejected: size ${bytesReceived} exceeds max`);
      return NextResponse.json({ ok: false, error: "Chunk too large" }, { status: 400 });
    }

    console.log(`[chunk] Job ${jobId} chunk ${chunkIndex}/${totalChunks} uploaded: ${bytesReceived} bytes`);

    const meta = (job.meta_json || {}) as Record<string, any>;
    const uploadedChunks = meta.uploaded_chunks || [];
    if (!uploadedChunks.includes(chunkIndex)) {
      uploadedChunks.push(chunkIndex);
    }
    uploadedChunks.sort((a: number, b: number) => a - b);

    await appendMeta(jobId, {
      uploaded_chunks: uploadedChunks,
      total_chunks: totalChunks,
      chunked_upload: true
    });

    const progress = Math.round((uploadedChunks.length / totalChunks) * 10);
    await updateJob(jobId, { status: "processing", stage: "upload", progress });

    const allUploaded = uploadedChunks.length === totalChunks;

    return NextResponse.json({
      ok: true,
      jobId,
      chunkIndex,
      bytesReceived,
      allUploaded
    });
  } catch (err: any) {
    console.error(`[chunk] Upload error for job ${jobId} chunk ${chunkIndex}:`, err);
    return NextResponse.json({ ok: false, error: "Chunk upload failed" }, { status: 500 });
  }
}
