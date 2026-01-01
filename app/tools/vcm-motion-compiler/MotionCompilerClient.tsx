"use client";

import { useState, useRef, useEffect } from "react";
import { 
  STYLE_DNA_PRESETS, 
  CHARACTER_PRESETS, 
  SCENE_PRESETS, 
  SKELETON_PRESETS,
  DEFAULT_SETTINGS
} from "@/lib/motionCompiler/constants";

type Step = "packs" | "skeleton" | "compile" | "generate" | "validate" | "render" | "complete";
type BeatStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL" | "WARN";

interface BeatState {
  beat_id: string;
  action: string;
  status: BeatStatus;
  attempts: number;
  error?: string;
}

interface JobStatus {
  ok: boolean;
  job_id: string;
  status: string;
  stage: string;
  progress: number;
  error?: string;
  output_key?: string;
  meta?: {
    beats?: BeatState[];
    compile_log?: string[];
    render_stats?: any;
  };
}

const STEPS: { key: Step; label: string }[] = [
  { key: "packs", label: "Packs" },
  { key: "skeleton", label: "Skeleton" },
  { key: "compile", label: "Compile" },
  { key: "generate", label: "Generate" },
  { key: "validate", label: "Validate" },
  { key: "render", label: "Render" },
  { key: "complete", label: "Complete" }
];

