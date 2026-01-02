import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob, updateJob, appendMeta, ToolJobStage } from "@/lib/toolJobs/toolJobs";
import { runBlurFillJob } from "@/lib/verticalBlurFill/processor";
import { TOOL_SLUG } from "@/lib/verticalBlurFill/constants";
import { BlurFillConfig } from "@/lib/verticalBlurFill/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { input_key, target_w, target_h, fps, blur_sigma, bg_scale, bg_dim, bg_saturation } = body;

    if (!input_key) {
      return NextResponse.json({ ok: false, error: "input_key is required" }, { status: 400 });
    }

    const config: Partial<BlurFillConfig> = {};
    if (target_w !== undefined) config.target_w = Number(target_w);
    if (target_h !== undefined) config.target_h = Number(target_h);
    if (fps !== undefined) config.fps = Number(fps);
    if (blur_sigma !== undefined) config.blur_sigma = Number(blur_sigma);
    if (bg_scale !== undefined) config.bg_scale = Number(bg_scale);
    if (bg_dim !== undefined) config.bg_dim = Number(bg_dim);
    if (bg_saturation !== undefined) config.bg_saturation = Number(bg_saturation);

    const jobId = await createJob({
      toolSlug: TOOL_SLUG,
      inputKey: input_key,
      originalFilename: "blur-fill-input"
    });

    await updateJob(jobId, {
      status: "processing",
      stage: "download",
      progress: 0
    });

    await appendMeta(jobId, { 
      input_key,
      requested_config: config
    });

    (async () => {
      try {
        const result = await runBlurFillJob(
          jobId,
          input_key,
          config,
          async (stage: ToolJobStage, progress: number) => {
            await updateJob(jobId, { stage, progress });
          }
        );

        await updateJob(jobId, {
          status: "complete",
          stage: "cleanup",
          progress: 100,
          output_key: result.output_key
        });

        await appendMeta(jobId, {
          result,
          completed_at: new Date().toISOString()
        });

        console.log(`[vertical-blur-fill] Job ${jobId} completed successfully`);

      } catch (err: any) {
        console.error(`[vertical-blur-fill] Job ${jobId} failed:`, err);
        await updateJob(jobId, {
          status: "failed",
          error: String(err?.message || err),
          progress: 0
        });
      }
    })();

    return NextResponse.json({
      ok: true,
      job_id: jobId
    });

  } catch (err: any) {
    console.error("[vertical-blur-fill] Error creating job:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
