import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processAudioWithTag, getOrCreateTagVoice, getDefaultTagPath, getAudioDuration } from '@/lib/audio-processor';
import {
  PRODUCER_TAG_MAX_CHUNKS,
  PRODUCER_TAG_MAX_FILE_SIZE_BYTES,
  PRODUCER_TAG_MAX_TAG_FILE_SIZE_BYTES,
  PRODUCER_TAG_UPLOAD_DIR,
  PRODUCER_TAG_OUTPUT_DIR,
  assembleProducerTagChunks,
  cleanupProducerTagChunks,
  ensureProducerTagDirectories,
  isAllowedProducerTagAudioExt,
  sanitizeProducerTagUploadId,
} from '@/lib/producerTagUpload';

export const runtime = 'nodejs';
export const maxDuration = 300;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

async function cleanupOldFiles() {
  try {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;
    
    for (const dir of [PRODUCER_TAG_UPLOAD_DIR, PRODUCER_TAG_OUTPUT_DIR]) {
      if (!existsSync(dir)) continue;
      
      const files = await readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stats = await stat(filePath);
          if (now - stats.mtimeMs > maxAge) {
            await unlink(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;
  let uploadedTagFilePath: string | null = null;
  let chunkUploadIdForCleanup: string | null = null;
  
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining } = getRateLimitInfo(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in an hour.' },
        { status: 429 }
      );
    }

    await ensureProducerTagDirectories();
    cleanupOldFiles();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadIdRaw = formData.get('uploadId') as string | null;
    const totalChunksRaw = formData.get('totalChunks') as string | null;
    const uploadName = (formData.get('uploadName') as string | null) || 'uploaded-audio.wav';
    const mode = formData.get('mode') as string || 'custom';
    const defaultTag = formData.get('defaultTag') as string || 'vcmsuite';
    let intervalSeconds = parseInt(formData.get('intervalSeconds') as string || '15', 10);
    let tagVolumeDb = parseInt(formData.get('tagVolumeDb') as string || '-3', 10);
    let sourceVolumeDb = parseInt(formData.get('sourceVolumeDb') as string || '0', 10);

    if (isNaN(intervalSeconds) || intervalSeconds < 5 || intervalSeconds > 60) {
      intervalSeconds = 15;
    }
    if (isNaN(tagVolumeDb) || tagVolumeDb < -20 || tagVolumeDb > 6) {
      tagVolumeDb = -3;
    }
    if (isNaN(sourceVolumeDb) || sourceVolumeDb < -20 || sourceVolumeDb > 6) {
      sourceVolumeDb = 0;
    }
    const phrase = formData.get('phrase') as string || '';
    const voiceId = formData.get('voiceId') as string || 'female_soft';
    const tagFile = formData.get('tagFile') as File | null;

    if (!file && !uploadIdRaw) {
      return NextResponse.json(
        { error: 'No audio file provided.' },
        { status: 400 }
      );
    }

    let ext = '';
    if (file) {
      if (file.size > PRODUCER_TAG_MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 200MB.' },
          { status: 400 }
        );
      }

      ext = path.extname(file.name).toLowerCase();
      if (!isAllowedProducerTagAudioExt(ext)) {
        return NextResponse.json(
          { error: 'Invalid file type. Main track must be MP3, WAV, or M4A.' },
          { status: 400 }
        );
      }
    } else {
      const uploadId = sanitizeProducerTagUploadId(uploadIdRaw || '');
      const totalChunks = parseInt(totalChunksRaw || '', 10);
      ext = path.extname(uploadName).toLowerCase();
      if (!uploadId) {
        return NextResponse.json(
          { error: 'Invalid upload id.' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(totalChunks) || totalChunks <= 0 || totalChunks > PRODUCER_TAG_MAX_CHUNKS) {
        return NextResponse.json(
          { error: 'Invalid chunk count.' },
          { status: 400 }
        );
      }
      if (!isAllowedProducerTagAudioExt(ext)) {
        return NextResponse.json(
          { error: 'Invalid file type. Main track must be MP3, WAV, or M4A.' },
          { status: 400 }
        );
      }
      chunkUploadIdForCleanup = uploadId;
    }

    if (mode === 'custom') {
      if (!phrase || phrase.trim().length === 0) {
        return NextResponse.json(
          { error: 'Custom phrase is required for custom mode' },
          { status: 400 }
        );
      }
      if (phrase.length > 100) {
        return NextResponse.json(
          { error: 'Phrase is too long. Maximum 100 characters.' },
          { status: 400 }
        );
      }
    } else if (mode === 'upload') {
      if (!tagFile) {
        return NextResponse.json(
          { error: 'Please upload a tag snippet (MP3, WAV, or M4A).' },
          { status: 400 }
        );
      }
      const tagExt = path.extname(tagFile.name).toLowerCase();
      if (!isAllowedProducerTagAudioExt(tagExt)) {
        return NextResponse.json(
          { error: 'Tag snippet must be MP3, WAV, or M4A.' },
          { status: 400 }
        );
      }
      if (tagFile.size > PRODUCER_TAG_MAX_TAG_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'Tag snippet is too large. Max size is 10MB.' },
          { status: 400 }
        );
      }
    } else if (mode !== 'default') {
      return NextResponse.json(
        { error: 'Invalid tag mode.' },
        { status: 400 }
      );
    }

    const uploadId = uuidv4();
    uploadedFilePath = path.join(PRODUCER_TAG_UPLOAD_DIR, `${uploadId}${ext}`);

    if (file) {
      const bytes = await file.arrayBuffer();
      await writeFile(uploadedFilePath, Buffer.from(bytes));
    } else if (chunkUploadIdForCleanup) {
      await assembleProducerTagChunks({
        uploadId: chunkUploadIdForCleanup,
        totalChunks: parseInt(totalChunksRaw || '0', 10),
        outputPath: uploadedFilePath,
        maxFileBytes: PRODUCER_TAG_MAX_FILE_SIZE_BYTES,
      });
    }
    console.log(`File uploaded: ${uploadedFilePath}`);

    let tagPath: string;
    
    if (mode === 'custom') {
      console.log(`Generating custom tag: "${phrase}" with voice: ${voiceId}`);
      tagPath = await getOrCreateTagVoice(phrase, voiceId);
    } else if (mode === 'upload') {
      const tagExt = path.extname(tagFile!.name).toLowerCase();
      uploadedTagFilePath = path.join(PRODUCER_TAG_UPLOAD_DIR, `${uploadId}_tag${tagExt}`);
      const tagBytes = await tagFile!.arrayBuffer();
      await writeFile(uploadedTagFilePath, Buffer.from(tagBytes));

      const tagDuration = await getAudioDuration(uploadedTagFilePath);
      if (!Number.isFinite(tagDuration) || tagDuration <= 0) {
        throw new Error('Tag snippet could not be decoded.');
      }
      if (tagDuration > 12) {
        throw new Error('Tag snippet is too long. Keep it under 12 seconds.');
      }

      console.log(`Using uploaded tag snippet: ${uploadedTagFilePath} (${tagDuration.toFixed(2)}s)`);
      tagPath = uploadedTagFilePath;
    } else {
      console.log(`Using legacy default tag: ${defaultTag}`);
      tagPath = await getDefaultTagPath(defaultTag);
    }

    console.log(`Processing audio with tag: ${tagPath}`);
    const outputFilename = await processAudioWithTag(
      uploadedFilePath,
      tagPath,
      intervalSeconds,
      tagVolumeDb,
      sourceVolumeDb
    );

    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch {}
    }
    if (uploadedTagFilePath) {
      try {
        await unlink(uploadedTagFilePath);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/producer-tag/download/${outputFilename}`,
      remaining
    });

  } catch (error) {
    console.error('Producer tag processing error:', error);
    
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch {}
    }
    if (uploadedTagFilePath) {
      try {
        await unlink(uploadedTagFilePath);
      } catch {}
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audio processing failed. Please try again.' },
      { status: 500 }
    );
  } finally {
    if (chunkUploadIdForCleanup) {
      await cleanupProducerTagChunks(chunkUploadIdForCleanup);
    }
  }
}
