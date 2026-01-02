import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG, STORAGE_PREFIX } from "@/lib/identityAnchor/types";
import { createManifest, loadManifest, updateManifestStatus } from "@/lib/identityAnchor/manifest";
import { Client } from "@replit/object-storage";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const storageClient = new Client();

function getJobPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}`;
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
    const characterDescription = formData.get("character_description") as string | null;
    const sceneDescription = formData.get("scene_description") as string | null;
    const stylePreset = formData.get("style_preset") as string | null;

    if (!file) {
      return NextResponse.json({
        ok: false,
        error: "No file provided"
      }, { status: 400 });
    }

    if (!characterDescription) {
      return NextResponse.json({
        ok: false,
        error: "character_description is required"
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

    const jobId = jobIdParam || uuidv4();
    const existing = jobIdParam ? await loadManifest(jobIdParam) : null;

    const identitySpec = {
      character_description: characterDescription,
      scene_description: sceneDescription || undefined,
      style_preset: (stylePreset as any) || "realistic_cinematic_v1",
    };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

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
