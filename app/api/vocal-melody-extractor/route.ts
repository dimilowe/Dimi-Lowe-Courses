import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getAudioInfo, normalizeAudioToWav } from '@/server/lib/audio/ffmpeg';
import { acquireLock, releaseLock } from '@/server/lib/audio/ipRateLimit';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_DURATION_SECONDS = 600;
const PROCESSING_TIMEOUT_MS = 90000;

function cleanupDirectory(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Cleanup error:', e);
  }
}

interface WorkerResult {
  success: boolean;
  result?: {
    midi: string;
    notes: string;
    pitch: string;
    wav: string;
    note_count: number;
    duration: number;
  };
  error?: string;
}

function runPythonWorker(
  inputPath: string,
  outputDir: string,
  timeoutMs: number
): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const workerPath = path.join(process.cwd(), 'python', 'vocal_melody_worker.py');
    
    const proc = spawn('python3.11', [
      workerPath,
      '--input', inputPath,
      '--out', outputDir
    ], {
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          resolve({ success: true, result });
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse worker output' });
        }
      } else {
        let errorMsg = 'Melody extraction failed';
        try {
          const errObj = JSON.parse(stderr.trim());
          if (errObj.error) {
            errorMsg = errObj.error;
          }
        } catch (e) {
          if (stderr) {
            errorMsg = stderr.substring(0, 200);
          }
        }
        resolve({ success: false, error: errorMsg });
      }
    });
    
    proc.on('error', (err) => {
      resolve({ success: false, error: `Worker error: ${err.message}` });
    });
    
    setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ success: false, error: 'Processing timed out. Try a shorter audio file.' });
    }, timeoutMs);
  });
}

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
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
        { error: 'Another extraction is running. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    
    try {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocal-melody-'));
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
      const processingTime = Date.now() - startTime;
      
      if (!workerResult.success) {
        return NextResponse.json(
          { error: workerResult.error || 'Melody extraction failed.' },
          { status: 500 }
        );
      }
      
      const result = workerResult.result!;
      
      const publicDir = path.join(process.cwd(), 'public', 'downloads', 'melody');
      fs.mkdirSync(publicDir, { recursive: true });
      
      const timestamp = Date.now();
      const baseName = path.basename(file.name, ext);
      
      const midiFilename = `${baseName}_melody_${timestamp}.mid`;
      const notesFilename = `${baseName}_notes_${timestamp}.csv`;
      const pitchFilename = `${baseName}_pitch_${timestamp}.csv`;
      const wavFilename = `${baseName}_preview_${timestamp}.wav`;
      
      fs.copyFileSync(
        path.join(outputDir, result.midi),
        path.join(publicDir, midiFilename)
      );
      fs.copyFileSync(
        path.join(outputDir, result.notes),
        path.join(publicDir, notesFilename)
      );
      fs.copyFileSync(
        path.join(outputDir, result.pitch),
        path.join(publicDir, pitchFilename)
      );
      fs.copyFileSync(
        path.join(outputDir, result.wav),
        path.join(publicDir, wavFilename)
      );
      
      setTimeout(() => {
        try {
          const files = [midiFilename, notesFilename, pitchFilename, wavFilename];
          for (const f of files) {
            const filePath = path.join(publicDir, f);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (e) {
          console.error('Scheduled cleanup error:', e);
        }
      }, 2 * 60 * 60 * 1000);
      
      return NextResponse.json({
        midiUrl: `/downloads/melody/${midiFilename}`,
        notesUrl: `/downloads/melody/${notesFilename}`,
        pitchUrl: `/downloads/melody/${pitchFilename}`,
        wavUrl: `/downloads/melody/${wavFilename}`,
        meta: {
          durationSec: result.duration,
          processingMs: processingTime,
          format: ext.replace('.', '').toUpperCase(),
          noteCount: result.note_count
        }
      });
      
    } finally {
      releaseLock(clientIP);
      if (tempDir) {
        cleanupDirectory(tempDir);
      }
    }
    
  } catch (error) {
    console.error('Vocal melody extraction error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
