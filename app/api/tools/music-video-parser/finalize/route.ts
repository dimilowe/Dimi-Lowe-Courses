import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { getClient, downloadToFile } from "@/lib/objectStorage/client";
import { TOOL_SLUG } from "@/lib/musicVideoParser/constants";
import fs from "fs/promises";
import { createWriteStream, createReadStream, statSync } from "fs";
import path from "path";

export const runtime = "nodejs";

async function concatenateChunks(jobId: string, totalChunks: number): Promise<string> {
  const tmpDir = path.join("/tmp", `${jobId}-chunks`);
  await fs.mkdir(tmpDir, { recursive: true });

  const finalPath = `/tmp/${jobId}-input`;
  const writeStream = createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = `music-video-parser/${jobId}/chunks/part-${String(i).padStart(4, "0")}`;
    const chunkPath = path.join(tmpDir, `part-${i}`);

    await downloadToFile(chunkKey, chunkPath);

    await new Promise<void>((resolve, reject) => {
      const readStream = createReadStream(chunkPath);
      readStream.pipe(writeStream, { end: false });
      readStream.on("end", resolve);
      readStream.on("error", reject);
    });

    await fs.unlink(chunkPath).catch(() => {});
  }

  writeStream.end();
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  return finalPath;
}

async function uploadCombinedFile(jobId: string, filePath: string): Promise<string> {
  const objectKey = `music-video-parser/${jobId}/input.mp4`;
  const client = getClient();

  const readStream = createReadStream(filePath);
  await client.uploadFromStream(objectKey, readStream);

  return objectKey;
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
    console.log(`[finalize] Concatenating ${totalChunks} chunks for job ${jobId}`);

    const localPath = await concatenateChunks(jobId, totalChunks);
    const fileSize = statSync(localPath).size;
    console.log(`[finalize] Combined file size: ${fileSize} bytes`);

    const objectKey = await uploadCombinedFile(jobId, localPath);
    console.log(`[finalize] Uploaded combined file to ${objectKey}`);

    await fs.unlink(localPath);

    await deleteChunks(jobId, totalChunks);
    console.log(`[finalize] Cleaned up ${totalChunks} chunks`);

    await updateJob(jobId, { status: "pending", stage: "probe", progress: 10 });
    await appendMeta(jobId, {
      input_key: objectKey,
      uploaded: true,
      uploaded_bytes: fileSize,
      finalized: true
    });

    return NextResponse.json({
      ok: true,
      jobId,
      inputKey: objectKey,
      totalBytes: fileSize
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
