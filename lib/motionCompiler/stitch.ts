import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { Client } from "@replit/object-storage";
import { CompilerManifest, Beat } from "./types";
import { loadManifest, saveManifest, appendLog, getOutputPath, getBeatPath } from "./manifest";
import { STORAGE_PREFIX } from "./constants";

const execAsync = promisify(exec);
const client = new Client();

export interface StitchResult {
  success: boolean;
  output_path?: string;
  duration?: number;
  error?: string;
}

export async function canFinalize(jobId: string): Promise<{ canFinalize: boolean; reason?: string }> {
  const manifest = await loadManifest(jobId);
  if (!manifest) {
    return { canFinalize: false, reason: "Manifest not found" };
  }
  
  if (manifest.status === "halted") {
    return { canFinalize: false, reason: "Job is halted due to validation failure" };
  }
  
  const failedBeats = manifest.beats.filter(b => b.status === "FAIL");
  if (failedBeats.length > 0) {
    return { 
      canFinalize: false, 
      reason: `${failedBeats.length} beat(s) failed validation: ${failedBeats.map(b => b.id).join(", ")}` 
    };
  }
  
  const pendingBeats = manifest.beats.filter(b => b.status !== "PASS");
  if (pendingBeats.length > 0) {
    return { 
      canFinalize: false, 
      reason: `${pendingBeats.length} beat(s) not yet passed: ${pendingBeats.map(b => b.id).join(", ")}` 
    };
  }
  
  return { canFinalize: true };
}

export async function stitchBeats(jobId: string): Promise<StitchResult> {
  const manifest = await loadManifest(jobId);
  if (!manifest) {
    return { success: false, error: "Manifest not found" };
  }
  
  const { canFinalize: ready, reason } = await canFinalize(jobId);
  if (!ready) {
    return { success: false, error: reason };
  }
  
  await appendLog(jobId, "info", "render", "Starting final stitch", {
    total_beats: manifest.beats.length,
  });
  
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "stitch-"));
  
  try {
    const clipPaths: string[] = [];
    
    for (const beat of manifest.beats) {
      if (!beat.clip_path) {
        await appendLog(jobId, "error", "render", "Beat missing clip path", { beatId: beat.id });
        return { success: false, error: `Beat ${beat.id} has no clip` };
      }
      
      const localClipPath = path.join(tmpDir, `${beat.id}.mp4`);
      const clipResult = await client.downloadAsBytes(beat.clip_path);
      
      if (!clipResult.ok) {
        await appendLog(jobId, "error", "render", "Failed to download clip", { beatId: beat.id });
        return { success: false, error: `Failed to download clip for ${beat.id}` };
      }
      
      await fs.writeFile(localClipPath, Buffer.from(clipResult.value as any));
      clipPaths.push(localClipPath);
    }
    
    const concatListPath = path.join(tmpDir, "concat.txt");
    const concatContent = clipPaths.map(p => `file '${p}'`).join("\n");
    await fs.writeFile(concatListPath, concatContent);
    
    const outputLocalPath = path.join(tmpDir, "final.mp4");
    
    const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -r 60 -c:a aac -b:a 128k "${outputLocalPath}"`;
    
    await appendLog(jobId, "info", "render", "Running ffmpeg stitch", { command: ffmpegCmd });
    
    await execAsync(ffmpegCmd);
    
    const outputBuffer = await fs.readFile(outputLocalPath);
    const outputStoragePath = `${getOutputPath(jobId)}/final.mp4`;
    
    await client.uploadFromBytes(outputStoragePath, outputBuffer);
    
    const { stdout: durationOut } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputLocalPath}"`
    );
    const duration = parseFloat(durationOut.trim());
    
    manifest.final_output = {
      path: outputStoragePath,
      duration,
      rendered_at: new Date().toISOString(),
    };
    manifest.status = "complete";
    await saveManifest(jobId, manifest);
    
    await appendLog(jobId, "info", "render", "Final stitch complete", {
      output_path: outputStoragePath,
      duration,
    });
    
    return {
      success: true,
      output_path: outputStoragePath,
      duration,
    };
    
  } catch (err: any) {
    await appendLog(jobId, "error", "render", "Stitch failed", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  }
}

export async function downloadFinalVideo(jobId: string): Promise<Buffer | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest?.final_output?.path) return null;
  
  try {
    const result = await client.downloadAsBytes(manifest.final_output.path);
    if (!result.ok) return null;
    return Buffer.from(result.value as any);
  } catch {
    return null;
  }
}
