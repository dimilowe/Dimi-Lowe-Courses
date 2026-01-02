import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG } from "@/lib/motionCompiler/constants";
import { 
  loadManifest, 
  updateBeat, 
  advanceToBeat, 
  appendLog,
  getBeatPath,
  updateManifestStatus
} from "@/lib/motionCompiler/manifest";
import { extractBoundaryFrames } from "@/lib/motionCompiler/boundary";
import { validateBeatBoundary, saveValidationReport, handleValidationResult } from "@/lib/motionCompiler/validation";
import { generateRenderPacket } from "@/lib/motionCompiler/packet";
import { Client } from "@replit/object-storage";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const client = new Client();

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const beatIndexStr = formData.get("beatIndex") as string;
    const clipFile = formData.get("clip") as File | null;

    if (!jobId) {
      return NextResponse.json({
        ok: false,
        error: "jobId is required"
      }, { status: 400 });
    }

    if (!clipFile) {
      return NextResponse.json({
        ok: false,
        error: "clip file is required (mp4 only)"
      }, { status: 400 });
    }

    if (!clipFile.type.includes("video/mp4") && !clipFile.name.endsWith(".mp4")) {
      return NextResponse.json({
        ok: false,
        error: "Only MP4 files are accepted"
      }, { status: 400 });
    }

    const manifest = await loadManifest(jobId);
    if (!manifest) {
      return NextResponse.json({
        ok: false,
        error: "Job not found"
      }, { status: 404 });
    }

    if (manifest.status === "halted") {
      return NextResponse.json({
        ok: false,
        error: "Job is halted due to validation failure. Cannot upload more clips."
      }, { status: 400 });
    }

    const beatIndex = beatIndexStr !== null 
      ? parseInt(beatIndexStr, 10) 
      : manifest.current_beat_index;

    if (beatIndex < 0 || beatIndex >= manifest.beats.length) {
      return NextResponse.json({
        ok: false,
        error: `Invalid beat index: ${beatIndex}`
      }, { status: 400 });
    }

    const beat = manifest.beats[beatIndex];

    if (beat.status !== "WAITING_UPLOAD" && beat.status !== "PENDING") {
      return NextResponse.json({
        ok: false,
        error: `Beat ${beat.id} is not awaiting upload. Status: ${beat.status}`
      }, { status: 400 });
    }

    await updateBeat(jobId, beatIndex, { status: "PROCESSING" });
    await updateManifestStatus(jobId, "processing");
    await appendLog(jobId, "info", "uploadBeat", `Received clip for ${beat.id}`, {
      filename: clipFile.name,
      size: clipFile.size
    });

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-"));
    const tmpClipPath = path.join(tmpDir, "clip.mp4");
    
    try {
      const clipBuffer = Buffer.from(await clipFile.arrayBuffer());
      await fs.writeFile(tmpClipPath, clipBuffer);

      const boundaryResult = await extractBoundaryFrames(jobId, beat.id, tmpClipPath);

      if (!boundaryResult.success) {
        await updateBeat(jobId, beatIndex, { 
          status: "WAITING_UPLOAD",
          error: boundaryResult.error
        });
        await updateManifestStatus(jobId, "waiting_upload");
        
        return NextResponse.json({
          ok: false,
          error: `Boundary extraction failed: ${boundaryResult.error}`,
          can_retry: true
        }, { status: 400 });
      }

      const beatPath = getBeatPath(jobId, beat.id);
      const clipStoragePath = `${beatPath}/clip.mp4`;
      await client.uploadFromBytes(clipStoragePath, clipBuffer);

      await updateBeat(jobId, beatIndex, {
        clip_path: clipStoragePath,
        boundary_start: {
          frame_path: boundaryResult.start_frame_path,
          state: boundaryResult.start_state,
          hold_duration: beat.boundary_start?.hold_duration || 0.2
        },
        boundary_end: {
          frame_path: boundaryResult.end_frame_path,
          state: boundaryResult.end_state
        }
      });

      const updatedManifest = await loadManifest(jobId);
      if (!updatedManifest) {
        throw new Error("Failed to reload manifest");
      }

      const validationReport = await validateBeatBoundary(
        jobId,
        beatIndex,
        boundaryResult.start_state!,
        updatedManifest
      );

      await saveValidationReport(jobId, beat.id, validationReport);

      const { shouldContinue, halted } = await handleValidationResult(
        jobId,
        beatIndex,
        validationReport
      );

      if (halted) {
        return NextResponse.json({
          ok: false,
          halted: true,
          error: `Beat ${beat.id} failed validation after max attempts`,
          validation_report: validationReport
        }, { status: 400 });
      }

      if (!shouldContinue) {
        // Reload manifest to get updated attempts count after handleValidationResult
        const latestManifest = await loadManifest(jobId);
        const updatedBeat = latestManifest?.beats[beatIndex];
        const attemptsRemaining = updatedBeat 
          ? updatedBeat.max_attempts - updatedBeat.attempts 
          : 0;
        
        return NextResponse.json({
          ok: false,
          validation_failed: true,
          can_retry: attemptsRemaining > 0,
          attempts_remaining: attemptsRemaining,
          validation_report: validationReport,
          message: `Beat ${beat.id} failed validation. Please upload a new clip that matches boundary requirements.`
        });
      }

      const nextBeatIndex = beatIndex + 1;
      await advanceToBeat(jobId, nextBeatIndex);

      const finalManifest = await loadManifest(jobId);

      let nextPacket = null;
      if (nextBeatIndex < (finalManifest?.beats.length || 0)) {
        nextPacket = await generateRenderPacket(jobId, nextBeatIndex);
      }

      return NextResponse.json({
        ok: true,
        beat_id: beat.id,
        beat_index: beatIndex,
        validation_passed: true,
        validation_report: validationReport,
        boundary_extracted: {
          start_frame: boundaryResult.start_frame_path,
          end_frame: boundaryResult.end_frame_path,
          duration: boundaryResult.duration
        },
        next_beat_index: nextBeatIndex < (finalManifest?.beats.length || 0) ? nextBeatIndex : null,
        next_packet: nextPacket,
        can_finalize: nextBeatIndex >= (finalManifest?.beats.length || 0),
        status: finalManifest?.status
      });

    } finally {
      try {
        await fs.rm(tmpDir, { recursive: true });
      } catch {}
    }

  } catch (err: any) {
    console.error("[vcm-motion-compiler] Upload error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
