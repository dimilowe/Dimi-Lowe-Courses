'use client';

import { useState, useCallback } from 'react';
import { Upload, Music, Download, Loader2, AlertCircle, CheckCircle2, X, Lightbulb, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type ProcessingState = 'idle' | 'uploading' | 'transcribing' | 'inferring' | 'done' | 'error';

interface ChordSegment {
  startSec: number;
  endSec: number;
  chordLabel: string;
  root: string;
  quality: string;
  confidence: number;
  notes: string[];
}

interface ChordResult {
  chords: ChordSegment[];
  altCandidates?: Array<{
    startSec: number;
    endSec: number;
    candidates: Array<{ chordLabel: string; confidence: number }>;
  }>;
  files: {
    jsonUrl: string;
    csvUrl: string;
    midiUrl?: string;
  };
  meta: {
    durationSec: number;
    processingMs: number;
    format: string;
  };
}

export default function ChordProgressionFinderClient() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<ChordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);

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
    
    if (f.size > 200 * 1024 * 1024) {
      setError('File is too large. Maximum size is 200MB.');
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

  const handleFindChords = async () => {
    if (!file) return;
    
    setError(null);
    setState('uploading');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      setState('transcribing');
      
      setTimeout(() => {
        setState(prev => prev === 'transcribing' ? 'inferring' : prev);
      }, 3000);
      
      const response = await fetch('/api/chord-progression-finder', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Chord analysis failed');
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
    setShowCandidates(false);
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
    if (confidence >= 0.7) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {state === 'idle' && !result && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
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
              <p className="text-sm text-gray-400">MP3, WAV, M4A, FLAC, OGG (max 200MB, 10 min)</p>
            </label>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Music className="w-8 h-8 text-purple-500" />
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
                onClick={handleFindChords}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Find Chords
              </button>
            </div>
          )}
        </div>
      )}

      {(state === 'uploading' || state === 'transcribing' || state === 'inferring') && (
        <div className="border rounded-xl p-8 text-center bg-gray-50">
          <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {state === 'uploading' && 'Uploading...'}
            {state === 'transcribing' && 'Transcribing notes...'}
            {state === 'inferring' && 'Inferring chords...'}
          </p>
          <p className="text-sm text-gray-500">This may take up to a minute for longer files</p>
        </div>
      )}

      {state === 'error' && (
        <div className="border border-red-200 rounded-xl p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 mb-1">Analysis Failed</p>
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
            <span className="font-semibold text-gray-800">Chord Progression Found</span>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Chord Timeline</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.chords.map((chord, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 w-24 flex-shrink-0">
                    {formatTime(chord.startSec)} – {formatTime(chord.endSec)}
                  </span>
                  <span className="text-xl font-bold text-purple-700 w-20">
                    {chord.chordLabel}
                  </span>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getConfidenceColor(chord.confidence)}`}
                        style={{ width: `${chord.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {Math.round(chord.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result.altCandidates && result.altCandidates.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowCandidates(!showCandidates)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showCandidates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showCandidates ? 'Hide' : 'Show'} alternative candidates
              </button>
              {showCandidates && (
                <div className="mt-3 space-y-2 text-sm">
                  {result.altCandidates.slice(0, 5).map((alt, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">{formatTime(alt.startSec)}:</span>
                      <span className="ml-2">
                        {alt.candidates.slice(0, 3).map((c, j) => (
                          <span key={j} className="mr-3">
                            {c.chordLabel} <span className="text-gray-400">({Math.round(c.confidence * 100)}%)</span>
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <a
              href={result.files.jsonUrl}
              download
              data-output-name="chord-progressions.json"
              data-track-output="true"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              JSON
            </a>
            <a
              href={result.files.csvUrl}
              download
              data-output-name="chord-progressions.csv"
              data-track-output="true"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </a>
            {result.files.midiUrl && (
              <a
                href={result.files.midiUrl}
                download
                data-output-name="chord-progressions.mid"
                data-track-output="true"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                MIDI
              </a>
            )}
          </div>

          <button
            onClick={resetForm}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Analyze Another File
          </button>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
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
                <span className="text-gray-500">Chords:</span>{' '}
                <span className="font-medium">{result.chords.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800 mb-2">Prep Stack Workflow</p>
                <p className="text-sm text-purple-700 mb-3">
                  Combine chord analysis with these tools:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/tools/audio-key-detector"
                    className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    Key Detector <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/tools/audio-to-midi"
                    className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    Audio to MIDI <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/tools/bpm-finder"
                    className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    BPM Finder <ArrowRight className="w-3 h-3" />
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
