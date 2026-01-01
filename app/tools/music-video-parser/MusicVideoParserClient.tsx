"use client";

import { useState, useCallback, useRef } from "react";

interface BuildStatus {
  stage: "idle" | "uploading" | "building" | "complete" | "failed";
  progress: number;
  message: string;
}

type ExtractionMode = "frames" | "clips" | "both";

export default function MusicVideoParserClient() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<BuildStatus>({ stage: "idle", progress: 0, message: "" });
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("frames");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a video file (MP4, MOV, or WebM)");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const CHUNK_SIZE = 5 * 1024 * 1024;

  const handleUpload = async () => {
    if (!file) return;

    setError(null);
    setDownloadUrl(null);
    setStatus({ stage: "uploading", progress: 0, message: "Starting upload..." });

    try {
      // Step 1: Start job
      const startRes = await fetch("/api/tools/music-video-parser/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          extraction_mode: extractionMode
        })
      });

      const startData = await startRes.json();

      if (!startData.ok) {
        setError(startData.error || "Failed to start processing");
        setStatus({ stage: "failed", progress: 0, message: "" });
        return;
      }

      const currentJobId = startData.jobId;
      setJobId(currentJobId);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // Step 2: Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        setStatus({ 
          stage: "uploading", 
          progress: Math.floor((i / totalChunks) * 50),
          message: `Uploading chunk ${i + 1}/${totalChunks}...`
        });

        const chunkRes = await fetch(
          `/api/tools/music-video-parser/chunk?jobId=${currentJobId}&index=${i}&total=${totalChunks}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: chunk
          }
        );

        const chunkData = await chunkRes.json();
        if (!chunkRes.ok || !chunkData.ok) {
          setError(chunkData.error || `Failed to upload chunk ${i + 1}/${totalChunks}`);
          setStatus({ stage: "failed", progress: 0, message: "" });
          return;
        }
      }

      // Step 3: Call /build to process and get zip
      setStatus({ stage: "building", progress: 55, message: "Processing video..." });

      const buildRes = await fetch(`/api/tools/music-video-parser/build?jobId=${currentJobId}`, {
        method: "POST"
      });

      if (!buildRes.ok) {
        const errorData = await buildRes.json().catch(() => ({}));
        setError(errorData.error || "Failed to build template pack");
        setStatus({ stage: "failed", progress: 0, message: "" });
        return;
      }

      // Step 4: Download the zip blob
      setStatus({ stage: "building", progress: 90, message: "Preparing download..." });
      
      const blob = await buildRes.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      setStatus({ stage: "complete", progress: 100, message: "Template pack ready!" });

    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStatus({ stage: "failed", progress: 0, message: "" });
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setFile(null);
    setStatus({ stage: "idle", progress: 0, message: "" });
    setError(null);
    setDownloadUrl(null);
    setJobId(null);
    setCopied(false);
  };

  const packKey = jobId ? `music-video-parser/${jobId}` : "";

  const handleCopyPackKey = async () => {
    if (!packKey) return;
    try {
      await navigator.clipboard.writeText(packKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isProcessing = status.stage === "uploading" || status.stage === "building";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Music Video Parser</h1>
        <p className="text-gray-400 mb-8">
          Upload a video to extract shot boundaries and generate a template pack with storyboard frames.
        </p>

        {status.stage === "idle" && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-gray-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg">Drop a video here or click to browse</p>
                  <p className="text-gray-500 mt-2">MP4, MOV, or WebM (max 250MB, 90 seconds)</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Extraction Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setExtractionMode("frames")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    extractionMode === "frames"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-semibold">Frames Only</div>
                  <div className="text-xs mt-1 opacity-75">Static slideshow</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExtractionMode("clips")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    extractionMode === "clips"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-semibold">Clips Only</div>
                  <div className="text-xs mt-1 opacity-75">Motion video</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExtractionMode("both")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    extractionMode === "both"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-semibold">Both</div>
                  <div className="text-xs mt-1 opacity-75">Frames + Clips</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Parse Video
            </button>
          </>
        )}

        {isProcessing && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Processing</h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-600">
                  {status.stage}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{status.message}</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {status.stage === "failed" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Processing Failed</h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600">
                  failed
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status.stage === "complete" && downloadUrl && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Template Pack Ready!</h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-600">
                  complete
                </span>
              </div>
              <p className="text-gray-400">
                Your template pack has been generated with shot boundaries and storyboard frames.
              </p>
            </div>

            {packKey && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Pack Key</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Use this key in the Video Assembler to render your slideshow video.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 px-4 py-3 rounded-lg text-sm text-blue-400 font-mono overflow-x-auto">
                    {packKey}
                  </code>
                  <button
                    onClick={handleCopyPackKey}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a
                  href="/tools/video-assembler"
                  className="mt-4 inline-flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Open Video Assembler
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            )}

            <a
              href={downloadUrl}
              download="template-pack.zip"
              className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
            >
              Download Template Pack (.zip)
            </a>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Parse Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
