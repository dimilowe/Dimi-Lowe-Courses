import { getReplitStorageClient } from "@/lib/objectStorage/replitClient";
import { 
  CompilerManifest, 
  Beat, 
  CharacterPack, 
  ScenePack, 
  StyleDNA, 
  MotionSkeleton,
  CompileLog,
  LogEntry
} from "./types";
import { 
  STORAGE_PREFIX, 
  MANIFEST_VERSION, 
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_HOLD_DURATION
} from "./constants";

export function getManifestPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}/manifest.json`;
}

export function getLogPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}/compile.log.json`;
}

export function getBeatPath(jobId: string, beatId: string): string {
  return `${STORAGE_PREFIX}/${jobId}/beats/${beatId}`;
}

export function getOutputPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}/output`;
}

export async function createManifest(
  jobId: string,
  characterPack: CharacterPack,
  scenePack: ScenePack,
  styleDna: StyleDNA,
  motionSkeleton: MotionSkeleton
): Promise<CompilerManifest> {
  const beats: Beat[] = motionSkeleton.beats.map((template, index) => {
    const beatId = `B${String(index + 1).padStart(2, "0")}`;
    const beat: Beat = {
      id: beatId,
      index,
      status: index === 0 ? "WAITING_UPLOAD" : "PENDING",
      duration_target: template.duration,
      attempts: 0,
      max_attempts: DEFAULT_MAX_ATTEMPTS,
    };

    if (index > 0) {
      beat.boundary_start = {
        hold_duration: DEFAULT_HOLD_DURATION,
      };
    }

    return beat;
  });

  const manifest: CompilerManifest = {
    version: MANIFEST_VERSION,
    job_id: jobId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "waiting_upload",
    current_beat_index: 0,
    character_pack: characterPack,
    scene_pack: scenePack,
    style_dna: styleDna,
    motion_skeleton: motionSkeleton,
    beats,
  };

  await saveManifest(jobId, manifest);
  await initializeLog(jobId);
  await appendLog(jobId, "info", "compile", "Manifest created", { 
    total_beats: beats.length,
    skeleton_id: motionSkeleton.id 
  });

  return manifest;
}

export async function saveManifest(jobId: string, manifest: CompilerManifest): Promise<void> {
  manifest.updated_at = new Date().toISOString();
  const path = getManifestPath(jobId);
  await getReplitStorageClient().uploadFromText(path, JSON.stringify(manifest, null, 2));
}

export async function loadManifest(jobId: string): Promise<CompilerManifest | null> {
  try {
    const path = getManifestPath(jobId);
    const result = await getReplitStorageClient().downloadAsText(path);
    if (!result.ok) return null;
    return JSON.parse(result.value) as CompilerManifest;
  } catch {
    return null;
  }
}

export async function updateBeat(
  jobId: string,
  beatIndex: number,
  updates: Partial<Beat>
): Promise<CompilerManifest | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return null;

  if (beatIndex >= 0 && beatIndex < manifest.beats.length) {
    manifest.beats[beatIndex] = { ...manifest.beats[beatIndex], ...updates };
  }

  await saveManifest(jobId, manifest);
  return manifest;
}

export async function updateManifestStatus(
  jobId: string,
  status: CompilerManifest["status"],
  error?: string
): Promise<CompilerManifest | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return null;

  manifest.status = status;
  if (error) manifest.error = error;

  await saveManifest(jobId, manifest);
  return manifest;
}

export async function advanceToBeat(
  jobId: string,
  nextBeatIndex: number
): Promise<CompilerManifest | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return null;

  manifest.current_beat_index = nextBeatIndex;

  if (nextBeatIndex < manifest.beats.length) {
    manifest.beats[nextBeatIndex].status = "WAITING_UPLOAD";
    manifest.status = "waiting_upload";
  } else {
    manifest.status = "complete";
  }

  await saveManifest(jobId, manifest);
  return manifest;
}

export async function initializeLog(jobId: string): Promise<void> {
  const log: CompileLog = { entries: [] };
  const path = getLogPath(jobId);
  await getReplitStorageClient().uploadFromText(path, JSON.stringify(log, null, 2));
}

export async function appendLog(
  jobId: string,
  level: LogEntry["level"],
  stage: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const path = getLogPath(jobId);
    const result = await getReplitStorageClient().downloadAsText(path);
    const log: CompileLog = result.ok ? JSON.parse(result.value) : { entries: [] };
    
    log.entries.push({
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      data,
    });

    await getReplitStorageClient().uploadFromText(path, JSON.stringify(log, null, 2));
  } catch (err) {
    console.error("[motion-compiler] Failed to append log:", err);
  }
}

export async function loadLog(jobId: string): Promise<CompileLog | null> {
  try {
    const path = getLogPath(jobId);
    const result = await getReplitStorageClient().downloadAsText(path);
    if (!result.ok) return null;
    return JSON.parse(result.value) as CompileLog;
  } catch {
    return null;
  }
}
