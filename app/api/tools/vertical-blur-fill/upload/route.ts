import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { TOOL_SLUG, STORAGE_PREFIX } from "@/lib/verticalBlurFill/constants";
import { getReplitStorageClient } from "@/lib/objectStorage/replitClient";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ ok: false, error: "Please upload a video file" }, { status: 400 });
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: "File too large. Maximum size is 500MB" }, { status: 400 });
    }

    const uploadId = uuidv4();
    const extension = file.name.split(".").pop() || "mp4";
    const storageKey = `${STORAGE_PREFIX}/${uploadId}/input.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await getReplitStorageClient().uploadFromBytes(storageKey, buffer);

    return NextResponse.json({
      ok: true,
      storage_key: storageKey,
      upload_id: uploadId,
      file_size: file.size,
      file_name: file.name
    });

  } catch (err: any) {
    console.error("[vertical-blur-fill] Upload error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err?.message || err)
    }, { status: 500 });
  }
}
