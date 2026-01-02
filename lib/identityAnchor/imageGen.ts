import OpenAI from "openai";
import { Client } from "@replit/object-storage";
import { IdentitySpec, StylePreset, STORAGE_PREFIX } from "./types";
import { loadManifest, saveManifest } from "./manifest";

const openai = new OpenAI();
const storageClient = new Client();

function getStylePromptModifier(preset: StylePreset): string {
  switch (preset) {
    case "anime_cinematic_v1":
      return "high-quality anime art style, cinematic lighting, detailed character design, vibrant colors, studio quality animation frame";
    case "realistic_cinematic_v1":
      return "photorealistic, cinematic photography, professional lighting, 8k ultra HD, detailed skin textures, movie still";
    case "illustrated_v1":
      return "digital illustration, bold colors, clean lines, professional concept art, artstation quality";
    case "3d_render_v1":
      return "high-quality 3D render, Pixar-style, subsurface scattering, volumetric lighting, octane render";
    default:
      return "high-quality digital art";
  }
}

function buildConceptPrompt(spec: IdentitySpec): string {
  const styleModifier = getStylePromptModifier(spec.style_preset);
  const sceneContext = spec.scene_description 
    ? `, in a setting of ${spec.scene_description}` 
    : ", neutral background";
  
  return `Create a character portrait: ${spec.character_description}${sceneContext}. Style: ${styleModifier}. Full body visible, facing camera at 3/4 angle, clear lighting on face and body.`;
}

function buildAnchorPrompt(spec: IdentitySpec, poseType: "front" | "profile" | "action"): string {
  const styleModifier = getStylePromptModifier(spec.style_preset);
  
  const poseInstructions = {
    front: "facing directly at camera, standing pose, neutral expression, full body visible, arms at sides or slightly posed",
    profile: "side profile view, 90 degrees from camera, full body visible, walking or standing pose",
    action: "dynamic action pose, mid-movement, expressive, showing character's personality, full body visible",
  };
  
  return `Character reference sheet pose - ${poseInstructions[poseType]}. Character: ${spec.character_description}. Style: ${styleModifier}. Clean neutral background, studio lighting, character turnaround sheet quality. IMPORTANT: Maintain exact same character appearance, clothing, and features as the identity specification.`;
}

async function fetchImageFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateConceptImage(
  jobId: string
): Promise<{ success: boolean; imageKey?: string; error?: string }> {
  const manifest = await loadManifest(jobId);
  if (!manifest) {
    return { success: false, error: "Job manifest not found" };
  }

  try {
    manifest.status = "processing";
    manifest.concept_attempts += 1;
    await saveManifest(jobId, manifest);

    const prompt = buildConceptPrompt(manifest.identity_spec);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const imageData = response.data?.[0];
    if (!imageData?.url) {
      throw new Error("No image URL returned from OpenAI");
    }

    const imageBuffer = await fetchImageFromUrl(imageData.url);
    const imageKey = `${getJobPath(jobId)}/concept/concept.png`;
    await storageClient.uploadFromBytes(imageKey, imageBuffer);

    manifest.status = "completed";
    manifest.concept_image_key = imageKey;
    await saveManifest(jobId, manifest);

    return { success: true, imageKey };
  } catch (err: any) {
    manifest.status = "failed";
    manifest.error = err.message || String(err);
    await saveManifest(jobId, manifest);
    return { success: false, error: manifest.error };
  }
}

export async function generateAnchorImages(
  jobId: string
): Promise<{ success: boolean; keys?: { front: string; profile: string; action: string }; error?: string }> {
  const manifest = await loadManifest(jobId);
  if (!manifest) {
    return { success: false, error: "Job manifest not found" };
  }

  try {
    manifest.status = "processing";
    manifest.anchor_attempts += 1;
    await saveManifest(jobId, manifest);

    const poses: Array<"front" | "profile" | "action"> = ["front", "profile", "action"];
    const keys: { front?: string; profile?: string; action?: string } = {};

    for (const pose of poses) {
      const prompt = buildAnchorPrompt(manifest.identity_spec, pose);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      });

      const imageData = response.data?.[0];
      if (!imageData?.url) {
        throw new Error(`No image URL returned for ${pose} pose`);
      }

      const imageBuffer = await fetchImageFromUrl(imageData.url);
      const imageKey = `${getJobPath(jobId)}/anchors/${pose}.png`;
      await storageClient.uploadFromBytes(imageKey, imageBuffer);
      keys[pose] = imageKey;
    }

    manifest.status = "completed";
    manifest.anchor_front_key = keys.front;
    manifest.anchor_profile_key = keys.profile;
    manifest.anchor_action_key = keys.action;
    await saveManifest(jobId, manifest);

    return { 
      success: true, 
      keys: { 
        front: keys.front!, 
        profile: keys.profile!, 
        action: keys.action! 
      } 
    };
  } catch (err: any) {
    manifest.status = "failed";
    manifest.error = err.message || String(err);
    await saveManifest(jobId, manifest);
    return { success: false, error: manifest.error };
  }
}

function getJobPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}`;
}
