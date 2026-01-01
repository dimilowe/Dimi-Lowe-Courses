import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { getClient } from "@/lib/objectStorage/client";
import { Manifest, NormalizedManifest, NormalizedShot, RenderStats } from "./types";
import { DEFAULT_FPS, MAX_SHOT_DURATION_SEC, OUTPUT_WIDTH, OUTPUT_HEIGHT, OUTPUT_FPS } from "./constants";

function runCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

export async function downloadPack(packKey: string, workDir: string): Promise<Manifest> {
  const client = getClient();
  
  const manifestResult = await client.downloadAsText(`${packKey}/manifest.json`);
  if (!manifestResult.ok) {
    throw new Error(`Failed to download manifest: ${manifestResult.error}`);
  }
  
  const manifest: Manifest = JSON.parse(manifestResult.value);
  
  const framesDir = path.join(workDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });
  
  for (const shot of manifest.shots) {
    const frameKey = `${packKey}/frames/${shot.shot_id}.jpg`;
    const frameResult = await client.downloadAsText(frameKey);
    
    if (!frameResult.ok) {
      throw new Error(`Failed to download frame ${shot.shot_id}: ${frameResult.error}`);
    }
    
    const frameBuffer = Buffer.from(frameResult.value, "base64");
    const framePath = path.join(framesDir, `${shot.shot_id}.jpg`);
    fs.writeFileSync(framePath, frameBuffer);
  }
  
  return manifest;
}

export function validateManifest(manifest: Manifest, workDir: string): void {
  if (!manifest.shots || manifest.shots.length === 0) {
    throw new Error("Manifest has no shots");
  }
  
  if (!manifest.fps && manifest.fps !== 0) {
    console.log("[assembler] No fps in manifest, using default:", DEFAULT_FPS);
  }
  
  const framesDir = path.join(workDir, "frames");
  for (const shot of manifest.shots) {
    const framePath = path.join(framesDir, `${shot.shot_id}.jpg`);
    if (!fs.existsSync(framePath)) {
      throw new Error(`Frame not found: ${shot.shot_id}.jpg`);
    }
  }
}

export function normalizeManifest(manifest: Manifest): NormalizedManifest {
  const fps = manifest.fps || DEFAULT_FPS;
  let totalFrames = 0;
  let shotsClamped = 0;
  
  const normalizedShots: NormalizedShot[] = manifest.shots.map((shot) => {
    let durationSec = shot.duration_sec;
    let clamped = false;
    
    if (durationSec > MAX_SHOT_DURATION_SEC) {
      durationSec = MAX_SHOT_DURATION_SEC;
      clamped = true;
      shotsClamped++;
    }
    
    const durationFrames = Math.max(1, Math.round(durationSec * fps));
    const normalizedDurationSec = durationFrames / fps;
    totalFrames += durationFrames;
    
    return {
      shot_id: shot.shot_id,
      timestamp_sec: shot.timestamp_sec,
      duration_sec: normalizedDurationSec,
      duration_frames: durationFrames,
      frame: shot.frame,
      clamped
    };
  });
  
  const totalDurationSec = totalFrames / fps;
  
  return {
    name: manifest.name,
    version: manifest.version,
    duration_sec: manifest.duration_sec,
    fps: manifest.fps,
    resolution: manifest.resolution,
    truncated: manifest.truncated,
    shots: normalizedShots,
    normalization: {
      fps,
      max_shot_duration_sec: MAX_SHOT_DURATION_SEC,
      total_frames: totalFrames,
      total_duration_sec: totalDurationSec,
      shots_clamped: shotsClamped
    }
  };
}

export function generateFfconcat(normalizedManifest: NormalizedManifest, workDir: string): string {
  const lines: string[] = ["ffconcat version 1.0"];
  
  for (const shot of normalizedManifest.shots) {
    lines.push(`file frames/${shot.shot_id}.jpg`);
    lines.push(`duration ${shot.duration_sec.toFixed(6)}`);
  }
  
  if (normalizedManifest.shots.length > 0) {
    const lastShot = normalizedManifest.shots[normalizedManifest.shots.length - 1];
    lines.push(`file frames/${lastShot.shot_id}.jpg`);
  }
  
  const concatContent = lines.join("\n");
  const concatPath = path.join(workDir, "frames.ffconcat");
  fs.writeFileSync(concatPath, concatContent);
  
  return concatPath;
}

export async function renderVideo(
  concatPath: string,
  outputPath: string,
  workDir: string
): Promise<{ ffmpegCmd: string }> {
  const args = [
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-vf", `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=decrease,pad=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
    "-r", String(OUTPUT_FPS),
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-y",
    outputPath
  ];
  
  const ffmpegCmd = `ffmpeg ${args.join(" ")}`;
  console.log("[assembler] Running:", ffmpegCmd);
  
  await runCommand("ffmpeg", args);
  
  return { ffmpegCmd };
}

export async function uploadOutput(
  outputPath: string,
  outputKey: string
): Promise<number> {
  const client = getClient();
  const outputBuffer = fs.readFileSync(outputPath);
  
  const outputBase64 = outputBuffer.toString("base64");
  await client.uploadFromText(outputKey, outputBase64);
  
  return outputBuffer.length;
}

export async function runAssembler(
  packKey: string,
  jobId: string,
  sourceJobId: string,
  onProgress: (stage: string, progress: number) => Promise<void>
): Promise<RenderStats> {
  const workDir = `/tmp/video-assembler/${jobId}`;
  const outputDir = `/tmp/video-assembler/${jobId}/output`;
  
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  
  try {
    await onProgress("download", 10);
    console.log("[assembler] Downloading pack from:", packKey);
    const manifest = await downloadPack(packKey, workDir);
    
    await onProgress("download", 25);
    console.log("[assembler] Validating manifest...");
    validateManifest(manifest, workDir);
    
    await onProgress("assemble", 30);
    console.log("[assembler] Normalizing manifest...");
    const normalizedManifest = normalizeManifest(manifest);
    
    const normalizedManifestJson = JSON.stringify(normalizedManifest, null, 2);
    fs.writeFileSync(path.join(workDir, "manifest.normalized.json"), normalizedManifestJson);
    
    const client = getClient();
    await client.uploadFromText(`video-assembler/${jobId}/manifest.normalized.json`, normalizedManifestJson);
    console.log("[assembler] Uploaded normalized manifest");
    
    await onProgress("assemble", 40);
    console.log("[assembler] Generating ffconcat file...");
    const concatPath = generateFfconcat(normalizedManifest, workDir);
    
    await onProgress("assemble", 50);
    const outputPath = path.join(outputDir, "output.mp4");
    console.log("[assembler] Rendering video...");
    const { ffmpegCmd } = await renderVideo(concatPath, outputPath, workDir);
    
    await onProgress("upload", 80);
    console.log("[assembler] Uploading output...");
    const outputKey = `video-assembler/${jobId}/output.mp4`;
    const outputSize = await uploadOutput(outputPath, outputKey);
    console.log(`[assembler] Uploaded ${outputSize} bytes to ${outputKey}`);
    
    await onProgress("cleanup", 95);
    
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (e) {
      console.log("[assembler] Cleanup warning:", e);
    }
    
    return {
      duration_sec: normalizedManifest.normalization.total_duration_sec,
      fps: normalizedManifest.normalization.fps,
      resolution: `${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
      total_frames: normalizedManifest.normalization.total_frames,
      ffmpeg_cmd: ffmpegCmd,
      clamp_applied: normalizedManifest.normalization.shots_clamped,
      source_job_id: sourceJobId
    };
    
  } catch (err) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (e) {}
    throw err;
  }
}
