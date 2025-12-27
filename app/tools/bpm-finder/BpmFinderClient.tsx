"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Music,
  Loader2,
  FileAudio,
  RotateCcw,
  Activity,
  Gauge,
  Clock,
  Zap,
} from "lucide-react";
import { detectBpmFromArrayBuffer, type BpmResult } from "@/lib/audio/bpm";

export default function BpmFinderClient() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [result, setResult] = useState<BpmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const arrayBufferRef = useRef<ArrayBuffer | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setAudioFile(file);
    setResult(null);
    setError(null);
    
    try {
      const buffer = await file.arrayBuffer();
      arrayBufferRef.current = buffer;
      
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
      setDuration(audioBuffer.duration);
      setSampleRate(audioBuffer.sampleRate);
      await audioContext.close();
    } catch (err) {
      console.error("Failed to decode audio:", err);
      setError("Could not decode this audio file. Try a different format.");
      setAudioFile(null);
      arrayBufferRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!arrayBufferRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const bpmResult = await detectBpmFromArrayBuffer(arrayBufferRef.current);
      setResult(bpmResult);
    } catch (err) {
      console.error("BPM analysis failed:", err);
      setError("Analysis failed. The audio may be too short or corrupted.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAudioFile(null);
    setDuration(null);
    setSampleRate(null);
    setResult(null);
    setError(null);
    arrayBufferRef.current = null;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High": return "bg-green-100 text-green-700 border-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getStrengthWidth = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="space-y-4">
        <label className="block">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileAudio className="w-4 h-4" />
            Upload Audio
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".wav,.mp3,.m4a,audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="flex items-center justify-center gap-2 w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-gray-600">Loading audio...</span>
                </>
              ) : audioFile ? (
                <>
                  <Music className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-900 font-medium">{audioFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Click to upload WAV, MP3, or M4A</span>
                </>
              )}
            </label>
          </div>
        </label>

        {audioFile && duration && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Duration: {formatDuration(duration)}</span>
            </div>
            {sampleRate && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span>Sample Rate: {sampleRate} Hz</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyze}
          disabled={!audioFile || isAnalyzing || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Analyze BPM
            </>
          )}
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {result && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-2xl">
              <Gauge className="w-8 h-8" />
              <div className="text-left">
                <p className="text-sm opacity-80">Primary BPM</p>
                <p className="text-4xl font-bold">{result.primaryBpm}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${getConfidenceColor(result.confidence)}`}>
              {result.confidence} Confidence
            </span>
          </div>

          {(result.halfTime || result.doubleTime) && (
            <div className="grid grid-cols-2 gap-4">
              {result.halfTime && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Half-Time</p>
                  <p className="text-2xl font-bold text-gray-900">{result.halfTime}</p>
                </div>
              )}
              {result.doubleTime && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Double-Time</p>
                  <p className="text-2xl font-bold text-gray-900">{result.doubleTime}</p>
                </div>
              )}
            </div>
          )}

          {result.candidates.length > 1 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Top Candidates</p>
              <div className="space-y-2">
                {result.candidates.slice(0, 3).map((candidate, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-mono w-16 text-gray-900">
                      {candidate.bpm} BPM
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: getStrengthWidth(candidate.score) }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(candidate.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 text-center">
            Some audio can be interpreted at half or double tempo. Try the alternate options if the primary BPM feels off.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Processed entirely in-browser. No audio is stored.
      </p>
    </div>
  );
}
