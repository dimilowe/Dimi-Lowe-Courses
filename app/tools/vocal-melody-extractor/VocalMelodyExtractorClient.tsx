'use client';

import { useState, useCallback } from 'react';
import { Upload, Music, FileText, AudioLines, Download, Loader2, AlertCircle, CheckCircle2, X, Lightbulb } from 'lucide-react';

type ProcessingState = 'idle' | 'uploading' | 'transcribing' | 'cleaning' | 'done' | 'error';
const REQUEST_TIMEOUT_MS = 130000;
const MAX_UPLOAD_MB = 30;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

interface ExtractResult {
  midiUrl: string;
  notesUrl: string;
  pitchUrl: string;
  wavUrl: string;
  meta: {
    durationSec: number;
    processingMs: number;
    format: string;
    noteCount: number;
  };
}

interface ApiResponseData {
  [key: string]: unknown;
  error?: string;
}

function sanitizeUploadFilename(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const hasExt = lastDot > 0 && lastDot < name.length - 1;
  const base = hasExt ? name.slice(0, lastDot) : 'upload';
  const ext = hasExt ? name.slice(lastDot).toLowerCase() : '.wav';
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 64) || 'upload';
  const safeExt = ext.replace(/[^a-z0-9.]/g, '') || '.wav';
  return `${safeBase}${safeExt}`;
}

function createUploadFormData(file: File): FormData {
  const formData = new FormData();
  const safeFilename = sanitizeUploadFilename(file.name);
  const blob = file.slice(0, file.size, file.type || 'application/octet-stream');
  formData.append('file', blob, safeFilename);
  return formData;
}

function postWithXhr(file: File): Promise<{ ok: boolean; status: number; data: ApiResponseData }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/vocal-melody-extractor');
    xhr.timeout = REQUEST_TIMEOUT_MS;

    xhr.onload = () => {
      const contentType = (xhr.getResponseHeader('content-type') || '').toLowerCase();
      let data: ApiResponseData = {};
      const raw = xhr.responseText || '';
      const isLikelyJson = contentType.includes('application/json') || raw.trim().startsWith('{');
      if (isLikelyJson) {
        try {
          data = JSON.parse(raw) as ApiResponseData;
        } catch {
          data = { error: `Server returned invalid JSON (HTTP ${xhr.status}).` };
        }
      } else {
        if (xhr.status === 413) {
          data = { error: `Upload too large for production gateway. Please use a file under ${MAX_UPLOAD_MB}MB.` };
        } else {
          data = {
            error: `Server returned an unexpected response format (HTTP ${xhr.status}).`
          };
        }
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data
      });
    };

    xhr.onerror = () => reject(new Error('Upload failed. Please check your connection and try again.'));
    xhr.ontimeout = () => reject(new DOMException('Upload timed out', 'AbortError'));
    xhr.send(createUploadFormData(file));
  });
}

async function parseApiResponse(response: Response): Promise<{ ok: boolean; status: number; data: ApiResponseData }> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const raw = await response.text();
  const isLikelyJson = contentType.includes('application/json') || raw.trim().startsWith('{');

  if (isLikelyJson) {
    try {
      return {
        ok: response.ok,
        status: response.status,
        data: JSON.parse(raw) as ApiResponseData
      };
    } catch {
      return {
        ok: response.ok,
        status: response.status,
        data: { error: `Server returned invalid JSON (HTTP ${response.status}).` }
      };
    }
  }

  if (response.status === 413) {
    return {
      ok: response.ok,
      status: response.status,
      data: { error: `Upload too large for production gateway. Please use a file under ${MAX_UPLOAD_MB}MB.` }
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data: { error: `Server returned an unexpected response format (HTTP ${response.status}).` }
  };
}

function shouldForceXhrUpload(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(window.location.search).get('forceUpload');
  return forced?.toLowerCase() === 'xhr';
}

