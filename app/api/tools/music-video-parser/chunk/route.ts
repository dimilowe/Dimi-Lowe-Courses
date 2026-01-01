import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { getClient } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export const runtime = "nodejs";

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CHUNK_SIZE = CHUNK_SIZE + 1024;
const MAX_CHUNKS = 50;

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

  try {
    const arrayBuffer = await req.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    if (buf.length > MAX_CHUNK_SIZE) {
      console.log(`[chunk] Job ${jobId} chunk ${chunkIndex} rejected: size ${buf.length} exceeds max`);
      return NextResponse.json({ ok: false, error: "Chunk too large" }, { status: 400 });
    }

    const chunkKey = `music-video-parser/${jobId}/chunks/part-${String(chunkIndex).padStart(4, "0")}`;
    const client = getClient();

    console.log(`[chunk] Pre-upload: len=${buf.length}, hex16=${buf.subarray(0, 16).toString("hex")}`);

    const base64Data = buf.toString("base64");
    await client.uploadFromText(chunkKey, base64Data);

    const verifyResult = await client.downloadAsText(chunkKey);
    if (verifyResult.ok) {
      const downloadedBase64 = verifyResult.value;
      const decodedBuf = Buffer.from(downloadedBase64, "base64");
      console.log(`[chunk] Job ${jobId} chunk ${chunkIndex}/${totalChunks} uploaded: ${buf.length} bytes, verified: ${decodedBuf.length} bytes, hex16=${decodedBuf.subarray(0, 16).toString("hex")}`);
    } else {
      console.log(`[chunk] Job ${jobId} chunk ${chunkIndex}/${totalChunks} uploaded: ${buf.length} bytes, verify failed`);
    }

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
      bytesReceived: buf.length,
      allUploaded
    });
  } catch (err: any) {
    console.error(`[chunk] Upload error for job ${jobId} chunk ${chunkIndex}:`, err);
    return NextResponse.json({ ok: false, error: "Chunk upload failed" }, { status: 500 });
  }
}
