"use client";

import { useState, useRef, useEffect } from "react";

interface JobStatus {
  ok: boolean;
  job_id: string;
  status: string;
  stage: string;
  progress: number;
  error?: string;
  output_key?: string;
  meta?: Record<string, any>;
}

type AssetMode = "auto" | "frame" | "clip";

export default function VideoAssemblerClient() {
  const [packKey, setPackKey] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [assetMode, setAssetMode] = useState<AssetMode>("auto");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const handleRun = async () => {
    if (!packKey.trim()) {
      setError("Please enter a pack key");
      return;
    }

    setError(null);
    setIsRunning(true);
    setStatus(null);
    setJobId(null);

    try {
      const res = await fetch("/api/tools/video-assembler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pack_key: packKey.trim(), 
          ...(assetMode !== "auto" && { asset_mode: assetMode })
        })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to start assembler");
        setIsRunning(false);
        return;
      }

      setJobId(data.job_id);
      startPolling(data.job_id);

    } catch (err: any) {
      setError(err.message || "Network error");
      setIsRunning(false);
    }
  };

  const startPolling = (id: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/video-assembler/status?jobId=${id}`);
        const data: JobStatus = await res.json();

        setStatus(data);

        if (data.status === "complete" || data.status === "failed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setIsRunning(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const handleReset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPackKey("");
    setJobId(null);
    setStatus(null);
    setError(null);
    setIsRunning(false);
    setAssetMode("auto");
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      download: "Downloading frames...",
      assemble: "Rendering video...",
      upload: "Uploading output...",
      cleanup: "Finishing up..."
    };
    return labels[stage] || stage;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Video Assembler</h1>
        <p className="text-gray-400 mb-8">
          Render a slideshow video from a Music Video Parser template pack. Enter the pack key from a completed parser job.
        </p>

        {!jobId && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pack Key
                </label>
                <input
                  type="text"
                  value={packKey}
                  onChange={(e) => setPackKey(e.target.value)}
                  placeholder="music-video-parser/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Format: music-video-parser/{"<jobId>"} from a completed parser job
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssetMode("auto")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      assetMode === "auto"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-semibold">Auto</div>
                    <div className="text-xs mt-1 opacity-75">Use pack default</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetMode("frame")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      assetMode === "frame"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-semibold">Frames</div>
                    <div className="text-xs mt-1 opacity-75">Static slideshow</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetMode("clip")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      assetMode === "clip"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-semibold">Clips</div>
                    <div className="text-xs mt-1 opacity-75">Motion video</div>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Auto uses the pack's preferred asset type. Override to force frames or clips.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleRun}
              disabled={!packKey.trim() || isRunning}
              className="mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isRunning ? "Starting..." : "Run Assembler"}
            </button>
          </>
        )}

        {jobId && status && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Processing</h2>
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
                  <span>{getStageLabel(status.stage)}</span>
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

            {status.status === "complete" && status.meta?.render_stats && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Render Stats</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2">{status.meta.render_stats.duration_sec?.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">FPS:</span>
                    <span className="ml-2">{status.meta.render_stats.fps}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Resolution:</span>
                    <span className="ml-2">{status.meta.render_stats.resolution}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Frames:</span>
                    <span className="ml-2">{status.meta.render_stats.total_frames}</span>
                  </div>
                  {status.meta.render_stats.clamp_applied > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Shots Clamped:</span>
                      <span className="ml-2 text-yellow-400">{status.meta.render_stats.clamp_applied} (max 3s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status.status === "complete" && (
              <a
                href={`/api/tools/video-assembler/download?jobId=${jobId}`}
                data-track-output="true"
                className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
              >
                Download Video (.mp4)
              </a>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {status.status === "complete" ? "Assemble Another Video" : "Cancel"}
            </button>
          </div>
        )}

        {jobId && !status && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Starting assembler...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