export default function MotionCompilerClient() {
  const [currentStep, setCurrentStep] = useState<Step>("packs");
  const [characterPack, setCharacterPack] = useState(CHARACTER_PRESETS[0].id);
  const [scenePack, setScenePack] = useState(SCENE_PRESETS[0].id);
  const [styleDna, setStyleDna] = useState(STYLE_DNA_PRESETS[0].id);
  const [skeletonPreset, setSkeletonPreset] = useState(SKELETON_PRESETS[0].id);
  const [customSkeleton, setCustomSkeleton] = useState("");
  const [useCustomSkeleton, setUseCustomSkeleton] = useState(false);
  const [providerKey, setProviderKey] = useState("");
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [compileLog, setCompileLog] = useState<string[]>([]);
  const [beats, setBeats] = useState<BeatState[]>([]);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const getSelectedSkeleton = () => {
    if (useCustomSkeleton) {
      try {
        return JSON.parse(customSkeleton);
      } catch {
        return null;
      }
    }
    return SKELETON_PRESETS.find(p => p.id === skeletonPreset) || SKELETON_PRESETS[0];
  };

  const handleStartCompile = async () => {
    const skeleton = getSelectedSkeleton();
    if (!skeleton) {
      setError("Invalid skeleton JSON");
      return;
    }

    if (!providerKey.trim()) {
      setError("Provider API key is required (BYOK)");
      return;
    }

    setError(null);
    setIsRunning(true);
    setCurrentStep("compile");

    try {
      const res = await fetch("/api/tools/vcm-motion-compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_pack_key: `packs/characters/${characterPack}`,
          scene_pack_key: `packs/scenes/${scenePack}`,
          style_dna_id: styleDna,
          motion_skeleton: { beats: skeleton.beats },
          provider: "byok",
          provider_key: providerKey,
          settings: DEFAULT_SETTINGS
        })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to start compiler");
        setIsRunning(false);
        setCurrentStep("packs");
        return;
      }

      setJobId(data.job_id);
      startPolling(data.job_id);

    } catch (err: any) {
      setError(err.message || "Network error");
      setIsRunning(false);
      setCurrentStep("packs");
    }
  };

  const startPolling = (id: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/vcm-motion-compiler/status?jobId=${id}`);
        const data: JobStatus = await res.json();

        setStatus(data);

        if (data.meta?.compile_log) {
          setCompileLog(data.meta.compile_log);
        }

        if (data.meta?.beats) {
          setBeats(data.meta.beats);
        }

        const stageToStep: Record<string, Step> = {
          compile: "compile",
          generate: "generate",
          boundary: "generate",
          validate: "validate",
          render: "render",
          upload: "render",
          cleanup: "complete"
        };
        
        if (data.stage && stageToStep[data.stage]) {
          setCurrentStep(stageToStep[data.stage]);
        }

        if (data.status === "complete") {
          setCurrentStep("complete");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setIsRunning(false);
        }

        if (data.status === "failed") {
          setError(data.error || "Job failed");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setIsRunning(false);
        }

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const handleReset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCurrentStep("packs");
    setJobId(null);
    setStatus(null);
    setError(null);
    setIsRunning(false);
    setCompileLog([]);
    setBeats([]);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getStepIndex = (step: Step) => STEPS.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  const getBeatStatusColor = (status: BeatStatus) => {
    switch (status) {
      case "PASS": return "bg-green-600";
      case "FAIL": return "bg-red-600";
      case "WARN": return "bg-yellow-600";
      case "RUNNING": return "bg-blue-600 animate-pulse";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">VCM Motion Compiler</h1>
        <p className="text-gray-400 mb-8">
          Compile identity-locked, scene-consistent, multi-shot AI video with boundary contracts.
        </p>

        <div className="flex items-center mb-8 overflow-x-auto">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  idx < currentStepIndex
                    ? "bg-green-600 text-white"
                    : idx === currentStepIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {idx < currentStepIndex ? "✓" : idx + 1}
              </div>
              <span
                className={`ml-2 text-sm whitespace-nowrap ${
                  idx === currentStepIndex ? "text-white font-medium" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${idx < currentStepIndex ? "bg-green-600" : "bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        {currentStep === "packs" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Character Pack</h2>
              <div className="grid grid-cols-2 gap-3">
                {CHARACTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setCharacterPack(preset.id)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      characterPack === preset.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm opacity-75">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Scene Pack</h2>
              <div className="grid grid-cols-3 gap-3">
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setScenePack(preset.id)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      scenePack === preset.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm opacity-75">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Style DNA</h2>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_DNA_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStyleDna(preset.id)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      styleDna === preset.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm opacity-75">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("skeleton")}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Continue to Skeleton
            </button>
          </div>
        )}

        {currentStep === "skeleton" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Motion Skeleton</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setUseCustomSkeleton(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !useCustomSkeleton ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Preset
                </button>
                <button
                  onClick={() => setUseCustomSkeleton(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    useCustomSkeleton ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Custom JSON
                </button>
              </div>

              {!useCustomSkeleton ? (
                <div className="space-y-3">
                  {SKELETON_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSkeletonPreset(preset.id)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        skeletonPreset === preset.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm opacity-75 mt-1">
                        {preset.beats.length} beats: {preset.beats.map(b => b.beat_id).join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={customSkeleton}
                  onChange={(e) => setCustomSkeleton(e.target.value)}
                  placeholder={JSON.stringify(SKELETON_PRESETS[0], null, 2)}
                  className="w-full h-64 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Provider API Key (BYOK)</h2>
              <input
                type="password"
                value={providerKey}
                onChange={(e) => setProviderKey(e.target.value)}
                placeholder="Enter your AI provider API key"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Your API key is used for inference calls and is not stored.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep("packs")}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStartCompile}
                disabled={isRunning}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Start Compilation
              </button>
            </div>
          </div>
        )}

        {(currentStep === "compile" || currentStep === "generate" || currentStep === "validate" || currentStep === "render") && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Processing</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status?.status === "complete" ? "bg-green-600" :
                  status?.status === "failed" ? "bg-red-600" : "bg-yellow-600"
                }`}>
                  {status?.status || "initializing"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{status?.stage || "Starting..."}</span>
                  <span>{status?.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status?.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {beats.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Beat Timeline</h2>
                <div className="space-y-2">
                  {beats.map((beat) => (
                    <div
                      key={beat.beat_id}
                      className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg"
                    >
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBeatStatusColor(beat.status)}`}>
                        {beat.status}
                      </span>
                      <span className="font-mono text-sm">{beat.beat_id}</span>
                      <span className="text-gray-400 text-sm flex-1">{beat.action}</span>
                      <span className="text-gray-500 text-xs">Attempts: {beat.attempts}</span>
                      {beat.error && (
                        <span className="text-red-400 text-xs">{beat.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {compileLog.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Compile Log</h2>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
                  {compileLog.map((line, idx) => (
                    <div key={idx} className="text-gray-400">{line}</div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {currentStep === "complete" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Compilation Complete!</h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-600">
                  complete
                </span>
              </div>
              <p className="text-gray-400">
                Your motion video has been compiled successfully.
              </p>
            </div>

            {status?.meta?.render_stats && (
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
                    <span className="text-gray-400">Beats Rendered:</span>
                    <span className="ml-2">{status.meta.render_stats.beats_rendered}</span>
                  </div>
                </div>
              </div>
            )}

            {beats.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Final Beat Status</h2>
                <div className="space-y-2">
                  {beats.map((beat) => (
                    <div
                      key={beat.beat_id}
                      className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg"
                    >
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBeatStatusColor(beat.status)}`}>
                        {beat.status}
                      </span>
                      <span className="font-mono text-sm">{beat.beat_id}</span>
                      <span className="text-gray-400 text-sm flex-1">{beat.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {jobId && (
              <a
                href={`/api/tools/vcm-motion-compiler/download?jobId=${jobId}`}
                className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
              >
                Download Video (.mp4)
              </a>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Compile Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
