import { z } from 'zod';

export const StyleShiftOptions = [
  'None',
  'Anime',
  '3D Cartoon',
  'Editorial Fashion Photo',
  'Vintage Film (35mm)',
  'Cyberpunk Neon',
  'Minimal Flat Vector',
  'Watercolor Illustration',
  'Oil Painting'
] as const;

export type StyleShift = typeof StyleShiftOptions[number];

export const PresetOptions = [
  { id: 'none', label: 'No Preset', guidance: '' },
  { id: 'product', label: 'Product Photo', guidance: 'Focus on clean product photography. Emphasize lighting, shadows, surface textures, and commercial appeal. Describe the product clearly.' },
  { id: 'portrait', label: 'Portrait', guidance: 'Focus on facial features, expression, pose, clothing, and background. Describe skin tones, hair, and lighting on the face.' },
  { id: 'logo', label: 'Logo', guidance: 'Focus on graphic design elements: shapes, colors, typography style, symmetry, negative space. This is a logo/icon, not a photograph.' },
  { id: 'screenshot', label: 'Screenshot/UI', guidance: 'Focus on UI elements: layout, color scheme, typography, buttons, spacing, visual hierarchy. Do not describe as a photo.' }
] as const;

export type PresetId = typeof PresetOptions[number]['id'];

export const VariantSchema = z.object({
  id: z.enum(['faithful', 'detailed', 'simplified', 'style_shift', 'remix']),
  title: z.string(),
  prompt: z.string()
});

export const LayoutMapSchema = z.object({
  aspect_ratio: z.string(),
  foreground: z.string(),
  midground: z.string(),
  background: z.string(),
  subject_position: z.string(),
  notable_objects_positions: z.array(z.object({
    object: z.string(),
    position: z.string()
  }))
});

export const DetailsSchema = z.object({
  subject: z.string(),
  setting: z.string(),
  composition: z.string(),
  lighting: z.string(),
  camera_lens: z.string(),
  color_palette: z.string(),
  mood: z.string(),
  style_notes: z.string()
});

export const ImageToPromptResponseSchema = z.object({
  variants: z.array(VariantSchema).length(5),
  negative_prompt: z.string(),
  details: DetailsSchema,
  layout_map: LayoutMapSchema.nullable()
});

export type ImageToPromptResponse = z.infer<typeof ImageToPromptResponseSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type LayoutMap = z.infer<typeof LayoutMapSchema>;
export type Details = z.infer<typeof DetailsSchema>;

export interface GenerateRequest {
  preserveLayout: boolean;
  keepTextExact: boolean;
  subjectLock: boolean;
  styleShift: StyleShift;
  preset: PresetId;
}

export interface RegenerateRequest extends GenerateRequest {
  variantId: 'faithful' | 'detailed' | 'simplified' | 'style_shift' | 'remix';
  subjectDescription: string;
}

export function calculatePromptQualityScore(details: Details, negativePrompt: string): number {
  let score = 0;
  
  if (details.subject && details.subject !== 'unknown' && details.subject.length > 10) {
    score += 25;
  }
  
  if (details.composition && details.composition !== 'unknown' && details.composition.length > 5) {
    score += 20;
  }
  
  if (details.lighting && details.lighting !== 'unknown' && details.lighting.length > 5) {
    score += 15;
  }
  
  if (details.color_palette && details.color_palette !== 'unknown' && details.color_palette.length > 5) {
    score += 10;
  }
  
  if (details.camera_lens && details.camera_lens !== 'unknown' && details.camera_lens.length > 3) {
    score += 15;
  }
  
  if (negativePrompt && negativePrompt.length > 10) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function formatBundleCopy(
  variants: Variant[],
  negativePrompt: string,
  details: Details
): string {
  const lines: string[] = [
    '=== IMAGE TO PROMPT BUNDLE ===',
    ''
  ];
  
  for (const variant of variants) {
    lines.push(`--- ${variant.title} ---`);
    lines.push(variant.prompt);
    lines.push('');
  }
  
  lines.push('--- Negative Prompt ---');
  lines.push(negativePrompt);
  lines.push('');
  
  lines.push('--- Details ---');
  lines.push(`Subject: ${details.subject}`);
  lines.push(`Setting: ${details.setting}`);
  lines.push(`Composition: ${details.composition}`);
  lines.push(`Lighting: ${details.lighting}`);
  lines.push(`Camera/Lens: ${details.camera_lens}`);
  lines.push(`Color Palette: ${details.color_palette}`);
  lines.push(`Mood: ${details.mood}`);
  lines.push(`Style Notes: ${details.style_notes}`);
  
  return lines.join('\n');
}

export function enforceSimplifiedCharLimit(prompt: string, maxChars: number = 240): string {
  if (prompt.length <= maxChars) return prompt;
  return prompt.substring(0, maxChars - 3) + '...';
}
