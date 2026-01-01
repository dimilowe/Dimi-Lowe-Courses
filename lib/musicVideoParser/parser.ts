import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSZip from "jszip";
import { getJob, updateJob, appendMeta, ToolJob } from "@/lib/toolJobs/toolJobs";
import { getObjectBuffer, putObject, deleteObject } from "@/lib/objectStorage/client";
import { ffprobeMetadata, detectCuts, extractFrame } from "./ffmpeg";
import {
  MAX_DURATION_SEC,
  MIN_SHOT_LEN_SEC,
  OFFSET_MS,
  FRAMES_PER_RUN,
  MAX_SHOTS,
  TOOL_SLUG
} from "./constants";

export interface Shot {
  shot_id: string;
  timestamp_sec: number;
  duration_sec: number;
}

function getJobDir(jobId: string): string {
  return path.join(os.tmpdir(), "mvp-jobs", jobId);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupJobDir(jobId: string): void {
  const jobDir = getJobDir(jobId);
  try {
    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to cleanup job dir ${jobDir}:`, err);
  }
}

async function ensureInputVideo(job: ToolJob): Promise<string> {
  const jobDir = getJobDir(job.id);
  ensureDir(jobDir);
  const inputPath = path.join(jobDir, "input.mp4");
  
  if (!fs.existsSync(inputPath)) {
    const data = await getObjectBuffer(job.input_key!);
    fs.writeFileSync(inputPath, Buffer.from(data));
  }
  
  return inputPath;
}

async function stageProbe(job: ToolJob): Promise<void> {
  const inputPath = await ensureInputVideo(job);

  const probe = await ffprobeMetadata(inputPath);

  if (probe.duration_sec > MAX_DURATION_SEC) {
    throw new Error(`Video too long: ${probe.duration_sec}s exceeds ${MAX_DURATION_SEC}s limit`);
  }

  await appendMeta(job.id, { probe });
  await updateJob(job.id, { stage: "cuts", progress: 15 });
}

async function stageCuts(job: ToolJob): Promise<void> {
  const inputPath = await ensureInputVideo(job);

  const rawCuts = await detectCuts(inputPath);
  const probe = job.meta_json?.probe;
  const duration = probe?.duration_sec || 0;

  let cuts = [0, ...rawCuts];
  cuts = [...new Set(cuts)].sort((a, b) => a - b);

  const normalizedCuts: number[] = [0];
  for (let i = 1; i < cuts.length; i++) {
    const gap = cuts[i] - normalizedCuts[normalizedCuts.length - 1];
    if (gap >= MIN_SHOT_LEN_SEC) {
      normalizedCuts.push(cuts[i]);
    }
  }

  let shots: Shot[] = [];
  for (let i = 0; i < normalizedCuts.length; i++) {
    const start = normalizedCuts[i];
    const end = i < normalizedCuts.length - 1 ? normalizedCuts[i + 1] : duration;
    shots.push({
      shot_id: `b${String(i + 1).padStart(3, "0")}`,
      timestamp_sec: start,
      duration_sec: end - start
    });
  }

  let truncated = false;
  if (shots.length > MAX_SHOTS) {
    shots = shots.slice(0, MAX_SHOTS);
    truncated = true;
    if (shots.length > 0) {
      const lastShot = shots[shots.length - 1];
      lastShot.duration_sec = duration - lastShot.timestamp_sec;
    }
  }

  await appendMeta(job.id, {
    cuts: normalizedCuts.slice(0, shots.length),
    shots,
    frames_done_count: 0,
    truncated,
    max_shots: truncated ? MAX_SHOTS : undefined
  });
  await updateJob(job.id, { stage: "frames", progress: 40 });
}

async function stageFrames(job: ToolJob): Promise<void> {
  const inputPath = await ensureInputVideo(job);
  const jobDir = getJobDir(job.id);
  const framesDir = path.join(jobDir, "frames");
  ensureDir(framesDir);

  const shots: Shot[] = job.meta_json?.shots || [];
  const probe = job.meta_json?.probe;
  const duration = probe?.duration_sec || 0;
  const framesDoneCount = job.meta_json?.frames_done_count || 0;

  const remaining = shots.slice(framesDoneCount);
  const batch = remaining.slice(0, FRAMES_PER_RUN);

  for (let i = 0; i < batch.length; i++) {
    const shot = batch[i];
    const tSec = Math.min(shot.timestamp_sec + OFFSET_MS / 1000, duration - 0.1);
    const outPath = path.join(framesDir, `${shot.shot_id}.jpg`);
    await extractFrame(inputPath, tSec, outPath);
    
    const frameBuffer = fs.readFileSync(outPath);
    const frameKey = `music-video-parser/${job.id}/frames/${shot.shot_id}.jpg`;
    await putObject(frameKey, frameBuffer, "image/jpeg");
  }

  const newDoneCount = framesDoneCount + batch.length;
  await appendMeta(job.id, { frames_done_count: newDoneCount });

  if (newDoneCount >= shots.length) {
    await updateJob(job.id, { stage: "pack", progress: 70 });
  } else {
    const progress = 40 + Math.floor((newDoneCount / shots.length) * 30);
    await updateJob(job.id, { progress });
  }
}

async function stagePack(job: ToolJob): Promise<void> {
  const shots: Shot[] = job.meta_json?.shots || [];
  const probe = job.meta_json?.probe || {};
  const originalFilename = job.meta_json?.original_filename || "unknown.mp4";

  const templateData = {
    template_id: `mv_${job.id}`,
    created_at: new Date().toISOString(),
    source: {
      type: "upload",
      original_filename: originalFilename
    },
    video: {
      duration_sec: probe.duration_sec,
      fps: probe.fps,
      width: probe.width,
      height: probe.height
    },
    settings: {
      scene_threshold: 0.35,
      min_shot_len_sec: MIN_SHOT_LEN_SEC,
      offset_ms: OFFSET_MS
    },
    shots: shots.map((s) => ({
      shot_id: s.shot_id,
      timestamp_sec: s.timestamp_sec,
      duration_sec: s.duration_sec,
      assets: {
        keyframe: `frames/${s.shot_id}.jpg`
      }
    }))
  };

  const templateJson = JSON.stringify(templateData, null, 2);

  let csvContent = "shot_id,timestamp_sec,duration_sec,frame\n";
  for (const s of shots) {
    csvContent += `${s.shot_id},${s.timestamp_sec.toFixed(3)},${s.duration_sec.toFixed(3)},frames/${s.shot_id}.jpg\n`;
  }

  const zip = new JSZip();
  zip.file("template.json", templateJson);
  zip.file("cuts.csv", csvContent);

  for (const shot of shots) {
    const frameKey = `music-video-parser/${job.id}/frames/${shot.shot_id}.jpg`;
    try {
      const frameData = await getObjectBuffer(frameKey);
      zip.file(`frames/${shot.shot_id}.jpg`, frameData);
    } catch (err) {
      console.error(`Failed to fetch frame ${shot.shot_id}:`, err);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const outputKey = `music-video-parser/${job.id}/template-pack.zip`;

  await putObject(outputKey, zipBuffer, "application/zip");
  await updateJob(job.id, { output_key: outputKey, stage: "cleanup", progress: 90 });
}

async function stageCleanup(job: ToolJob): Promise<void> {
  if (job.input_key) {
    await deleteObject(job.input_key);
  }

  const shots: Shot[] = job.meta_json?.shots || [];
  for (const shot of shots) {
    const frameKey = `music-video-parser/${job.id}/frames/${shot.shot_id}.jpg`;
    await deleteObject(frameKey).catch(() => {});
  }

  cleanupJobDir(job.id);

  await updateJob(job.id, { status: "complete", progress: 100 });
}

export async function runNextStage(jobId: string): Promise<ToolJob> {
  const job = await getJob(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.tool_slug !== TOOL_SLUG) {
    throw new Error("Job does not belong to this tool");
  }

  if (job.status === "complete" || job.status === "failed") {
    return job;
  }

  try {
    await updateJob(jobId, { status: "processing" });

    switch (job.stage) {
      case "upload":
        await updateJob(jobId, { stage: "probe", progress: 5 });
        break;
      case "probe":
        await stageProbe(job);
        break;
      case "cuts":
        await stageCuts(job);
        break;
      case "frames":
        await stageFrames(job);
        break;
      case "pack":
        await stagePack(job);
        break;
      case "cleanup":
        await stageCleanup(job);
        break;
    }

    return (await getJob(jobId))!;
  } catch (err: any) {
    console.error(`Job ${jobId} failed at stage ${job.stage}:`, err);

    if (job.input_key) {
      await deleteObject(job.input_key).catch(() => {});
    }
    cleanupJobDir(jobId);

    await updateJob(jobId, {
      status: "failed",
      error: err.message || "Unknown error"
    });

    return (await getJob(jobId))!;
  }
}
