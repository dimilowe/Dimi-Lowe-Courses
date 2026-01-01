import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { getClient } from "@/lib/objectStorage/client";
import { Manifest, NormalizedManifest, NormalizedShot, RenderStats, AssetMode } from "./types";
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

function resolveAssetMode(manifest: Manifest, requestedMode?: AssetMode): AssetMode {
  if (requestedMode) return requestedMode;
  if (manifest.preferred_asset) return manifest.preferred_asset;
  return "frame";
}

function getAssetPath(shot: Manifest["shots"][0], mode: AssetMode): { key: string; ext: string } | null {
  if (shot.assets) {
    if (mode === "clip" && shot.assets.clip) {
      return { key: shot.assets.clip, ext: "mp4" };
    }
    if (mode === "frame" && shot.assets.frame) {
      return { key: shot.assets.frame, ext: "jpg" };
    }
    if (shot.assets.frame) {
      return { key: shot.assets.frame, ext: "jpg" };
    }
    if (shot.assets.clip) {
      return { key: shot.assets.clip, ext: "mp4" };
    }
  }
  if (shot.frame) {
    return { key: shot.frame, ext: "jpg" };
  }
  if (shot.asset) {
    return { key: shot.asset, ext: "jpg" };
  }
  return null;
}

export async function downloadPack(packKey: string, workDir: string, assetMode: AssetMode): Promise<Manifest> {
  const client = getClient();
  
  const manifestResult = await client.downloadAsText(`${packKey}/manifest.json`);
  if (!manifestResult.ok) {
    throw new Error(`Failed to download manifest: ${manifestResult.error}`);
  }
  
  const manifest: Manifest = JSON.parse(manifestResult.value);
  const effectiveMode = resolveAssetMode(manifest, assetMode);
  
  const framesDir = path.join(workDir, "frames");
  const clipsDir = path.join(workDir, "clips");
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(clipsDir, { recursive: true });
  
  for (const shot of manifest.shots) {
    const assetInfo = getAssetPath(shot, effectiveMode);
    if (!assetInfo) {
      throw new Error(`No asset found for shot ${shot.shot_id}`);
    }
    
    const assetKey = `${packKey}/${assetInfo.key}`;
    const assetResult = await client.downloadAsText(assetKey);
    
    if (!assetResult.ok) {
      throw new Error(`Failed to download asset ${shot.shot_id}: ${assetResult.error}`);
    }
    
    const assetBuffer = Buffer.from(assetResult.value, "base64");
    const targetDir = assetInfo.ext === "mp4" ? clipsDir : framesDir;
    const assetPath = path.join(targetDir, `${shot.shot_id}.${assetInfo.ext}`);
    fs.writeFileSync(assetPath, assetBuffer);
  }
  
  return manifest;
}

export function validateManifest(manifest: Manifest, workDir: string, assetMode: AssetMode): void {
  if (!manifest.shots || manifest.shots.length === 0) {
    throw new Error("Manifest has no shots");
  }
  
  if (!manifest.fps && manifest.fps !== 0) {
    console.log("[assembler] No fps in manifest, using default:", DEFAULT_FPS);
  }
  
  const effectiveMode = resolveAssetMode(manifest, assetMode);
  const framesDir = path.join(workDir, "frames");
  const clipsDir = path.join(workDir, "clips");
  
  for (const shot of manifest.shots) {
    const assetInfo = getAssetPath(shot, effectiveMode);
    if (!assetInfo) {
      throw new Error(`No asset path found for shot ${shot.shot_id}`);
    }
    
    const targetDir = assetInfo.ext === "mp4" ? clipsDir : framesDir;
    const assetPath = path.join(targetDir, `${shot.shot_id}.${assetInfo.ext}`);
    if (!fs.existsSync(assetPath)) {
      throw new Error(`Asset not found: ${shot.shot_id}.${assetInfo.ext}`);
    }
  }
}

