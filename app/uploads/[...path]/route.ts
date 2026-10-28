import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, sep } from "path";
import { lookup } from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    // Normalize the requested path to prevent directory traversal
    const requestedPath = normalize(join(...path));

    // Security: ensure the path doesn't try to escape the uploads directory
    if (requestedPath.includes('..') || requestedPath.startsWith(sep)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadsDir, requestedPath);

    // Double-check that the resolved path is still within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const fileBuffer = await readFile(filePath);
    const mimeType = lookup(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
