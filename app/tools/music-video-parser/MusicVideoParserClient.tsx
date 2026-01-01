"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Shot {
  shot_id: string;
  timestamp_sec: number;
  duration_sec: number;
}

interface JobStatus {
  ok: boolean;
  status: "pending" | "processing" | "complete" | "failed";
  stage: string;
  progress: number;
  error: string | null;
  hasOutput: boolean;
  shots: Shot[] | null;
}

export default function MusicVideoParserClient() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
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

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tools/music-video-parser/status?jobId=${id}`);
      const data: JobStatus = await res.json();
      setStatus(data);

      if (data.status === "complete" || data.status === "failed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      const runRes = await fetch("/api/tools/music-video-parser/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id })
      });
      const runData = await runRes.json();
      if (runData.ok) {
        setStatus(runData);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    pollStatus(id);
    pollingRef.current = setInterval(() => pollStatus(id), 2500);
  }, [pollStatus]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus(null);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("/api/tools/music-video-parser/start", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to start processing");
        setUploading(false);
        return;
      }

      setJobId(data.jobId);
      startPolling(data.jobId);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setFile(null);
    setJobId(null);
    setStatus(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Music Video Parser</h1>
        <p className="text-gray-400 mb-8">
          Upload a video to extract shot boundaries and generate a template pack with storyboard frames.
        </p>

        {!jobId && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
                  <p className="text-gray-500 mt-2">MP4, MOV, or WebM (max 1GB)</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {uploading ? "Uploading..." : "Parse Video"}
            </button>
          </>
        )}

        {jobId && status && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Processing Status</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status.status === "complete"
                      ? "bg-green-600"
                      : status.status === "failed"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {status.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Stage: {status.stage}</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>

              {status.error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                  {status.error}
                </div>
              )}
            </div>

            {status.status === "complete" && status.shots && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Detected Shots ({status.shots.length})
                  </h2>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                          <th className="text-left py-2">Shot ID</th>
                          <th className="text-left py-2">Timestamp</th>
                          <th className="text-left py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.shots.map((shot) => (
                          <tr key={shot.shot_id} className="border-b border-gray-700/50">
                            <td className="py-2 font-mono">{shot.shot_id}</td>
                            <td className="py-2">{formatTime(shot.timestamp_sec)}</td>
                            <td className="py-2">{shot.duration_sec.toFixed(2)}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <a
                  href={`/api/tools/music-video-parser/download?jobId=${jobId}`}
                  className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
                >
                  Download Template Pack (.zip)
                </a>
              </>
            )}

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
