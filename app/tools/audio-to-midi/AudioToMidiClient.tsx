"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Music, FileText, Download, Loader2, CheckCircle, AlertCircle, FileAudio, Info, X } from "lucide-react";

interface ConversionResult {
  midiUrl: string;
  csvUrl: string;
  wavUrl: string;
  meta: {
    duration: number;
    sampleRate: number;
    notesCount: number;
    processingTime: string;
    originalFilename: string;
  };
}

type ProcessingState = "idle" | "uploading" | "transcribing" | "done" | "error";

const ACCEPTED_FORMATS = ".mp3,.wav,.m4a,.flac,.ogg";
const MAX_FILE_SIZE_MB = 25;

export default function AudioToMidiClient() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setResult(null);
    setState("idle");

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const validExts = ["mp3", "wav", "m4a", "flac", "ogg"];
    
    if (!ext || !validExts.includes(ext)) {
      setError("Please upload an MP3, WAV, M4A, FLAC, or OGG file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setError(null);
    setResult(null);
    setState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setState("transcribing");
      
      const response = await fetch("/api/audio-to-midi", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      setResult(data);
      setState("done");
    } catch (err) {
      console.error("Conversion error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setState("idle");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {state === "idle" && !file && (
          <div
            className={`p-8 border-2 border-dashed rounded-xl m-4 transition-colors cursor-pointer ${
              dragOver
                ? "border-orange-400 bg-orange-50"
                : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your audio file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse
              </p>
              <p className="text-xs text-gray-400">
                MP3, WAV, M4A, FLAC, OGG (max {MAX_FILE_SIZE_MB}MB, 10 min)
              </p>
            </div>
          </div>
        )}

        {file && state !== "done" && (
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              <FileAudio className="w-10 h-10 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              {state === "idle" && (
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={handleReset}
                    className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                  >
                    Try another file
                  </button>
                </div>
              </div>
            )}

            {state === "idle" && !error && (
              <button
                onClick={handleConvert}
                className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Music className="w-5 h-5" />
                Convert to MIDI
              </button>
            )}

            {(state === "uploading" || state === "transcribing") && (
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {state === "uploading" ? "Uploading..." : "Transcribing audio..."}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This may take up to 90 seconds for longer files
                </p>
              </div>
            )}
          </div>
        )}

        {state === "done" && result && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Conversion Complete</p>
                <p className="text-sm text-gray-500">
                  {result.meta.notesCount} notes detected in {formatDuration(result.meta.duration)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <a
                href={result.midiUrl}
                download
                data-track-output="true"
                data-output-url={result.midiUrl}
                data-output-name="converted-midi.mid"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                MIDI File
              </a>
              <a
                href={result.csvUrl}
                download
                data-track-output="true"
                data-output-url={result.csvUrl}
                data-output-name="converted-notes.csv"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Notes CSV
              </a>
              <a
                href={result.wavUrl}
                download
                data-track-output="true"
                data-output-url={result.wavUrl}
                data-output-name="converted-preview.wav"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <Music className="w-4 h-4" />
                Preview WAV
              </a>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Details</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-500">Duration:</div>
                <div className="text-gray-900">{formatDuration(result.meta.duration)}</div>
                <div className="text-gray-500">Sample Rate:</div>
                <div className="text-gray-900">{result.meta.sampleRate} Hz</div>
                <div className="text-gray-500">Notes Found:</div>
                <div className="text-gray-900">{result.meta.notesCount}</div>
                <div className="text-gray-500">Processing Time:</div>
                <div className="text-gray-900">{result.meta.processingTime}s</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Next Steps</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Import the MIDI file into your DAW (Ableton, FL Studio, Logic, etc.)</li>
                    <li>Quantize notes to your desired grid for cleaner timing</li>
                    <li>Assign your preferred instrument/sound to the MIDI track</li>
                    <li>Edit individual notes as needed</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Convert Another File
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        Powered by Spotify Basic Pitch (Apache-2.0). We don&apos;t store your uploads. Files are deleted after processing.
      </p>
    </div>
  );
}
