import { NextRequest, NextResponse } from "next/server";
import { PassThrough } from "stream";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { getClient, getObjectBuffer } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";

export const runtime = "nodejs";

async function streamAssembleToStorage(jobId: string, totalChunks: number): Promise<{ objectKey: string; totalBytes: number }> {
  const objectKey = `music-video-parser/${jobId}/input.mp4`;
  const client = getClient();

  const passThrough = new PassThrough();
  let totalBytes = 0;

  const uploadPromise = client.uploadFromStream(objectKey, passThrough);

  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = `music-video-parser/${jobId}/chunks/part-${String(i).padStart(4, "0")}`;
    console.log(`[finalize] Streaming chunk ${i}/${totalChunks}`);

    const chunkBytes = await getObjectBuffer(chunkKey);
    totalBytes += chunkBytes.length;

    await new Promise<void>((resolve, reject) => {
      const ok = passThrough.write(chunkBytes, (err) => {
        if (err) reject(err);
        else resolve();
      });
      if (ok) resolve();
    });
  }

  passThrough.end();
  await uploadPromise;

  return { objectKey, totalBytes };
}

async function deleteChunks(jobId: string, totalChunks: number): Promise<void> {
  const client = getClient();
  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = `music-video-parser/${jobId}/chunks/part-${String(i).padStart(4, "0")}`;
    try {
      await client.delete(chunkKey);
    } catch (e) {
    }
  }
}

export async function POST(req: NextRequest) {
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

  const meta = (job.meta_json || {}) as Record<string, any>;
  const totalChunks = meta.total_chunks;
  const uploadedChunks: number[] = meta.uploaded_chunks || [];

  if (!totalChunks || uploadedChunks.length !== totalChunks) {
    return NextResponse.json({
      ok: false,
      error: `Not all chunks uploaded: ${uploadedChunks.length}/${totalChunks}`
    }, { status: 400 });
  }

  try {
    console.log(`[finalize] Stream-assembling ${totalChunks} chunks for job ${jobId}`);

    const { objectKey, totalBytes } = await streamAssembleToStorage(jobId, totalChunks);
    console.log(`[finalize] Assembled ${totalBytes} bytes to ${objectKey}`);

    await deleteChunks(jobId, totalChunks);
    console.log(`[finalize] Cleaned up ${totalChunks} chunk objects`);

    await updateJob(jobId, { status: "pending", stage: "probe", progress: 10 });
    await appendMeta(jobId, {
      input_key: objectKey,
      uploaded: true,
      uploaded_bytes: totalBytes,
      finalized: true
    });

    return NextResponse.json({
      ok: true,
      jobId,
      inputKey: objectKey,
      totalBytes
    });
  } catch (err: any) {
    console.error(`[finalize] Error for job ${jobId}:`, err);
    await updateJob(jobId, {
      status: "failed",
      stage: "upload",
      error: String(err?.message || err),
      progress: 0
    });
    return NextResponse.json({ ok: false, error: "Finalization failed" }, { status: 500 });
  }
}
