import { NextRequest, NextResponse } from 'next/server';
import {
  PRODUCER_TAG_MAX_CHUNK_SIZE_BYTES,
  PRODUCER_TAG_MAX_CHUNKS,
  ensureProducerTagDirectories,
  sanitizeProducerTagUploadId,
  writeProducerTagChunk,
} from '@/lib/producerTagUpload';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function PUT(request: NextRequest) {
  try {
    await ensureProducerTagDirectories();

    const uploadIdRaw = request.nextUrl.searchParams.get('uploadId') || '';
    const chunkIndexRaw = request.nextUrl.searchParams.get('index') || '';
    const totalChunksRaw = request.nextUrl.searchParams.get('total') || '';

    const uploadId = sanitizeProducerTagUploadId(uploadIdRaw);
    const chunkIndex = parseInt(chunkIndexRaw, 10);
    const totalChunks = parseInt(totalChunksRaw, 10);

    if (!uploadId) {
      return NextResponse.json({ error: 'Invalid upload id.' }, { status: 400 });
    }
    if (!Number.isFinite(chunkIndex) || chunkIndex < 0 || chunkIndex >= PRODUCER_TAG_MAX_CHUNKS) {
      return NextResponse.json({ error: 'Invalid chunk index.' }, { status: 400 });
    }
    if (!Number.isFinite(totalChunks) || totalChunks <= 0 || totalChunks > PRODUCER_TAG_MAX_CHUNKS) {
      return NextResponse.json({ error: 'Invalid total chunks.' }, { status: 400 });
    }
    if (chunkIndex >= totalChunks) {
      return NextResponse.json({ error: 'Chunk index exceeds total chunks.' }, { status: 400 });
    }

    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length <= 0) {
      return NextResponse.json({ error: 'Chunk is empty.' }, { status: 400 });
    }
    if (bytes.length > PRODUCER_TAG_MAX_CHUNK_SIZE_BYTES) {
      return NextResponse.json({ error: 'Chunk too large.' }, { status: 400 });
    }

    await writeProducerTagChunk({
      uploadId,
      chunkIndex,
      totalChunks,
      bytes,
    });

    return NextResponse.json({ ok: true, uploadId, chunkIndex, totalChunks });
  } catch (error) {
    console.error('Producer tag chunk upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload chunk.' },
      { status: 500 }
    );
  }
}
