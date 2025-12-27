'use client';

import { useState, useCallback } from 'react';
import { Upload, Music, Download, Loader2, AlertCircle, CheckCircle2, X, Lightbulb, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

type ProcessingState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

interface KeyResult {
  key: string;
  scale: string;
  keyLabel: string;
  confidence: number;
  altCandidates: Array<{ keyLabel: string; confidence: number }>;
  modulations: Array<{ startSec: number; endSec: number; keyLabel: string; confidence: number }>;
  analysisUrl: string;
  meta: {
    durationSec: number;
    processingMs: number;
    format: string;
  };
}

export default function AudioKeyDetectorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<KeyResult | null>(null);
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
    const allowedExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
    const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
    
    if (!allowedExts.includes(ext)) {
      setError('Please upload an MP3, WAV, M4A, FLAC, or OGG file.');
      return;
    }
    
    if (f.size > 25 * 1024 * 1024) {
      setError('File is too large. Maximum size is 25MB.');
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

  const handleDetect = async () => {
    if (!file) return;
    
    setError(null);
    setState('uploading');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      setState('analyzing');
      
      const response = await fetch('/api/audio-key-detector', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Detection failed');
      }
      
      setResult(data);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('error');
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setState('idle');
  };

  const formatTime = (seconds: number) => {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High confidence';
    if (confidence >= 0.5) return 'Medium confidence';
    return 'Low confidence';
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
              <p className="text-lg font-medium text-gray-700 mb-2">Drop your audio file here</p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400">MP3, WAV, M4A, FLAC, OGG (max 25MB, 10 min)</p>
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
                onClick={handleDetect}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Detect Key
              </button>
            </div>
          )}
        </div>
      )}

      {(state === 'uploading' || state === 'analyzing') && (
        <div className="border rounded-xl p-8 text-center bg-gray-50">
          <Loader2 className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {state === 'uploading' && 'Uploading...'}
            {state === 'analyzing' && 'Analyzing audio...'}
          </p>
          <p className="text-sm text-gray-500">This usually takes a few seconds</p>
        </div>
      )}

      {state === 'error' && (
        <div className="border border-red-200 rounded-xl p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 mb-1">Detection Failed</p>
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
            <span className="font-semibold text-gray-800">Key Detected</span>
          </div>

          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-gray-900 mb-2">{result.keyLabel}</p>
            <div className="flex items-center justify-center gap-2">
              <div className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                {getConfidenceLabel(result.confidence)}
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            
            {result.confidence < 0.35 && (
              <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block">
                Low confidence — try isolating the instrument or using a cleaner excerpt.
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Top Candidates</p>
            <div className="space-y-2">
              {result.altCandidates.slice(0, 5).map((candidate, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className={i === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                    {candidate.keyLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${candidate.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-12 text-right">
                      {Math.round(candidate.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.modulations.length > 1 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-purple-800 mb-3">Key Changes Detected</p>
              <div className="space-y-2">
                {result.modulations.map((mod, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">
                        {formatTime(mod.startSec)} – {formatTime(mod.endSec)}
                      </span>
                    </div>
                    <span className="font-medium text-purple-700">{mod.keyLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href={result.analysisUrl}
              download
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Analysis
            </a>
            <button
              onClick={resetForm}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Analyze Another
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Processing Details</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="font-medium">{formatTime(result.meta.durationSec)}</span>
              </div>
              <div>
                <span className="text-gray-500">Processing:</span>{' '}
                <span className="font-medium">{(result.meta.processingMs / 1000).toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>{' '}
                <span className="font-medium">{result.meta.format}</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 mb-2">Prep Stack Workflow</p>
                <p className="text-sm text-orange-700 mb-3">
                  Now that you know the key, continue your workflow:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/tools/bpm-finder"
                    className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    Find BPM <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/tools/audio-to-midi"
                    className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    Convert to MIDI <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
