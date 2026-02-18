import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getAudioDuration,
  getDefaultTagPath,
  getOrCreateTagVoice,
  processAudioPreviewWithTag,
} from '@/lib/audio-processor';
import {
  PRODUCER_TAG_MAX_FILE_SIZE_BYTES,
  PRODUCER_TAG_MAX_TAG_FILE_SIZE_BYTES,
  PRODUCER_TAG_OUTPUT_DIR,
  PRODUCER_TAG_UPLOAD_DIR,
  ensureProducerTagDirectories,
  isAllowedProducerTagAudioExt,
} from '@/lib/producerTagUpload';

const PREVIEW_SECONDS = 30;
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;
  let uploadedTagFilePath: string | null = null;
  let previewPath: string | null = null;

  try {
    await ensureProducerTagDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string || 'custom';
    const defaultTag = formData.get('defaultTag') as string || 'vcmsuite';
    const phrase = formData.get('phrase') as string || '';
    const voiceId = formData.get('voiceId') as string || 'female_soft';
    const tagFile = formData.get('tagFile') as File | null;
    let intervalSeconds = parseInt(formData.get('intervalSeconds') as string || '15', 10);
    let tagVolumeDb = parseInt(formData.get('tagVolumeDb') as string || '-3', 10);
    let sourceVolumeDb = parseInt(formData.get('sourceVolumeDb') as string || '0', 10);

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (file.size > PRODUCER_TAG_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 200MB.' }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!isAllowedProducerTagAudioExt(ext)) {
      return NextResponse.json({ error: 'Invalid file type. Main track must be MP3, WAV, or M4A.' }, { status: 400 });
    }

    if (isNaN(intervalSeconds) || intervalSeconds < 5 || intervalSeconds > 60) intervalSeconds = 15;
    if (isNaN(tagVolumeDb) || tagVolumeDb < -20 || tagVolumeDb > 6) tagVolumeDb = -3;
    if (isNaN(sourceVolumeDb) || sourceVolumeDb < -20 || sourceVolumeDb > 6) sourceVolumeDb = 0;

    if (mode === 'custom') {
      if (!phrase || !phrase.trim()) {
        return NextResponse.json({ error: 'Custom phrase is required for custom mode' }, { status: 400 });
      }
      if (phrase.length > 100) {
        return NextResponse.json({ error: 'Phrase is too long. Maximum 100 characters.' }, { status: 400 });
      }
    } else if (mode === 'upload') {
      if (!tagFile) {
        return NextResponse.json({ error: 'Please upload a tag snippet (MP3, WAV, or M4A).' }, { status: 400 });
      }
      const tagExt = path.extname(tagFile.name).toLowerCase();
      if (!isAllowedProducerTagAudioExt(tagExt)) {
        return NextResponse.json({ error: 'Tag snippet must be MP3, WAV, or M4A.' }, { status: 400 });
      }
      if (tagFile.size > PRODUCER_TAG_MAX_TAG_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'Tag snippet is too large. Max size is 10MB.' }, { status: 400 });
      }
    } else if (mode !== 'default') {
      return NextResponse.json({ error: 'Invalid tag mode.' }, { status: 400 });
    }

    const uploadId = uuidv4();
    uploadedFilePath = path.join(PRODUCER_TAG_UPLOAD_DIR, `${uploadId}${ext}`);
    await writeFile(uploadedFilePath, Buffer.from(await file.arrayBuffer()));

    let tagPath: string;
    if (mode === 'custom') {
      tagPath = await getOrCreateTagVoice(phrase, voiceId);
    } else if (mode === 'upload') {
      const tagExt = path.extname(tagFile!.name).toLowerCase();
      uploadedTagFilePath = path.join(PRODUCER_TAG_UPLOAD_DIR, `${uploadId}_tag${tagExt}`);
      await writeFile(uploadedTagFilePath, Buffer.from(await tagFile!.arrayBuffer()));

      const tagDuration = await getAudioDuration(uploadedTagFilePath);
      if (!Number.isFinite(tagDuration) || tagDuration <= 0) {
        throw new Error('Tag snippet could not be decoded.');
      }
      if (tagDuration > 12) {
        throw new Error('Tag snippet is too long. Keep it under 12 seconds.');
      }

      tagPath = uploadedTagFilePath;
    } else {
      tagPath = await getDefaultTagPath(defaultTag);
    }

    const previewFilename = await processAudioPreviewWithTag(
      uploadedFilePath,
      tagPath,
      intervalSeconds,
      tagVolumeDb,
      sourceVolumeDb,
      PREVIEW_SECONDS
    );
    previewPath = path.join(PRODUCER_TAG_OUTPUT_DIR, previewFilename);
    const previewBuffer = await readFile(previewPath);

    return new NextResponse(new Uint8Array(previewBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'X-Preview-Seconds': String(PREVIEW_SECONDS),
      },
    });
  } catch (error) {
    console.error('Mix preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate mix preview' },
      { status: 500 }
    );
  } finally {
    for (const p of [uploadedFilePath, uploadedTagFilePath, previewPath]) {
      if (!p) continue;
      try {
        await unlink(p);
      } catch {}
    }
  }
}
