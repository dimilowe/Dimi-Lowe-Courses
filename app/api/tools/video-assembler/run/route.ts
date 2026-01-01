import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob, updateJob, appendMeta, getJob, ToolJobStage } from "@/lib/toolJobs/toolJobs";
import { runAssembler } from "@/lib/videoAssembler/assembler";
import { TOOL_SLUG } from "@/lib/videoAssembler/constants";
import { AssetMode } from "@/lib/videoAssembler/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const body = await req.json();
    const { pack_key, asset_mode } = body;
    const requestedAssetMode: AssetMode | undefined = 
      asset_mode === "clip" ? "clip" : 
      asset_mode === "frame" ? "frame" : 
      undefined;

    if (!pack_key) {
      return NextResponse.json({ ok: false, error: "pack_key is required" }, { status: 400 });
    }

    const sourceJobIdMatch = pack_key.match(/music-video-parser\/([^\/]+)/);
    const sourceJobId = sourceJobIdMatch ? sourceJobIdMatch[1] : null;

    if (sourceJobId) {
      const sourceJob = await getJob(sourceJobId);
      if (!sourceJob || sourceJob.tool_slug !== "music-video-parser") {
        return NextResponse.json({ ok: false, error: "Source job not found" }, { status: 404 });
      }
      if (sourceJob.status !== "complete") {
        return NextResponse.json({ ok: false, error: "Source job is not complete" }, { status: 400 });
      }
    }

    const jobId = await createJob({
      toolSlug: TOOL_SLUG,
      inputKey: pack_key,
      originalFilename: "assembler-input"
    });
    
    await updateJob(jobId, {
      status: "processing",
      stage: "download",
      progress: 0
    });

    await appendMeta(jobId, {
      source_job_id: sourceJobId,
      pack_key,
      asset_mode: requestedAssetMode || "auto"
    });

    (async () => {
      try {
        const stats = await runAssembler(
          pack_key,
          jobId,
          sourceJobId || "",
          async (stage, progress) => {
            await updateJob(jobId, { stage: stage as ToolJobStage, progress });
          },
          requestedAssetMode
        );

        await updateJob(jobId, {
          status: "complete",
          stage: "cleanup",
          progress: 100,
          output_key: `video-assembler/${jobId}/output.mp4`
        });

        await appendMeta(jobId, {
          render_stats: stats,
          completed_at: new Date().toISOString()
        });

        console.log(`[video-assembler] Job ${jobId} completed successfully`);

      } catch (err: any) {
        console.error(`[video-assembler] Job ${jobId} failed:`, err);
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
    console.error("[video-assembler] Error creating job:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
