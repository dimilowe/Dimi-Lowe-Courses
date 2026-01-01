import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob } from "@/lib/toolJobs/toolJobs";
import { putObject } from "@/lib/objectStorage/client";
import { MAX_SIZE_BYTES, TOOL_SLUG } from "@/lib/musicVideoParser/constants";
import { checkRateLimit } from "@/lib/rate-limiter";
import { randomUUID } from "crypto";

const VALID_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function POST(request: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateCheck = checkRateLimit(ip, TOOL_SLUG);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded. Try again later.", resetIn: rateCheck.resetIn },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json({ ok: false, error: "Video file is required" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid file type. Use MP4, MOV, or WebM." },
        { status: 400 }
      );
    }

    if (videoFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File too large. Maximum size is ${MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    const jobId = randomUUID();
    const inputKey = `music-video-parser/${jobId}/input.mp4`;

    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await putObject(inputKey, buffer, videoFile.type);

    await createJob({
      toolSlug: TOOL_SLUG,
      inputKey,
      originalFilename: videoFile.name,
      jobId
    });

    return NextResponse.json({ ok: true, jobId });
  } catch (error: any) {
    console.error("Start job error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to start job" },
      { status: 500 }
    );
  }
}
