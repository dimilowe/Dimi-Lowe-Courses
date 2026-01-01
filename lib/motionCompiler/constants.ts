export const TOOL_SLUG = "vcm-motion-compiler";

export const DEFAULT_SETTINGS = {
  fps: 24,
  beat_target_seconds: 1.2,
  max_attempts_per_beat: 3,
  boundary_frame_offset: 0.05,
  boundary_fallback_offsets: [0.12, 0.20]
};

export const BEAT_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  PASS: "PASS",
  FAIL: "FAIL",
  WARN: "WARN"
} as const;

export const JOB_STAGES = {
  COMPILE: "compile",
  GENERATE: "generate",
  BOUNDARY: "boundary",
  VALIDATE: "validate",
  RENDER: "render",
  UPLOAD: "upload",
  CLEANUP: "cleanup"
} as const;

export const STYLE_DNA_PRESETS = [
  { id: "urban_anime_cinematic_v1", name: "Urban Anime Cinematic", description: "Gritty neon-lit urban scenes with anime aesthetics" },
  { id: "soft_pastel_dreamy_v1", name: "Soft Pastel Dreamy", description: "Ethereal, light pastel tones with soft focus" },
  { id: "dark_noir_v1", name: "Dark Noir", description: "High contrast, moody shadows, cinematic lighting" },
  { id: "vibrant_pop_v1", name: "Vibrant Pop", description: "Bold colors, high saturation, energetic feel" }
];

export const CHARACTER_PRESETS = [
  { id: "urban_anime_male_v1", name: "Urban Male", description: "Silver-white hair, black hooded leather jacket" },
  { id: "urban_anime_female_v1", name: "Urban Female", description: "Dark hair, tactical urban outfit" }
];

export const SCENE_PRESETS = [
  { id: "neon_wet_city_dusk_v1", name: "Neon City Dusk", description: "Wet streets, neon reflections, dusk lighting" },
  { id: "rooftop_night_v1", name: "Rooftop Night", description: "High vantage point, city lights below" },
  { id: "alley_rain_v1", name: "Rainy Alley", description: "Narrow alley, rain, atmospheric lighting" }
];

export const SKELETON_PRESETS = [
  {
    id: "simple_3_beat",
    name: "Simple 3-Beat",
    beats: [
      { beat_id: "B01", action: "Character stands still, wind in hair", duration: { target: 1.2, min: 0.9, max: 1.5 } },
      { beat_id: "B02", action: "Character turns head slowly", duration: { target: 1.2, min: 0.9, max: 1.5 } },
      { beat_id: "B03", action: "Character walks forward", duration: { target: 1.2, min: 0.9, max: 1.5 } }
    ]
  },
  {
    id: "dramatic_5_beat",
    name: "Dramatic 5-Beat",
    beats: [
      { beat_id: "B01", action: "Wide establishing shot, character in distance", duration: { target: 1.5, min: 1.2, max: 2.0 } },
      { beat_id: "B02", action: "Close up on character's face", duration: { target: 1.0, min: 0.8, max: 1.2 } },
      { beat_id: "B03", action: "Character looks to the side", duration: { target: 1.2, min: 0.9, max: 1.5 } },
      { beat_id: "B04", action: "POV shot of what character sees", duration: { target: 1.0, min: 0.8, max: 1.2 } },
      { beat_id: "B05", action: "Character reacts, steps back", duration: { target: 1.2, min: 0.9, max: 1.5 } }
    ]
  }
];
