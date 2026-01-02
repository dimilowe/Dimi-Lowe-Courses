export type BeatStatus = "PENDING" | "WAITING_UPLOAD" | "PROCESSING" | "PASS" | "FAIL";

export interface BoundaryState {
  camera_angle: string;
  facing_direction: string;
  screen_position: string;
  lighting_direction: string;
  identity_anchors: {
    hair_color?: string;
    clothing_silhouette?: string;
    key_features?: string[];
  };
  scene_id: string;
  timestamp: number;
}

export interface Beat {
  id: string;
  index: number;
  status: BeatStatus;
  duration_target: number;
  attempts: number;
  max_attempts: number;
  boundary_start?: {
    frame_path?: string;
    state?: BoundaryState;
    hold_duration: number;
  };
  boundary_end?: {
    frame_path?: string;
    state?: BoundaryState;
  };
  clip_path?: string;
  validate_report?: ValidationReport;
  error?: string;
}

export interface ValidationReport {
  passed: boolean;
  checks: ValidationCheck[];
  timestamp: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  message?: string;
}

export interface CharacterPack {
  id: string;
  name: string;
  identity_anchors: {
    hair_color: string;
    clothing_silhouette: string;
    key_features: string[];
  };
}

export interface ScenePack {
  id: string;
  name: string;
  lighting_direction: string;
  environment: string;
}

export interface StyleDNA {
  id: string;
  name: string;
  color_palette: string[];
  visual_style: string;
}

export interface MotionSkeleton {
  id: string;
  name: string;
  beats: MotionBeatTemplate[];
}

export interface MotionBeatTemplate {
  duration: number;
  camera_angle: string;
  motion_type: string;
  transition_in?: string;
  transition_out?: string;
}

export interface CompilerManifest {
  version: string;
  job_id: string;
  created_at: string;
  updated_at: string;
  status: "compiling" | "waiting_upload" | "processing" | "complete" | "failed" | "halted";
  current_beat_index: number;
  character_pack?: CharacterPack;
  scene_pack?: ScenePack;
  style_dna?: StyleDNA;
  motion_skeleton?: MotionSkeleton;
  beats: Beat[];
  final_output?: {
    path: string;
    duration: number;
    rendered_at: string;
  };
  error?: string;
}

export interface RenderPacket {
  version: string;
  beat_id: string;
  beat_index: number;
  total_beats: number;
  invariants: {
    character: CharacterPack;
    scene: ScenePack;
    style: StyleDNA;
  };
  boundary_start?: {
    required: boolean;
    frame_url?: string;
    state: BoundaryState;
    hold_duration: number;
  };
  render_instructions: {
    camera_angle: string;
    motion_type: string;
    duration_target: number;
    transition_in?: string;
    transition_out?: string;
  };
  continuity_requirements: {
    must_match_previous_boundary: boolean;
    camera_angle_bucket: string;
    facing_direction: string;
    screen_position_bucket: string;
    lighting_direction: string;
  };
}

export interface CompileLog {
  entries: LogEntry[];
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  stage: string;
  message: string;
  data?: Record<string, any>;
}
