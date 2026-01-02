import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG, STORAGE_PREFIX } from "@/lib/identityAnchor/types";
import { createManifest, loadManifest, updateManifestStatus } from "@/lib/identityAnchor/manifest";
import { Client } from "@replit/object-storage";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

export const runtime = "nodejs";

const storageClient = new Client();
const openai = new OpenAI();

function getJobPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}`;
}

async function analyzeImageWithVision(base64: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a character description expert. Analyze the image and provide a detailed character description that can be used to recreate this character's appearance in different poses. Focus on:
- Physical features (age, gender, hair color/style, eye color, skin tone, facial features)
- Clothing and accessories (specific items, colors, patterns, materials)
- Style/aesthetic (anime, realistic, illustrated, etc.)
- Any distinctive features or unique elements

Write the description in second person ("A young woman with...") and be specific enough that an AI image generator could recreate the character accurately. Keep it to 2-3 sentences maximum.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this character in detail so it can be recreated in different poses:"
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || "Character in the uploaded image";
}

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobIdParam = formData.get("job_id") as string | null;
    const stylePreset = formData.get("style_preset") as string | null;

    if (!file) {
      return NextResponse.json({
        ok: false,
        error: "No file provided"
      }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        ok: false,
        error: "Invalid file type. Please upload PNG, JPEG, or WebP"
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        ok: false,
        error: "File too large. Maximum size is 10MB"
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const characterDescription = await analyzeImageWithVision(base64, file.type);

    const jobId = jobIdParam || uuidv4();
    const existing = jobIdParam ? await loadManifest(jobIdParam) : null;

    const identitySpec = {
      character_description: characterDescription,
      scene_description: undefined,
      style_preset: (stylePreset as any) || "realistic_cinematic_v1",
    };

    const imageKey = `${getJobPath(jobId)}/concept/concept.png`;
    await storageClient.uploadFromBytes(imageKey, buffer);

    if (existing) {
      await updateManifestStatus(jobId, "completed", {
        mode: "concept",
        identity_spec: identitySpec,
        concept_image_key: imageKey,
      });
    } else {
      await createManifest(jobId, "concept", identitySpec, imageKey);
      await updateManifestStatus(jobId, "completed", {});
    }

    const manifest = await loadManifest(jobId);

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      mode: "concept",
      concept_image_key: imageKey,
      concept_image_base64: base64,
      character_description: characterDescription,
      concept_attempts: manifest?.concept_attempts || 0,
      uploaded: true,
    });
  } catch (err: any) {
    console.error("[identity-anchor-generator] Upload error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
