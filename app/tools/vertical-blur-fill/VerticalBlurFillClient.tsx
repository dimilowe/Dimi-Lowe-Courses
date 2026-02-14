"use client";

import { useState, useRef, useEffect } from "react";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";

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

interface Config {
  target_w: number;
  target_h: number;
  fps: number;
  blur_sigma: number;
  bg_scale: number;
  bg_dim: number;
  bg_saturation: number;
}

type VerticalBlurFillPresetJson = {
  config: Config;
};

type VerticalBlurFillPresetRecord = ToolPresetRecord<VerticalBlurFillPresetJson>;

const DEFAULT_CONFIG: Config = {
  target_w: 720,
  target_h: 1280,
  fps: 60,
  blur_sigma: 35,
  bg_scale: 1.5,
  bg_dim: 0.08,
  bg_saturation: 0.9,
};

export default function VerticalBlurFillClient() {
  const [inputKey, setInputKey] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [presetName, setPresetName] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<VerticalBlurFillPresetJson>({
    toolId: "vertical-blur-fill",
    originCloudId: "file",
  });

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tool_slug", "vertical-blur-fill");

      const res = await fetch("/api/tools/vertical-blur-fill/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setInputKey(data.storage_key);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleRun = async () => {
    if (!inputKey.trim()) {
      setError("Please upload a video first");
      return;
    }

    setError(null);
    setIsRunning(true);
    setStatus(null);
    setJobId(null);

    try {
      const res = await fetch("/api/tools/vertical-blur-fill/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_key: inputKey.trim(),
          ...config
        })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to start processing");
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
        const res = await fetch(`/api/tools/vertical-blur-fill/status?jobId=${id}`);
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
    setInputKey("");
    setJobId(null);
    setStatus(null);
    setError(null);
    setIsRunning(false);
    setConfig(DEFAULT_CONFIG);
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
      download: "Downloading video...",
      process: "Applying blur fill effect...",
      upload: "Uploading output...",
      cleanup: "Finishing up..."
    };
    return labels[stage] || stage;
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, { config });
    if (ok) setPresetName("");
  };

  const handleApplyPreset = (preset: VerticalBlurFillPresetRecord) => {
    const nextConfig = preset?.preset_json?.config;
    if (!nextConfig) return;
    setConfig({
      target_w: nextConfig.target_w === 1080 ? 1080 : 720,
      target_h: nextConfig.target_h === 1920 ? 1920 : 1280,
      fps: nextConfig.fps === 60 ? 60 : 30,
      blur_sigma: Math.min(80, Math.max(10, nextConfig.blur_sigma ?? DEFAULT_CONFIG.blur_sigma)),
      bg_scale: Math.min(2.5, Math.max(1, nextConfig.bg_scale ?? DEFAULT_CONFIG.bg_scale)),
      bg_dim: Math.min(0.5, Math.max(0, nextConfig.bg_dim ?? DEFAULT_CONFIG.bg_dim)),
      bg_saturation: Math.min(1, Math.max(0, nextConfig.bg_saturation ?? DEFAULT_CONFIG.bg_saturation)),
    });
    setShowAdvanced(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Vertical Blur Fill</h1>
        <p className="text-gray-400 mb-8">
          Convert any video into a clean 9:16 vertical format with a blurred background fill. Perfect for TikTok, Reels, and Shorts.
        </p>

        {!jobId && (
          <>
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : inputKey ? (
                  <div className="text-green-400">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-medium">Video uploaded</p>
                    <p className="text-sm text-gray-400 mt-1">Click to upload a different video</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="font-medium text-gray-300">Drop video here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI, or any video format</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium">Advanced Settings</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvanced && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Output Resolution</label>
                      <select
                        value={`${config.target_w}x${config.target_h}`}
                        onChange={(e) => {
                          const [w, h] = e.target.value.split("x").map(Number);
                          setConfig({ ...config, target_w: w, target_h: h });
                        }}
                        className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        <option value="720x1280">720x1280 (HD)</option>
                        <option value="1080x1920">1080x1920 (Full HD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">FPS</label>
                      <select
                        value={config.fps}
                        onChange={(e) => setConfig({ ...config, fps: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        <option value="30">30 FPS</option>
                        <option value="60">60 FPS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Blur Strength: {config.blur_sigma}</label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={config.blur_sigma}
                        onChange={(e) => setConfig({ ...config, blur_sigma: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Background Scale: {config.bg_scale.toFixed(1)}x</label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.5"
                        step="0.1"
                        value={config.bg_scale}
                        onChange={(e) => setConfig({ ...config, bg_scale: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Background Dim: {(config.bg_dim * 100).toFixed(0)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.02"
                        value={config.bg_dim}
                        onChange={(e) => setConfig({ ...config, bg_dim: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Background Saturation: {(config.bg_saturation * 100).toFixed(0)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.bg_saturation}
                        onChange={(e) => setConfig({ ...config, bg_saturation: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <ToolPresetBar
                    presetName={presetName}
                    onPresetNameChange={setPresetName}
                    onSave={handleSavePreset}
                    saving={savingPreset}
                    presets={presets}
                    onApply={handleApplyPreset}
                    lockedMessage="Subscribe to save vertical blur fill presets."
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleRun}
              disabled={!inputKey || isRunning}
              className="mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isRunning ? "Processing..." : "Apply Blur Fill"}
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

            {status.status === "complete" && status.meta?.result && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Output Info</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Input Size:</span>
                    <span className="ml-2">{status.meta.result.input_dims}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Output Size:</span>
                    <span className="ml-2">{status.meta.result.output_dims}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2">{status.meta.result.duration_sec?.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            )}

            {status.status === "complete" && (
              <a
                href={`/api/tools/vertical-blur-fill/download?jobId=${jobId}`}
                className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
              >
                Download Video (.mp4)
              </a>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {status.status === "complete" ? "Process Another Video" : "Cancel"}
            </button>
          </div>
        )}

        {jobId && !status && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Starting processor...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
