import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = '/tmp/producer-tag-output';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const safePattern = /^output_[a-zA-Z0-9_-]+\.mp3$/;
    if (!safePattern.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filePath = path.join(OUTPUT_DIR, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

    const stats = await stat(filePath);
    const maxAge = 30 * 60 * 1000;
    if (Date.now() - stats.mtimeMs > maxAge) {
      await unlink(filePath);
      return NextResponse.json(
        { error: 'File has expired. Please generate a new one.' },
        { status: 410 }
      );
    }

    const fileBuffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="tagged_audio.mp3"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
