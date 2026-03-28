import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { getReplitStorageClient } from "@/lib/objectStorage/replitClient";
import { BlurFillConfig, VideoMeta, ProcessResult } from "./types";
import { STORAGE_PREFIX, TMP_BASE, DEFAULT_CONFIG } from "./constants";
import { probeVideo } from "./ffprobe";
import { updateJob, ToolJobStage } from "@/lib/toolJobs/toolJobs";

const execAsync = promisify(exec);

async function downloadFromStorage(key: string, destPath: string): Promise<void> {
  const result = await getReplitStorageClient().downloadAsBytes(key);
  if (!result.ok) {
    throw new Error(`Failed to download ${key}: ${result.error}`);
  }
  await fs.writeFile(destPath, result.value);
}

async function uploadToStorage(srcPath: string, key: string): Promise<void> {
  const buffer = await fs.readFile(srcPath);
  await getReplitStorageClient().uploadFromBytes(key, buffer);
}

function buildFFmpegCommand(
  inputPath: string,
  outputPath: string,
  config: BlurFillConfig,
  meta: VideoMeta
): string {
  const { target_w, target_h, fps, blur_sigma, bg_scale, bg_dim, bg_saturation } = config;

  const bg_w = Math.round(target_w * bg_scale);
  const bg_h = Math.round(target_h * bg_scale);

  const rotateFilter = meta.rotation === 90 ? ",transpose=1" :
                       meta.rotation === 180 ? ",transpose=2,transpose=2" :
                       meta.rotation === 270 ? ",transpose=2" : "";

  const filterComplex = `
[0:v]${rotateFilter ? rotateFilter.slice(1) + "," : ""}split=2[main][bg];
[bg]scale=${bg_w}:${bg_h}:force_original_aspect_ratio=increase,crop=${target_w}:${target_h},gblur=sigma=${blur_sigma},eq=brightness=-${bg_dim}:saturation=${bg_saturation}[bgout];
[main]scale=${target_w}:${target_h}:force_original_aspect_ratio=decrease,pad=${target_w}:${target_h}:(ow-iw)/2:(oh-ih)/2:color=black@0[mainout];
[bgout][mainout]overlay=(W-w)/2:(H-h)/2:format=auto
`.trim().replace(/\n/g, "");

  const audioArgs = meta.has_audio ? "-c:a aac -b:a 192k" : "-an";

  return `ffmpeg -y -i "${inputPath}" -filter_complex "${filterComplex}" -vsync cfr -r ${fps} -c:v libx264 -preset fast -pix_fmt yuv420p ${audioArgs} "${outputPath}"`;
}

export async function runBlurFillJob(
  jobId: string,
  inputKey: string,
  config: Partial<BlurFillConfig>,
  onProgress: (stage: ToolJobStage, progress: number) => Promise<void>
): Promise<ProcessResult> {
  const workDir = path.join(TMP_BASE, jobId);
  await fs.mkdir(workDir, { recursive: true });

  const inputPath = path.join(workDir, "input.mp4");
  const outputPath = path.join(workDir, "output.mp4");

  try {
    await onProgress("download", 10);
    await downloadFromStorage(inputKey, inputPath);
    await onProgress("download", 30);

    const meta = await probeVideo(inputPath);
    console.log(`[vertical-blur-fill] Job ${jobId} - Input: ${meta.width}x${meta.height}, rotation=${meta.rotation}, audio=${meta.has_audio}`);

    const effectiveConfig: BlurFillConfig = {
      target_w: config.target_w ?? DEFAULT_CONFIG.target_w,
      target_h: config.target_h ?? DEFAULT_CONFIG.target_h,
      fps: config.fps ?? DEFAULT_CONFIG.fps,
      blur_sigma: config.blur_sigma ?? DEFAULT_CONFIG.blur_sigma,
      bg_scale: config.bg_scale ?? DEFAULT_CONFIG.bg_scale,
      bg_dim: config.bg_dim ?? DEFAULT_CONFIG.bg_dim,
      bg_saturation: config.bg_saturation ?? DEFAULT_CONFIG.bg_saturation,
    };

    await onProgress("process", 40);
    const ffmpegCmd = buildFFmpegCommand(inputPath, outputPath, effectiveConfig, meta);
    console.log(`[vertical-blur-fill] Job ${jobId} - Running FFmpeg...`);
    
    await execAsync(ffmpegCmd, { 
      maxBuffer: 50 * 1024 * 1024,
      timeout: 10 * 60 * 1000
    });

    await onProgress("process", 80);

    const outputKey = `${STORAGE_PREFIX}/${jobId}/output.mp4`;
    await onProgress("upload", 90);
    await uploadToStorage(outputPath, outputKey);

    await onProgress("cleanup", 95);
    await fs.rm(workDir, { recursive: true, force: true });

    return {
      output_key: outputKey,
      duration_sec: meta.duration,
      input_dims: `${meta.width}x${meta.height}`,
      output_dims: `${effectiveConfig.target_w}x${effectiveConfig.target_h}`,
      effective_config: effectiveConfig,
    };

  } catch (err) {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}