export default function VocalMelodyExtractorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (f: File) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/ogg'];
    const allowedExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
    const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      setError('Please upload an MP3, WAV, M4A, FLAC, or OGG file.');
      return;
    }
    
    if (f.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_UPLOAD_MB}MB.`);
      return;
    }
    
    setFile(f);
    setError(null);
    setResult(null);
    setState('idle');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    
    setError(null);
    setState('uploading');
    
    try {
      setState('transcribing');

      let ok = false;
      let data: ApiResponseData = {};

      if (shouldForceXhrUpload()) {
        const fallback = await postWithXhr(file);
        ok = fallback.ok;
        data = fallback.data;
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          let response: Response;
          try {
            response = await fetch('/api/vocal-melody-extractor', {
              method: 'POST',
              body: createUploadFormData(file),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }
          const parsed = await parseApiResponse(response);
          ok = parsed.ok;
          data = parsed.data;
        } catch (fetchErr) {
          const message = fetchErr instanceof Error ? fetchErr.message : '';
          if (/did not match the expected pattern/i.test(message)) {
            const fallback = await postWithXhr(file);
            ok = fallback.ok;
            data = fallback.data;
          } else {
            throw fetchErr;
          }
        }
      }

      setState('cleaning');

      if (!ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Extraction failed');
      }

      setResult(data as unknown as ExtractResult);
      setState('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Processing timed out. Please try a shorter clip or a cleaner vocal file.');
      } else {
        const message = err instanceof Error ? err.message : 'An error occurred';
        if (/did not match the expected pattern/i.test(message)) {
          setError('Upload failed due to a Safari request-format issue. Please retry once or use Chrome while we continue hardening this path.');
        } else {
          setError(message);
        }
      }
      setState('error');
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setState('idle');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {state === 'idle' && !result && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".mp3,.wav,.m4a,.flac,.ogg"
            onChange={handleFileChange}
          />
          
          {!file ? (
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drop a clean vocal or acapella</p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400">MP3, WAV, M4A, FLAC, OGG (max 30MB, 10 min)</p>
            </label>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Music className="w-8 h-8 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <button
                onClick={handleExtract}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Extract Melody
              </button>
            </div>
          )}
        </div>
      )}

      {(state === 'uploading' || state === 'transcribing' || state === 'cleaning') && (
        <div className="border rounded-xl p-8 text-center bg-gray-50">
          <Loader2 className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {state === 'uploading' && 'Uploading...'}
            {state === 'transcribing' && 'Analyzing vocal melody...'}
            {state === 'cleaning' && 'Extracting monophonic melody...'}
          </p>
          <p className="text-sm text-gray-500">This usually finishes in under 2 minutes for supported files</p>
        </div>
      )}

      {state === 'error' && (
        <div className="border border-red-200 rounded-xl p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 mb-1">Extraction Failed</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={resetForm}
                className="text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {state === 'done' && result && (
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="font-semibold text-gray-800">Melody Extracted Successfully</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href={result.midiUrl}
              download
              data-track-output="true"
              data-output-url={result.midiUrl}
              data-output-name="vocal-melody.mid"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Melody MIDI
            </a>
            <a
              href={result.notesUrl}
              download
              data-track-output="true"
              data-output-url={result.notesUrl}
              data-output-name="vocal-notes.csv"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Notes CSV
            </a>
            <a
              href={result.pitchUrl}
              download
              data-track-output="true"
              data-output-url={result.pitchUrl}
              data-output-name="vocal-pitch.csv"
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Pitch Curve CSV
            </a>
            <a
              href={result.wavUrl}
              download
              data-track-output="true"
              data-output-url={result.wavUrl}
              data-output-name="vocal-preview.wav"
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <AudioLines className="w-4 h-4" />
              Preview WAV
            </a>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Processing Details</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="font-medium">{formatDuration(result.meta.durationSec)}</span>
              </div>
              <div>
                <span className="text-gray-500">Processing:</span>{' '}
                <span className="font-medium">{(result.meta.processingMs / 1000).toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>{' '}
                <span className="font-medium">{result.meta.format}</span>
              </div>
              <div>
                <span className="text-gray-500">Notes Found:</span>{' '}
                <span className="font-medium">{result.meta.noteCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 mb-2">Next Steps</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>Import the MIDI into your DAW as a lead melody guide</li>
                  <li>Use it to drive a synth or sampler for harmonies</li>
                  <li>Reference the pitch curve for vocal tuning</li>
                  <li>Build chord progressions around the melody</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full text-center py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Extract another melody
          </button>
        </div>
      )}

      {error && state === 'idle' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
