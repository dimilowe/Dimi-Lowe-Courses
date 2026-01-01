import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob, updateJob, appendMeta } from "@/lib/toolJobs/toolJobs";
import { TOOL_SLUG, DEFAULT_SETTINGS } from "@/lib/motionCompiler/constants";
import { runMotionCompiler } from "@/lib/motionCompiler/compiler";
import { MotionCompilerInput } from "@/lib/motionCompiler/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body: MotionCompilerInput = await req.json();
    const { 
      character_pack_key, 
      scene_pack_key, 
      style_dna_id, 
      motion_skeleton,
      provider,
      provider_key,
      settings 
    } = body;

    if (!character_pack_key || !scene_pack_key || !style_dna_id) {
      return NextResponse.json({ 
        ok: false, 
        error: "character_pack_key, scene_pack_key, and style_dna_id are required" 
      }, { status: 400 });
    }

    if (!motion_skeleton || !motion_skeleton.beats || motion_skeleton.beats.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: "motion_skeleton with beats array is required" 
      }, { status: 400 });
    }

    if (provider === "byok" && !provider_key) {
      return NextResponse.json({ 
        ok: false, 
        error: "provider_key is required for BYOK provider" 
      }, { status: 400 });
    }

    const mergedSettings = {
      fps: settings?.fps || DEFAULT_SETTINGS.fps,
      beat_target_seconds: settings?.beat_target_seconds || DEFAULT_SETTINGS.beat_target_seconds,
      max_attempts_per_beat: settings?.max_attempts_per_beat || DEFAULT_SETTINGS.max_attempts_per_beat
    };

    const jobId = await createJob({
      toolSlug: TOOL_SLUG,
      inputKey: `${TOOL_SLUG}/${Date.now()}`,
      originalFilename: "motion-compile"
    });

    await updateJob(jobId, {
      status: "processing",
      stage: "compile" as any,
      progress: 0
    });

    await appendMeta(jobId, {
      character_pack_key,
      scene_pack_key,
      style_dna_id,
      motion_skeleton,
      settings: mergedSettings,
      provider,
      beats: motion_skeleton.beats.map((b: any) => ({
        beat_id: b.beat_id,
        action: b.action,
        status: "PENDING",
        attempts: 0
      })),
      compile_log: [`[${new Date().toISOString()}] Job ${jobId} created`]
    });

    (async () => {
      try {
        await runMotionCompiler(
          jobId,
          {
            character_pack_key,
            scene_pack_key,
            style_dna_id,
            motion_skeleton,
            provider,
            provider_key,
            settings: mergedSettings
          },
          async (stage, progress, meta) => {
            await updateJob(jobId, { 
              stage: stage as any, 
              progress 
            });
            if (meta) {
              await appendMeta(jobId, meta);
            }
          }
        );

        await updateJob(jobId, {
          status: "complete",
          stage: "cleanup" as any,
          progress: 100,
          output_key: `${TOOL_SLUG}/${jobId}/output/final.mp4`
        });

        await appendMeta(jobId, {
          completed_at: new Date().toISOString()
        });

        console.log(`[${TOOL_SLUG}] Job ${jobId} completed successfully`);

      } catch (err: any) {
        console.error(`[${TOOL_SLUG}] Job ${jobId} failed:`, err);
        await updateJob(jobId, {
          status: "failed",
          error: String(err?.message || err),
          progress: 0
        });
        await appendMeta(jobId, {
          compile_log: [`[${new Date().toISOString()}] FATAL: ${err?.message || err}`]
        });
      }
    })();

    return NextResponse.json({
      ok: true,
      job_id: jobId
    });

  } catch (err: any) {
    console.error(`[${TOOL_SLUG}] Error creating job:`, err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
