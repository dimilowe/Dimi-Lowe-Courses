export interface ManifestShot {
  shot_id: string;
  timestamp_sec: number;
  duration_sec: number;
  frame: string;
}

export interface Manifest {
  name: string;
  version: string;
  duration_sec: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  shots: ManifestShot[];
  truncated?: boolean;
}

export interface NormalizedShot {
  shot_id: string;
  timestamp_sec: number;
  duration_sec: number;
  duration_frames: number;
  frame: string;
  clamped: boolean;
}

export interface NormalizedManifest extends Omit<Manifest, "shots"> {
  shots: NormalizedShot[];
  normalization: {
    fps: number;
    max_shot_duration_sec: number;
    total_frames: number;
    total_duration_sec: number;
    shots_clamped: number;
  };
}

export interface RenderStats {
  duration_sec: number;
  fps: number;
  resolution: string;
  total_frames: number;
  ffmpeg_cmd: string;
  clamp_applied: number;
  source_job_id: string;
}
