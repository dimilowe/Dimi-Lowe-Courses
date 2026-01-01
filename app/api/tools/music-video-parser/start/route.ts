import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { createJob } from "@/lib/toolJobs/toolJobs";
import { generateUploadUrl } from "@/lib/objectStorage/client";
import { MAX_SIZE_BYTES, TOOL_SLUG } from "@/lib/musicVideoParser/constants";
import { checkRateLimit } from "@/lib/rate-limiter";
import { randomUUID } from "crypto";

const VALID_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface StartRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

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
    const body: StartRequest = await request.json();
    const { filename, contentType, sizeBytes } = body;

    if (!filename || !contentType || typeof sizeBytes !== "number") {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: filename, contentType, sizeBytes" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(contentType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid file type. Use MP4, MOV, or WebM." },
        { status: 400 }
      );
    }

    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File too large. Maximum size is ${Math.round(MAX_SIZE_BYTES / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    const jobId = randomUUID();
    const inputKey = `music-video-parser/${jobId}/input.mp4`;

    const uploadUrl = await generateUploadUrl(inputKey, contentType, 15);

    await createJob({
      toolSlug: TOOL_SLUG,
      inputKey,
      originalFilename: filename,
      jobId
    });

    return NextResponse.json({
      ok: true,
      jobId,
      upload: {
        key: inputKey,
        method: uploadUrl.method,
        url: uploadUrl.url,
        headers: uploadUrl.headers
      }
    });
  } catch (error: any) {
    console.error("Start job error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to start job" },
      { status: 500 }
    );
  }
}
