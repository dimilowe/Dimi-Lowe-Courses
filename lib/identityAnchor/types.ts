export const TOOL_SLUG = "identity-anchor-generator";
export const STORAGE_PREFIX = "identity-anchor-generator";

export type StylePreset = 
  | "anime_cinematic_v1"
  | "realistic_cinematic_v1"
  | "illustrated_v1"
  | "3d_render_v1";

export const STYLE_PRESETS: { value: StylePreset; label: string; description: string }[] = [
  { value: "anime_cinematic_v1", label: "Anime Cinematic", description: "High-quality anime style with cinematic lighting" },
  { value: "realistic_cinematic_v1", label: "Realistic Cinematic", description: "Photorealistic with cinematic color grading" },
  { value: "illustrated_v1", label: "Illustrated", description: "Digital illustration with bold colors" },
  { value: "3d_render_v1", label: "3D Render", description: "High-quality 3D rendered look" },
];

export interface IdentitySpec {
  character_description: string;
  scene_description?: string;
  style_preset: StylePreset;
}

export interface JobInputs {
  mode: "concept" | "lock";
  identity_spec: IdentitySpec;
  concept_image_key?: string;
}

export interface JobManifest {
  job_id: string;
  mode: "concept" | "lock";
  status: "pending" | "processing" | "completed" | "failed";
  identity_spec: IdentitySpec;
  concept_image_key?: string;
  anchor_front_key?: string;
  anchor_profile_key?: string;
  anchor_action_key?: string;
  concept_attempts: number;
  anchor_attempts: number;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterPack {
  id: string;
  owner_user_id: number | null;
  name: string | null;
  locked_identity_text: string;
  style_preset: string;
  scene_description: string | null;
  concept_image_key: string | null;
  anchor_front_key: string | null;
  anchor_profile_key: string | null;
  anchor_action_key: string | null;
  concept_attempts: number;
  anchor_attempts: number;
  max_concept_attempts: number;
  max_anchor_attempts: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const MAX_CONCEPT_ATTEMPTS = 5;
export const MAX_ANCHOR_ATTEMPTS = 3;