export function normalizeManifest(manifest: Manifest, assetMode: AssetMode): NormalizedManifest {
  const fps = manifest.fps || DEFAULT_FPS;
  const effectiveMode = resolveAssetMode(manifest, assetMode);
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
    
    const assetInfo = getAssetPath(shot, effectiveMode);
    
    return {
      shot_id: shot.shot_id,
      timestamp_sec: shot.timestamp_sec,
      duration_sec: normalizedDurationSec,
      duration_frames: durationFrames,
      assets: shot.assets,
      frame: shot.frame || shot.asset,
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
    extraction_mode: manifest.extraction_mode,
    preferred_asset: manifest.preferred_asset,
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

export function generateFfconcat(normalizedManifest: NormalizedManifest, workDir: string, assetMode: AssetMode): string {
  const effectiveMode = resolveAssetMode(normalizedManifest, assetMode);
  const lines: string[] = ["ffconcat version 1.0"];
  
  if (effectiveMode === "clip") {
    for (const shot of normalizedManifest.shots) {
      lines.push(`file clips/${shot.shot_id}.mp4`);
    }
  } else {
    for (const shot of normalizedManifest.shots) {
      lines.push(`file frames/${shot.shot_id}.jpg`);
      lines.push(`duration ${shot.duration_sec.toFixed(6)}`);
    }
    
    if (normalizedManifest.shots.length > 0) {
      const lastShot = normalizedManifest.shots[normalizedManifest.shots.length - 1];
      lines.push(`file frames/${lastShot.shot_id}.jpg`);
    }
  }
  
  const concatContent = lines.join("\n");
  const concatPath = path.join(workDir, effectiveMode === "clip" ? "clips.ffconcat" : "frames.ffconcat");
  fs.writeFileSync(concatPath, concatContent);
  
  return concatPath;
}

export async function renderVideo(
  concatPath: string,
  outputPath: string,
  workDir: string,
  assetMode: AssetMode
): Promise<{ ffmpegCmd: string }> {
  const args: string[] = [];
  
  if (assetMode === "clip") {
    args.push(
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
    );
  } else {
    args.push(
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
    );
  }
  
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
  onProgress: (stage: string, progress: number) => Promise<void>,
  assetMode?: AssetMode
): Promise<RenderStats> {
  const workDir = `/tmp/video-assembler/${jobId}`;
  const outputDir = `/tmp/video-assembler/${jobId}/output`;
  
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  
  try {
    await onProgress("download", 10);
    console.log("[assembler] Downloading pack from:", packKey, "requested mode:", assetMode || "auto");
    
    const client = getClient();
    const manifestResult = await client.downloadAsText(`${packKey}/manifest.json`);
    if (!manifestResult.ok) {
      throw new Error(`Failed to download manifest: ${manifestResult.error}`);
    }
    const manifest: Manifest = JSON.parse(manifestResult.value);
    
    const resolvedMode = resolveAssetMode(manifest, assetMode);
    console.log("[assembler] Resolved asset mode:", resolvedMode);
    
    const framesDir = path.join(workDir, "frames");
    const clipsDir = path.join(workDir, "clips");
    fs.mkdirSync(framesDir, { recursive: true });
    fs.mkdirSync(clipsDir, { recursive: true });
    
    for (const shot of manifest.shots) {
      const assetInfo = getAssetPath(shot, resolvedMode);
      if (!assetInfo) {
        throw new Error(`No asset found for shot ${shot.shot_id}`);
      }
      
      const assetKey = `${packKey}/${assetInfo.key}`;
      const assetResult = await client.downloadAsText(assetKey);
      
      if (!assetResult.ok) {
        throw new Error(`Failed to download asset ${shot.shot_id}: ${assetResult.error}`);
      }
      
      const assetBuffer = Buffer.from(assetResult.value, "base64");
      const targetDir = assetInfo.ext === "mp4" ? clipsDir : framesDir;
      const assetPath = path.join(targetDir, `${shot.shot_id}.${assetInfo.ext}`);
      fs.writeFileSync(assetPath, assetBuffer);
    }
    
    await onProgress("download", 25);
    console.log("[assembler] Validating manifest...");
    validateManifest(manifest, workDir, resolvedMode);
    
    await onProgress("assemble", 30);
    console.log("[assembler] Normalizing manifest...");
    const normalizedManifest = normalizeManifest(manifest, resolvedMode);
    
    const normalizedManifestJson = JSON.stringify(normalizedManifest, null, 2);
    fs.writeFileSync(path.join(workDir, "manifest.normalized.json"), normalizedManifestJson);
    
    const client = getClient();
    await client.uploadFromText(`video-assembler/${jobId}/manifest.normalized.json`, normalizedManifestJson);
    console.log("[assembler] Uploaded normalized manifest");
    
    await onProgress("assemble", 40);
    console.log("[assembler] Generating ffconcat file...");
    const concatPath = generateFfconcat(normalizedManifest, workDir, resolvedMode);
    
    await onProgress("assemble", 50);
    const outputPath = path.join(outputDir, "output.mp4");
    console.log("[assembler] Rendering video...");
    const { ffmpegCmd } = await renderVideo(concatPath, outputPath, workDir, resolvedMode);
    
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
      source_job_id: sourceJobId,
      asset_mode: resolvedMode
    };
    
  } catch (err) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (e) {}
    throw err;
  }
}
