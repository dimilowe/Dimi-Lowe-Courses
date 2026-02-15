import { NextRequest, NextResponse } from "next/server";
import { Client } from "@replit/object-storage";
import { readFile } from "fs/promises";
import path from "path";
import { Buffer } from "buffer";

const LOCAL_WORKSPACE_UPLOAD_DIR = path.join(process.cwd(), "tmp", "workspace-uploads");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename: rawFilename } = await params;
    const filename = path.basename(rawFilename);
    
    const storage = new Client();
    let result: Awaited<ReturnType<Client["downloadAsBytes"]>> | null = null;
    let downloadThrown: unknown = null;
    try {
      result = await storage.downloadAsBytes(filename);
    } catch (err) {
      downloadThrown = err;
    }
    
    let responseBuffer: Buffer | null = null;
    if (result?.ok) {
      const bufferData = result.value;
      const buffer = Array.isArray(bufferData) ? bufferData[0] : bufferData;
      responseBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
    } else {
      // Local dev fallback: read file previously saved by workspace upload route.
      try {
        const localPath = path.join(LOCAL_WORKSPACE_UPLOAD_DIR, filename);
        responseBuffer = await readFile(localPath);
      } catch {
        console.error("File download error:", result?.error ?? downloadThrown);
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    };
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
    
    const arrayBuffer = responseBuffer.buffer.slice(
      responseBuffer.byteOffset,
      responseBuffer.byteOffset + responseBuffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
