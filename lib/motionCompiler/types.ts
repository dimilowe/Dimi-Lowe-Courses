export type BeatStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL" | "WARN";
export type ValidationResult = "PASS" | "WARN" | "FAIL";

export interface BeatDuration {
  target: number;
  min: number;
  max: number;
}

export interface BeatSpec {
  beat_id: string;
  action: string;
  duration: BeatDuration;
  must_show?: string[];
}

export interface BoundaryContract {
  requires_prev: boolean;
  prev_beat_id: string | null;
  start_contract: {
    frame_key: string | null;
    state_key: string | null;
  } | null;
}

export interface BeatManifestEntry {
  beat_id: string;
  action: string;
  duration: BeatDuration;
  status: BeatStatus;
  attempts: number;
  boundary: BoundaryContract;
  output?: {
    clip_key: string;
    boundary_end_frame_key: string;
    boundary_end_state_key: string;
  };
  validation?: {
    identity: ValidationResult;
    world: ValidationResult;
    boundary: ValidationResult;
    overall: ValidationResult;
    report_key: string;
  };
  error?: string;
}

export interface MotionManifest {
  version: string;
  job_id: string;
  created_at: string;
  settings: {
    fps: number;
    beat_target_seconds: number;
    max_attempts_per_beat: number;
  };
  packs: {
    character_pack_key: string;
    scene_pack_key: string;
    style_dna_id: string;
  };
  beats: BeatManifestEntry[];
  compile_log: string[];
  output?: {
    final_key: string;
    render_log_key: string;
  };
  status: "compiling" | "generating" | "validating" | "rendering" | "complete" | "failed";
  error?: string;
}

export interface MotionSkeleton {
  beats: BeatSpec[];
}

export interface MotionCompilerInput {
  character_pack_key: string;
  scene_pack_key: string;
  style_dna_id: string;
  motion_skeleton: MotionSkeleton;
  provider: "byok";
  provider_key?: string;
  settings?: {
    fps?: number;
    beat_target_seconds?: number;
    max_attempts_per_beat?: number;
  };
}

export interface ValidationReport {
  beat_id: string;
  checks: {
    identity: {
      result: ValidationResult;
      details: string[];
    };
    world: {
      result: ValidationResult;
      details: string[];
    };
    boundary: {
      result: ValidationResult;
      details: string[];
    };
  };
  overall: ValidationResult;
  timestamp: string;
}

export interface RenderStats {
  duration_sec: number;
  fps: number;
  resolution: string;
  total_frames: number;
  beats_rendered: number;
  beats_failed: number;
}
