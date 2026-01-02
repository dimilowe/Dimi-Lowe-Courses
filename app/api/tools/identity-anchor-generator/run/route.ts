import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG, MAX_CONCEPT_ATTEMPTS, MAX_ANCHOR_ATTEMPTS } from "@/lib/identityAnchor/types";
import { createManifest, loadManifest, updateManifestStatus } from "@/lib/identityAnchor/manifest";
import { generateConceptImage, generateAnchorImages } from "@/lib/identityAnchor/imageGen";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { mode, job_id, inputs } = body;

    if (!mode || !["concept", "lock"].includes(mode)) {
      return NextResponse.json({
        ok: false,
        error: "mode must be 'concept' or 'lock'"
      }, { status: 400 });
    }

    if (!inputs?.character_description) {
      return NextResponse.json({
        ok: false,
        error: "character_description is required"
      }, { status: 400 });
    }

    const identitySpec = {
      character_description: inputs.character_description,
      scene_description: inputs.scene_description || undefined,
      style_preset: inputs.style_preset || "anime_cinematic_v1",
    };

    if (mode === "concept") {
      const jobId = job_id || uuidv4();
      
      const existing = job_id ? await loadManifest(job_id) : null;
      
      if (existing && existing.concept_attempts >= MAX_CONCEPT_ATTEMPTS) {
        return NextResponse.json({
          ok: false,
          error: `Maximum concept regenerations (${MAX_CONCEPT_ATTEMPTS}) reached`,
          attempts: existing.concept_attempts,
          max_attempts: MAX_CONCEPT_ATTEMPTS
        }, { status: 400 });
      }

      if (existing) {
        await updateManifestStatus(jobId, "pending", {
          mode: "concept",
          identity_spec: identitySpec,
        });
      } else {
        await createManifest(jobId, "concept", identitySpec);
      }
      
      const result = await generateConceptImage(jobId);
      
      if (!result.success) {
        return NextResponse.json({
          ok: false,
          error: result.error,
          job_id: jobId
        }, { status: 500 });
      }

      const manifest = await loadManifest(jobId);

      return NextResponse.json({
        ok: true,
        job_id: jobId,
        mode: "concept",
        concept_image_key: result.imageKey,
        concept_image_base64: result.imageBase64,
        concept_attempts: manifest?.concept_attempts || 1,
        max_concept_attempts: MAX_CONCEPT_ATTEMPTS
      });
    }

    if (mode === "lock") {
      if (!inputs.concept_image_key) {
        return NextResponse.json({
          ok: false,
          error: "concept_image_key is required for lock mode"
        }, { status: 400 });
      }

      const jobId = job_id || uuidv4();
      
      const existing = job_id ? await loadManifest(job_id) : null;
      
      if (existing && existing.anchor_attempts >= MAX_ANCHOR_ATTEMPTS) {
        return NextResponse.json({
          ok: false,
          error: `Maximum anchor regenerations (${MAX_ANCHOR_ATTEMPTS}) reached`,
          attempts: existing.anchor_attempts,
          max_attempts: MAX_ANCHOR_ATTEMPTS
        }, { status: 400 });
      }

      if (existing) {
        await updateManifestStatus(jobId, "pending", {
          mode: "lock",
          identity_spec: identitySpec,
          concept_image_key: inputs.concept_image_key,
        });
      } else {
        await createManifest(jobId, "lock", identitySpec, inputs.concept_image_key);
      }
      
      const result = await generateAnchorImages(jobId);
      
      if (!result.success) {
        return NextResponse.json({
          ok: false,
          error: result.error,
          job_id: jobId
        }, { status: 500 });
      }

      const manifest = await loadManifest(jobId);

      return NextResponse.json({
        ok: true,
        job_id: jobId,
        mode: "lock",
        anchors: result.keys,
        anchor_base64s: result.base64s,
        anchor_attempts: manifest?.anchor_attempts || 1,
        max_anchor_attempts: MAX_ANCHOR_ATTEMPTS
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });
  } catch (err: any) {
    console.error("[identity-anchor-generator] Run error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
