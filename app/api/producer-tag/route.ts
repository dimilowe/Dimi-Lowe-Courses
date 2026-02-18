import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processAudioWithTag, getOrCreateTagVoice, getDefaultTagPath, getAudioDuration } from '@/lib/audio-processor';

const UPLOAD_DIR = '/tmp/producer-tag-uploads';
const OUTPUT_DIR = '/tmp/producer-tag-output';
const MAX_FILE_SIZE = 200 * 1024 * 1024;
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

async function ensureDirectories() {
  for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

async function cleanupOldFiles() {
  try {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;
    
    for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
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
  
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining } = getRateLimitInfo(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in an hour.' },
        { status: 429 }
      );
    }

    await ensureDirectories();
    cleanupOldFiles();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
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

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 200MB.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!['.mp3', '.wav'].includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3 and WAV files are supported.' },
        { status: 400 }
      );
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
          { error: 'Please upload a tag snippet (MP3 or WAV).' },
          { status: 400 }
        );
      }
      const tagExt = path.extname(tagFile.name).toLowerCase();
      if (!['.mp3', '.wav'].includes(tagExt)) {
        return NextResponse.json(
          { error: 'Tag snippet must be MP3 or WAV.' },
          { status: 400 }
        );
      }
      if (tagFile.size > 10 * 1024 * 1024) {
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
    uploadedFilePath = path.join(UPLOAD_DIR, `${uploadId}${ext}`);
    
    const bytes = await file.arrayBuffer();
    await writeFile(uploadedFilePath, Buffer.from(bytes));
    console.log(`File uploaded: ${uploadedFilePath}`);

    let tagPath: string;
    
    if (mode === 'custom') {
      console.log(`Generating custom tag: "${phrase}" with voice: ${voiceId}`);
      tagPath = await getOrCreateTagVoice(phrase, voiceId);
    } else if (mode === 'upload') {
      const tagExt = path.extname(tagFile!.name).toLowerCase();
      uploadedTagFilePath = path.join(UPLOAD_DIR, `${uploadId}_tag${tagExt}`);
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
  }
}
