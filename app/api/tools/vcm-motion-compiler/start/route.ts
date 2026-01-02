import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { createManifest } from "@/lib/motionCompiler/manifest";
import { generateRenderPacket } from "@/lib/motionCompiler/packet";
import { 
  CharacterPack, 
  ScenePack, 
  StyleDNA, 
  MotionSkeleton 
} from "@/lib/motionCompiler/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { 
      character_pack, 
      scene_pack, 
      style_dna, 
      motion_skeleton 
    } = body;

    if (!character_pack || !scene_pack || !style_dna || !motion_skeleton) {
      return NextResponse.json({
        ok: false,
        error: "Missing required packs: character_pack, scene_pack, style_dna, motion_skeleton"
      }, { status: 400 });
    }

    if (!motion_skeleton.beats || motion_skeleton.beats.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Motion skeleton must have at least one beat"
      }, { status: 400 });
    }

    const jobId = await createJob({
      toolSlug: TOOL_SLUG,
      inputKey: `${TOOL_SLUG}/${Date.now()}`,
      originalFilename: "motion-compile"
    });

    await updateJob(jobId, {
      status: "processing",
      stage: "compile",
      progress: 0
    });

    const manifest = await createManifest(
      jobId,
      character_pack as CharacterPack,
      scene_pack as ScenePack,
      style_dna as StyleDNA,
      motion_skeleton as MotionSkeleton
    );

    await appendMeta(jobId, {
      total_beats: manifest.beats.length,
      skeleton_id: motion_skeleton.id || "custom"
    });

    await updateJob(jobId, {
      status: "processing",
      stage: "waiting_upload",
      progress: 10
    });

    const packet = await generateRenderPacket(jobId, 0);

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      manifest: {
        version: manifest.version,
        job_id: manifest.job_id,
        status: manifest.status,
        current_beat_index: manifest.current_beat_index,
        total_beats: manifest.beats.length,
        beats: manifest.beats.map(b => ({
          id: b.id,
          index: b.index,
          status: b.status,
          duration_target: b.duration_target,
          attempts: b.attempts,
          max_attempts: b.max_attempts
        }))
      },
      current_packet: packet
    });

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Start error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
