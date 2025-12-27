import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getAudioInfo, normalizeAudioToWav, cleanupFile, cleanupDirectory } from '@/server/lib/audio/ffmpeg';
import { acquireLock, releaseLock } from '@/server/lib/audio/ipRateLimit';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_DURATION_SECONDS = 600;
const PROCESSING_TIMEOUT_MS = 90000;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

async function runPythonWorker(
  inputPath: string,
  outputDir: string,
  timeoutMs: number
): Promise<{ success: boolean; error?: string; result?: any }> {
  return new Promise((resolve) => {
    const workerPath = path.join(process.cwd(), 'python', 'audio_to_midi_worker.py');
    
    const python = spawn('python3.11', [
      workerPath,
      '--input', inputPath,
      '--out', outputDir
    ]);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      python.kill('SIGKILL');
      resolve({ success: false, error: 'Processing timed out. Try a shorter audio clip.' });
    }, timeoutMs);

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      clearTimeout(timeout);
      
      if (timedOut) return;

      if (code !== 0) {
        console.error('Python worker stderr:', stderr);
        try {
          const result = JSON.parse(stdout.trim().split('\n').pop() || '{}');
          if (result.error) {
            resolve({ success: false, error: result.error });
            return;
          }
        } catch (e) {
        }
        resolve({ success: false, error: 'Transcription failed. Please try a different file.' });
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        
        if (result.error) {
          resolve({ success: false, error: result.error });
        } else {
          resolve({ success: true, result });
        }
      } catch (e) {
        console.error('Failed to parse worker output:', stdout);
        resolve({ success: false, error: 'Failed to process audio file.' });
      }
    });

    python.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Python worker spawn error:', err);
      resolve({ success: false, error: 'Failed to start processing. Please try again.' });
    });
  });
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  let tempDir: string | null = null;
  let uploadPath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/flac',
      'audio/ogg',
      'audio/webm'
    ];
    
    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm'];
    
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload MP3, WAV, M4A, FLAC, or OGG.' },
        { status: 400 }
      );
    }

    if (!acquireLock(clientIP, PROCESSING_TIMEOUT_MS + 10000)) {
      return NextResponse.json(
        { error: 'Another conversion is running. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    try {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-to-midi-'));
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      uploadPath = path.join(tempDir, safeName);
      
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(uploadPath, Buffer.from(arrayBuffer));

      let audioInfo;
      try {
        audioInfo = await getAudioInfo(uploadPath);
      } catch (e) {
        return NextResponse.json(
          { error: 'Could not read audio file. Please check the file is valid.' },
          { status: 400 }
        );
      }

      if (audioInfo.duration > MAX_DURATION_SECONDS) {
        return NextResponse.json(
          { error: `Audio too long. Maximum duration is ${MAX_DURATION_SECONDS / 60} minutes.` },
          { status: 400 }
        );
      }

      const normalizedPath = path.join(tempDir, 'normalized.wav');
      try {
        await normalizeAudioToWav(uploadPath, normalizedPath, 22050);
      } catch (e) {
        console.error('Normalization error:', e);
        return NextResponse.json(
          { error: 'Failed to process audio file. Please try a different format.' },
          { status: 500 }
        );
      }

      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(outputDir, { recursive: true });

      const startTime = Date.now();
      const workerResult = await runPythonWorker(
        normalizedPath,
        outputDir,
        PROCESSING_TIMEOUT_MS
      );
      const processingTime = (Date.now() - startTime) / 1000;

      if (!workerResult.success) {
        return NextResponse.json(
          { error: workerResult.error || 'Transcription failed.' },
          { status: 500 }
        );
      }

      const result = workerResult.result;

      const publicDir = path.join(process.cwd(), 'public', 'downloads', 'midi');
      fs.mkdirSync(publicDir, { recursive: true });

      const timestamp = Date.now();
      const baseName = path.basename(file.name, ext);
      const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);

      const midiFilename = `${safeBaseName}_${timestamp}.mid`;
      const csvFilename = `${safeBaseName}_${timestamp}_notes.csv`;
      const wavFilename = `${safeBaseName}_${timestamp}_sonified.wav`;

      fs.copyFileSync(result.midi_file, path.join(publicDir, midiFilename));
      fs.copyFileSync(result.csv_file, path.join(publicDir, csvFilename));
      fs.copyFileSync(result.wav_file, path.join(publicDir, wavFilename));

      setTimeout(() => {
        try {
          cleanupFile(path.join(publicDir, midiFilename));
          cleanupFile(path.join(publicDir, csvFilename));
          cleanupFile(path.join(publicDir, wavFilename));
        } catch (e) {
        }
      }, 30 * 60 * 1000);

      return NextResponse.json({
        success: true,
        midiUrl: `/downloads/midi/${midiFilename}`,
        csvUrl: `/downloads/midi/${csvFilename}`,
        wavUrl: `/downloads/midi/${wavFilename}`,
        meta: {
          duration: result.duration,
          sampleRate: result.sample_rate,
          notesCount: result.notes_count,
          processingTime: processingTime.toFixed(1),
          originalFilename: file.name
        }
      });

    } finally {
      releaseLock(clientIP);
      
      if (tempDir) {
        try {
          cleanupDirectory(tempDir);
        } catch (e) {
        }
      }
    }

  } catch (error) {
    console.error('Audio to MIDI error:', error);
    releaseLock(clientIP);
    
    if (tempDir) {
      try {
        cleanupDirectory(tempDir);
      } catch (e) {
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
