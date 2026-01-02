import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { Client } from "@replit/object-storage";
import { BoundaryState } from "./types";
import { FRAME_EXTRACTION_FALLBACKS, STORAGE_PREFIX } from "./constants";
import { appendLog, getBeatPath } from "./manifest";

const execAsync = promisify(exec);
const client = new Client();

export interface BoundaryExtractionResult {
  success: boolean;
  start_frame_path?: string;
  end_frame_path?: string;
  start_state?: BoundaryState;
  end_state?: BoundaryState;
  duration?: number;
  error?: string;
}

async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`
  );
  return parseFloat(stdout.trim());
}

async function extractFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<boolean> {
  try {
    await execAsync(
      `ffmpeg -y -ss ${timestamp.toFixed(3)} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`
    );
    
    const stats = await fs.stat(outputPath);
    if (stats.size < 1000) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

async function isValidFrame(framePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(framePath);
    if (stats.size < 1000) return false;
    
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${framePath}"`
    );
    const [width, height] = stdout.trim().split(",").map(Number);
    if (width < 100 || height < 100) return false;
    
    return true;
  } catch {
    return false;
  }
}

export async function extractBoundaryFrames(
  jobId: string,
  beatId: string,
  clipPath: string
): Promise<BoundaryExtractionResult> {
  const beatPath = getBeatPath(jobId, beatId);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "boundary-"));
  
  try {
    const duration = await getVideoDuration(clipPath);
    
    const startFramePath = path.join(tmpDir, "boundary_start.frame.png");
    const startSuccess = await extractFrame(clipPath, startFramePath, 0.05);
    
    if (!startSuccess || !(await isValidFrame(startFramePath))) {
      await appendLog(jobId, "error", "boundary", "Failed to extract start frame", { beatId });
      return { success: false, error: "Failed to extract valid start frame" };
    }
    
    let endFramePath = path.join(tmpDir, "boundary_end.frame.png");
    let endSuccess = false;
    let usedOffset = 0;
    
    for (const offset of FRAME_EXTRACTION_FALLBACKS) {
      const timestamp = Math.max(0, duration - offset);
      endSuccess = await extractFrame(clipPath, endFramePath, timestamp);
      
      if (endSuccess && await isValidFrame(endFramePath)) {
        usedOffset = offset;
        break;
      }
    }
    
    if (!endSuccess) {
      await appendLog(jobId, "error", "boundary", "Failed to extract end frame after all fallbacks", { 
        beatId, 
        attempted_offsets: FRAME_EXTRACTION_FALLBACKS 
      });
      return { success: false, error: "Failed to extract valid end frame" };
    }
    
    const startStoragePath = `${beatPath}/boundary_start.frame.png`;
    const endStoragePath = `${beatPath}/boundary_end.frame.png`;
    
    const startBuffer = await fs.readFile(startFramePath);
    const endBuffer = await fs.readFile(endFramePath);
    
    await client.uploadFromBytes(startStoragePath, startBuffer);
    await client.uploadFromBytes(endStoragePath, endBuffer);
    
    const startState = await deriveStateFromFrame(startFramePath);
    const endState = await deriveStateFromFrame(endFramePath);
    
    const startStatePath = `${beatPath}/boundary_start.state.json`;
    const endStatePath = `${beatPath}/boundary_end.state.json`;
    
    await client.uploadFromText(startStatePath, JSON.stringify(startState, null, 2));
    await client.uploadFromText(endStatePath, JSON.stringify(endState, null, 2));
    
    await appendLog(jobId, "info", "boundary", "Boundary frames extracted successfully", {
      beatId,
      duration,
      end_frame_offset: usedOffset,
    });
    
    return {
      success: true,
      start_frame_path: startStoragePath,
      end_frame_path: endStoragePath,
      start_state: startState,
      end_state: endState,
      duration,
    };
    
  } catch (err: any) {
    await appendLog(jobId, "error", "boundary", "Boundary extraction failed", { 
      beatId, 
      error: err.message 
    });
    return { success: false, error: err.message };
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  }
}

async function deriveStateFromFrame(framePath: string): Promise<BoundaryState> {
  return {
    camera_angle: "medium",
    facing_direction: "center",
    screen_position: "center",
    lighting_direction: "front",
    identity_anchors: {},
    scene_id: "unknown",
    timestamp: Date.now(),
  };
}

export async function loadBoundaryState(
  jobId: string,
  beatId: string,
  boundary: "start" | "end"
): Promise<BoundaryState | null> {
  try {
    const beatPath = getBeatPath(jobId, beatId);
    const statePath = `${beatPath}/boundary_${boundary}.state.json`;
    const result = await client.downloadAsText(statePath);
    if (!result.ok) return null;
    return JSON.parse(result.value) as BoundaryState;
  } catch {
    return null;
  }
}

export async function getBoundaryFrameUrl(
  jobId: string,
  beatId: string,
  boundary: "start" | "end"
): Promise<string | null> {
  const beatPath = getBeatPath(jobId, beatId);
  const framePath = `${beatPath}/boundary_${boundary}.frame.png`;
  
  try {
    const result = await client.downloadAsBytes(framePath);
    if (!result.ok) return null;
    return framePath;
  } catch {
    return null;
  }
}
