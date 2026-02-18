import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import crypto from 'crypto';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OpenAI API key is not configured. Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY.'
    );
  }

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

const TAG_CACHE_DIR = '/tmp/producer-tag-cache';
const OUTPUT_DIR = '/tmp/producer-tag-output';

[TAG_CACHE_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const VOICE_MAP: Record<string, string> = {
  'female_soft': 'nova',
  'male_hype': 'onyx',
  'robotic': 'fable',
  'female_warm': 'shimmer',
  'male_deep': 'echo',
  'alloy': 'alloy'
};

export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/ffprobe|cannot find|not found|enoent/i.test(message)) {
          reject(new Error('Audio backend unavailable: ffprobe is missing on this deployment.'));
          return;
        }
        reject(new Error(message || 'Failed to read audio duration.'));
        return;
      }
      else resolve(metadata.format.duration || 0);
    });
  });
}

export async function getOrCreateTagVoice(phrase: string, voiceId: string): Promise<string> {
  const normalized = phrase.trim().toLowerCase();
  const hash = crypto.createHash('sha1').update(`${voiceId}:${normalized}`).digest('hex');
  const cachedPath = path.join(TAG_CACHE_DIR, `${hash}.mp3`);

  if (fs.existsSync(cachedPath)) {
    console.log(`Cache hit for tag: ${phrase}`);
    return cachedPath;
  }

  console.log(`Cache miss for tag: ${phrase}, generating with OpenAI TTS...`);
  
  const voice = VOICE_MAP[voiceId] || 'nova';
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: phrase,
      response_format: 'mp3'
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(cachedPath, buffer);
    console.log(`Generated and cached tag: ${cachedPath}`);
    
    return cachedPath;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to generate custom voice tag');
  }
}

export async function processAudioWithTag(
  inputPath: string,
  tagPath: string,
  intervalSeconds: number = 15,
  tagVolumeDb: number = -5,
  sourceVolumeDb: number = 0
): Promise<string> {
  return processAudioMixInternal(
    inputPath,
    tagPath,
    intervalSeconds,
    tagVolumeDb,
    sourceVolumeDb,
    'output_'
  );
}

export async function processAudioPreviewWithTag(
  inputPath: string,
  tagPath: string,
  intervalSeconds: number = 15,
  tagVolumeDb: number = -5,
  sourceVolumeDb: number = 0,
  previewSeconds: number = 30
): Promise<string> {
  return processAudioMixInternal(
    inputPath,
    tagPath,
    intervalSeconds,
    tagVolumeDb,
    sourceVolumeDb,
    'preview_',
    previewSeconds
  );
}

async function processAudioMixInternal(
  inputPath: string,
  tagPath: string,
  intervalSeconds: number,
  tagVolumeDb: number,
  sourceVolumeDb: number,
  outputPrefix: string,
  maxDurationSeconds?: number
): Promise<string> {
  const finalOutputFilename = `${outputPrefix}${uuidv4()}.mp3`;
  const finalOutputPath = path.join(OUTPUT_DIR, finalOutputFilename);

  const duration = await getAudioDuration(inputPath);
  console.log(`Processing audio: duration=${duration}s, interval=${intervalSeconds}s`);

  const timestamps: number[] = [];
  for (let t = 2; t < duration; t += intervalSeconds) {
    timestamps.push(t);
  }

  if (timestamps.length === 0) {
    timestamps.push(Math.min(2, duration / 2));
  }

  console.log(`Tag timestamps: ${timestamps.join(', ')}`);

  return new Promise((resolve, reject) => {
    const splitOutputs = timestamps.map((_, i) => `[tag${i}]`).join('');
    const delayedLabels = timestamps.map((_, i) => `[delayed${i}]`).join('');
    const tagDelays = timestamps
      .map((ts, i) => {
        const delayMs = Math.floor(ts * 1000);
        return `[tag${i}]adelay=${delayMs}:all=1[delayed${i}]`;
      })
      .join(';');

    // Explicitly split the tag stream before delaying to avoid accidental graph reuse.
    const filterComplex =
      `[0:a]volume=${sourceVolumeDb}dB[source];` +
      `[1:a]volume=${tagVolumeDb}dB,asplit=${timestamps.length}${splitOutputs};` +
      `${tagDelays};` +
      `${delayedLabels}amix=inputs=${timestamps.length}:duration=longest:normalize=0[alltags];` +
      `[source][alltags]amix=inputs=2:duration=first:dropout_transition=2[out]`;

    ffmpeg()
      .input(inputPath)
      .input(tagPath)
      .complexFilter(filterComplex)
      .outputOptions([
        '-map',
        '[out]',
        ...(maxDurationSeconds ? ['-t', String(Math.max(1, Math.floor(maxDurationSeconds)))] : []),
      ])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .output(finalOutputPath)
      .on('start', (cmd) => {
        console.log('FFmpeg started:', cmd);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        const message = err instanceof Error ? err.message : String(err);
        if (/ffmpeg|cannot find|not found|enoent/i.test(message)) {
          reject(new Error('Audio backend unavailable: ffmpeg is missing on this deployment.'));
          return;
        }
        reject(new Error(message || 'Failed to process audio mix.'));
      })
      .on('end', () => {
        console.log('FFmpeg processing complete');
        resolve(finalOutputFilename);
      })
      .run();
  });
}

const DEFAULT_TAG_PHRASES: Record<string, string> = {
  'vcmsuite': 'VCM Suite',
  'vcmsuite_dot_com': 'VCM Suite dot com'
};

export async function getDefaultTagPath(tagName: string): Promise<string> {
  const phrase = DEFAULT_TAG_PHRASES[tagName] || 'VCM Suite';
  return getOrCreateTagVoice(phrase, 'female_soft');
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup file:', error);
  }
}
