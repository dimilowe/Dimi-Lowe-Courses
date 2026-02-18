import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getAudioInfo, normalizeAudioToWav } from '@/server/lib/audio/ffmpeg';
import { acquireLock, releaseLock } from '@/server/lib/audio/ipRateLimit';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_DURATION_SECONDS = 600;
const PROCESSING_TIMEOUT_MS = 120000;

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

function isRetryableSpawnFailure(err: NodeJS.ErrnoException): boolean {
  const code = typeof err.code === 'string' ? err.code.toUpperCase() : '';
  const message = String(err.message || '').toLowerCase();
  const errno = typeof err.errno === 'number' ? err.errno : null;
  return (
    code === 'ENOENT' ||
    code === 'ENOEXEC' ||
    code === 'EACCES' ||
    code === 'EPERM' ||
    errno === -86 ||
    message.includes('unknown system error -86') ||
    message.includes('bad cpu type in executable') ||
    message.includes('exec format error')
  );
}

function runPythonWorker(
  inputPath: string,
  outputDir: string,
  timeoutMs: number
): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const workerPath = path.join(process.cwd(), 'python', 'vocal_melody_worker.py');
    let lastSpawnError = '';

    const pythonCandidates = Array.from(
      new Set(
        [
          process.env.PYTHON_BIN,
          process.env.PYTHON_PATH,
          '/usr/bin/python3',
          '/opt/homebrew/bin/python3',
          '/usr/local/bin/python3',
          'python3.11',
          'python3',
          'python'
        ].filter(Boolean)
      )
    ) as string[];

    const trySpawn = (candidateIndex: number) => {
      if (candidateIndex >= pythonCandidates.length) {
        resolve({
          success: false,
          error:
            lastSpawnError ||
            'No compatible Python runtime found. Set PYTHON_BIN=/usr/bin/python3 (or another working python3 path).'
        });
        return;
      }

      const pythonCmd = pythonCandidates[candidateIndex];
      let proc;
      try {
        proc = spawn(
          pythonCmd,
          [workerPath, '--input', inputPath, '--out', outputDir],
          { stdio: ['ignore', 'pipe', 'pipe'] }
        );
      } catch (rawErr) {
        const err = rawErr as NodeJS.ErrnoException;
        lastSpawnError = `Python spawn failed for "${pythonCmd}": ${err.message}`;
        if (isRetryableSpawnFailure(err)) {
          trySpawn(candidateIndex + 1);
          return;
        }
        resolve({ success: false, error: lastSpawnError });
        return;
      }

      let settled = false;
      let stdout = '';
      let stderr = '';

      const finish = (result: WorkerResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(result);
      };

      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        finish({ success: false, error: 'Processing timed out. Try a shorter audio file.' });
      }, timeoutMs);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (settled) return;
        if (code === 0) {
          try {
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);
            finish({ success: true, result });
          } catch (e) {
            console.error('Worker stdout:', stdout);
            finish({ success: false, error: 'Failed to parse worker output' });
          }
          return;
        }

        let errorMsg = 'Melody extraction failed';
        const cleanStderr = stderr
          .split('\n')
          .filter((line) => !line.startsWith('WARNING:'))
          .join('\n')
          .trim();
        try {
          const errObj = JSON.parse(cleanStderr || stderr.trim());
          if (errObj.error) errorMsg = errObj.error;
        } catch (e) {
          if (cleanStderr) errorMsg = cleanStderr.substring(0, 200);
        }
        console.error('vocal-melody worker stderr:', stderr);
        finish({ success: false, error: errorMsg });
      });

      proc.on('error', (err) => {
        const typedErr = err as NodeJS.ErrnoException;
        lastSpawnError = `Python spawn failed for "${pythonCmd}": ${typedErr.message}`;
        if (isRetryableSpawnFailure(typedErr)) {
          clearTimeout(timeoutId);
          trySpawn(candidateIndex + 1);
          return;
        }
        finish({ success: false, error: `Worker error: ${typedErr.message}` });
      });
    };

    trySpawn(0);
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
        { error: 'File too large. Maximum size is 200MB.' },
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
