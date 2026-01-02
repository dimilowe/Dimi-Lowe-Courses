export interface BlurFillConfig {
  target_w: number;
  target_h: number;
  fps: number;
  blur_sigma: number;
  bg_scale: number;
  bg_dim: number;
  bg_saturation: number;
}

export interface VideoMeta {
  width: number;
  height: number;
  rotation: number;
  has_audio: boolean;
  duration: number;
  fps: number;
}

export interface ProcessResult {
  output_key: string;
  duration_sec: number;
  input_dims: string;
  output_dims: string;
  effective_config: BlurFillConfig;
}
