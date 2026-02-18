import { existsSync } from 'fs';
import { appendFile, mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';

export const PRODUCER_TAG_UPLOAD_DIR = '/tmp/producer-tag-uploads';
export const PRODUCER_TAG_OUTPUT_DIR = '/tmp/producer-tag-output';
export const PRODUCER_TAG_CHUNK_DIR = '/tmp/producer-tag-upload-chunks';

export const PRODUCER_TAG_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
export const PRODUCER_TAG_MAX_TAG_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const PRODUCER_TAG_CHUNK_SIZE_BYTES = 4 * 1024 * 1024;
export const PRODUCER_TAG_MAX_CHUNK_SIZE_BYTES = PRODUCER_TAG_CHUNK_SIZE_BYTES + 1024;
export const PRODUCER_TAG_MAX_CHUNKS = Math.ceil(
  PRODUCER_TAG_MAX_FILE_SIZE_BYTES / PRODUCER_TAG_CHUNK_SIZE_BYTES
) + 2;

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);

export function isAllowedProducerTagAudioExt(ext: string): boolean {
  return ALLOWED_AUDIO_EXTENSIONS.has(ext.toLowerCase());
}

export function sanitizeProducerTagUploadId(uploadId: string): string | null {
  const trimmed = uploadId.trim();
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function ensureProducerTagDirectories(): Promise<void> {
  for (const dir of [PRODUCER_TAG_UPLOAD_DIR, PRODUCER_TAG_OUTPUT_DIR, PRODUCER_TAG_CHUNK_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

function getChunkPartPath(uploadId: string, chunkIndex: number): string {
  const dir = path.join(PRODUCER_TAG_CHUNK_DIR, uploadId);
  return path.join(dir, `part-${String(chunkIndex).padStart(4, '0')}.bin`);
}

export async function writeProducerTagChunk(params: {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  bytes: Buffer;
}): Promise<void> {
  const uploadDir = path.join(PRODUCER_TAG_CHUNK_DIR, params.uploadId);
  await mkdir(uploadDir, { recursive: true });

  const metadataPath = path.join(uploadDir, 'meta.json');
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        totalChunks: params.totalChunks,
        updatedAt: Date.now(),
      },
      null,
      2
    )
  );

  const partPath = getChunkPartPath(params.uploadId, params.chunkIndex);
  await writeFile(partPath, params.bytes);
}

export async function assembleProducerTagChunks(params: {
  uploadId: string;
  totalChunks: number;
  outputPath: string;
  maxFileBytes: number;
}): Promise<{ bytesWritten: number }> {
  await writeFile(params.outputPath, Buffer.alloc(0));

  let totalBytes = 0;
  for (let i = 0; i < params.totalChunks; i += 1) {
    const chunkPath = getChunkPartPath(params.uploadId, i);
    const chunkBytes = await readFile(chunkPath);
    totalBytes += chunkBytes.length;
    if (totalBytes > params.maxFileBytes) {
      throw new Error('File too large. Maximum size is 200MB.');
    }
    await appendFile(params.outputPath, chunkBytes);
  }

  if (totalBytes <= 0) {
    throw new Error('Uploaded file is empty.');
  }

  return { bytesWritten: totalBytes };
}

export async function cleanupProducerTagChunks(uploadId: string): Promise<void> {
  const dir = path.join(PRODUCER_TAG_CHUNK_DIR, uploadId);
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {}
}
