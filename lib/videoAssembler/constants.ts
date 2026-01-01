export const TOOL_SLUG = "video-assembler";

export const DEFAULT_FPS = 60;
export const MAX_SHOT_DURATION_SEC = 3.0;
export const OUTPUT_WIDTH = 720;
export const OUTPUT_HEIGHT = 720;
export const OUTPUT_FPS = 60;

export const STAGES = ["download", "assemble", "upload", "cleanup"] as const;
export type Stage = typeof STAGES[number];
