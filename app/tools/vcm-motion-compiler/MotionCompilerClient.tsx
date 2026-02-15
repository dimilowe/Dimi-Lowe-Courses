"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type CompilerStage = 
  | "setup" 
  | "compiling" 
  | "packet_ready" 
  | "uploading" 
  | "processing" 
  | "ready_to_finalize"
  | "finalizing"
  | "complete"
  | "halted";

interface BeatStatus {
  id: string;
  index: number;
  status: string;
  duration_target: number;
  attempts: number;
  max_attempts: number;
  has_clip?: boolean;
  error?: string;
}

interface ManifestSummary {
  job_id: string;
  status: string;
  current_beat_index: number;
  total_beats: number;
  beats: BeatStatus[];
  can_finalize?: boolean;
  finalize_reason?: string;
  error?: string;
}

interface RenderPacket {
  beat_id: string;
  beat_index: number;
  total_beats: number;
  [key: string]: any;
}

const DEFAULT_CHARACTER_PACK = {
  id: "char-001",
  name: "Default Character",
  identity_anchors: {
    hair_color: "dark brown",
    clothing_silhouette: "casual",
    key_features: ["medium build"]
  }
};

const DEFAULT_SCENE_PACK = {
  id: "scene-001",
  name: "Urban Setting",
  lighting_direction: "front",
  environment: "city street"
};

const DEFAULT_STYLE_DNA = {
  id: "style-001",
  name: "Cinematic",
  color_palette: ["#1a1a2e", "#16213e", "#0f3460"],
  visual_style: "film noir"
};

const MOTION_SKELETONS = [
  {
    id: "basic-3-beat",
    name: "Basic 3-Beat Sequence",
    beats: [
      { duration: 3.0, camera_angle: "medium", motion_type: "establishing", transition_in: "fade", transition_out: "cut" },
      { duration: 4.0, camera_angle: "close-up", motion_type: "action", transition_in: "cut", transition_out: "cut" },
      { duration: 3.0, camera_angle: "wide", motion_type: "resolution", transition_in: "cut", transition_out: "fade" }
    ]
  },
  {
    id: "dynamic-5-beat",
    name: "Dynamic 5-Beat Sequence",
    beats: [
      { duration: 2.5, camera_angle: "wide", motion_type: "establishing", transition_in: "fade", transition_out: "cut" },
      { duration: 3.0, camera_angle: "medium", motion_type: "approach", transition_in: "cut", transition_out: "cut" },
      { duration: 4.0, camera_angle: "close-up", motion_type: "climax", transition_in: "cut", transition_out: "cut" },
      { duration: 2.5, camera_angle: "medium", motion_type: "reaction", transition_in: "cut", transition_out: "cut" },
      { duration: 3.0, camera_angle: "wide", motion_type: "resolution", transition_in: "cut", transition_out: "fade" }
    ]
  }
];

export default function MotionCompilerClient() {
  const [stage, setStage] = useState<CompilerStage>("setup");
  const [jobId, setJobId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ManifestSummary | null>(null);
  const [currentPacket, setCurrentPacket] = useState<RenderPacket | null>(null);
  const [packetJson, setPacketJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSkeleton, setSelectedSkeleton] = useState(MOTION_SKELETONS[0]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCompile = async () => {
    setError(null);
    setIsLoading(true);
    setStage("compiling");

    try {
      const res = await fetch("/api/tools/vcm-motion-compiler/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_pack: DEFAULT_CHARACTER_PACK,
          scene_pack: DEFAULT_SCENE_PACK,
          style_dna: DEFAULT_STYLE_DNA,
          motion_skeleton: selectedSkeleton
        })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to start compile");
        setStage("setup");
        setIsLoading(false);
        return;
      }

      setJobId(data.job_id);
      setManifest(data.manifest);
      setCurrentPacket(data.current_packet);
      setPacketJson(JSON.stringify(data.current_packet, null, 2));
      setStage("packet_ready");
      setIsLoading(false);

    } catch (err: any) {
      setError(err.message || "Network error");
      setStage("setup");
      setIsLoading(false);
    }
  };

  const handleCopyPacket = async () => {
    try {
      await navigator.clipboard.writeText(packetJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId || !manifest) return;

    if (!file.type.includes("video/mp4") && !file.name.endsWith(".mp4")) {
      setError("Only MP4 files are accepted");
      return;
    }

    setError(null);
    setIsLoading(true);
    setStage("uploading");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("beatIndex", String(manifest.current_beat_index));
      formData.append("clip", file);

      setUploadProgress(50);

      const res = await fetch("/api/tools/vcm-motion-compiler/uploadBeat", {
        method: "POST",
        body: formData
      });

      setUploadProgress(100);

      const data = await res.json();

      if (!data.ok) {
        if (data.halted) {
          setStage("halted");
          setError(data.error);
        } else if (data.validation_failed && data.can_retry) {
          setError(`Validation failed: ${data.message}. Attempts remaining: ${data.attempts_remaining}`);
          setStage("packet_ready");
        } else {
          setError(data.error || "Upload failed");
          setStage("packet_ready");
        }
        setIsLoading(false);
        return;
      }

      await refreshStatus();

      if (data.can_finalize) {
        setStage("ready_to_finalize");
      } else if (data.next_packet) {
        setCurrentPacket(data.next_packet);
        setPacketJson(JSON.stringify(data.next_packet, null, 2));
        setStage("packet_ready");
      }

      setIsLoading(false);

    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStage("packet_ready");
      setIsLoading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const refreshStatus = async () => {
    if (!jobId) return;

    try {
      const res = await fetch(`/api/tools/vcm-motion-compiler/status?jobId=${jobId}`);
      const data = await res.json();

      if (data.ok) {
        setManifest({
          job_id: data.job_id,
          status: data.status,
          current_beat_index: data.current_beat_index,
          total_beats: data.total_beats,
          beats: data.beats,
          can_finalize: data.can_finalize,
          finalize_reason: data.finalize_reason,
          error: data.error
        });
      }
    } catch (err) {
      console.error("Status refresh failed:", err);
    }
  };

  const handleFinalize = async () => {
    if (!jobId) return;

    setError(null);
    setIsLoading(true);
    setStage("finalizing");

    try {
      const res = await fetch("/api/tools/vcm-motion-compiler/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Finalize failed");
        setStage("ready_to_finalize");
        setIsLoading(false);
        return;
      }

      await refreshStatus();
      setStage("complete");
      setIsLoading(false);

    } catch (err: any) {
      setError(err.message || "Finalize failed");
      setStage("ready_to_finalize");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStage("setup");
    setJobId(null);
    setManifest(null);
    setCurrentPacket(null);
    setPacketJson("");
    setError(null);
    setIsLoading(false);
    setCopied(false);
  };

  const getStageNumber = () => {
    switch (stage) {
      case "setup": return 1;
      case "compiling": return 2;
      case "packet_ready": return 3;
      case "uploading": return 4;
      case "processing": return 4;
      case "ready_to_finalize": return 5;
      case "finalizing": return 6;
      case "complete": return 7;
      case "halted": return -1;
      default: return 1;
    }
  };

  const stages = [
    { num: 1, label: "Setup" },
    { num: 2, label: "Compile" },
    { num: 3, label: "Render Packet" },
    { num: 4, label: "Upload Clip" },
    { num: 5, label: "Ready to Finalize" },
    { num: 6, label: "Rendering" },
    { num: 7, label: "Complete" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">VCM Motion Compiler</h1>
        <p className="text-gray-400 mb-8">
          Compile multi-beat video sequences with boundary validation. Manual compile mode.
        </p>

        {stage !== "halted" && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {stages.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    getStageNumber() >= s.num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    {s.num}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    getStageNumber() >= s.num ? "text-white" : "text-gray-500"
                  }`}>
                    {s.label}
                  </span>
                  {i < stages.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      getStageNumber() > s.num ? "bg-blue-600" : "bg-gray-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {manifest && manifest.beats.length > 0 && (
          <div className="mb-8 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Beat Timeline</h2>
            <div className="flex gap-2 flex-wrap">
              {manifest.beats.map((beat) => (
                <div
                  key={beat.id}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    beat.status === "PASS"
                      ? "bg-green-600"
                      : beat.status === "FAIL"
                      ? "bg-red-600"
                      : beat.status === "PROCESSING"
                      ? "bg-yellow-600"
                      : beat.status === "WAITING_UPLOAD"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  <div className="font-medium">{beat.id}</div>
                  <div className="text-xs opacity-75">{beat.status}</div>
                  {beat.attempts > 0 && (
                    <div className="text-xs opacity-75">
                      Attempt {beat.attempts}/{beat.max_attempts}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {stage === "setup" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Select Motion Skeleton</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOTION_SKELETONS.map((skeleton) => (
                  <button
                    key={skeleton.id}
                    onClick={() => setSelectedSkeleton(skeleton)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      selectedSkeleton.id === skeleton.id
                        ? "bg-blue-600 border-2 border-blue-400"
                        : "bg-gray-700 border-2 border-transparent hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-semibold">{skeleton.name}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      {skeleton.beats.length} beats
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {skeleton.beats.map(b => b.camera_angle).join(" → ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Packs (Using Defaults)</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="font-medium text-blue-400">Character</div>
                  <div className="text-gray-300">{DEFAULT_CHARACTER_PACK.name}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="font-medium text-green-400">Scene</div>
                  <div className="text-gray-300">{DEFAULT_SCENE_PACK.name}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="font-medium text-purple-400">Style</div>
                  <div className="text-gray-300">{DEFAULT_STYLE_DNA.name}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartCompile}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Compiling..." : "Start Compile"}
            </button>
          </div>
        )}

        {(stage === "compiling" || stage === "uploading" || stage === "finalizing") && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>
                {stage === "compiling" && "Compiling manifest..."}
                {stage === "uploading" && `Uploading clip... ${uploadProgress}%`}
                {stage === "finalizing" && "Rendering final video..."}
              </span>
            </div>
          </div>
        )}

        {stage === "packet_ready" && currentPacket && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Render Packet - Beat {currentPacket.beat_index + 1} of {currentPacket.total_beats}
                </h2>
                <button
                  onClick={handleCopyPacket}
                  data-track-output="true"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
              </div>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 max-h-96 overflow-y-auto">
                {packetJson}
              </pre>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Clip for {currentPacket.beat_id}</h2>
              <p className="text-gray-400 mb-4">
                Generate your clip externally using the Render Packet above, then upload the MP4 here.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Select MP4 to Upload
              </button>
            </div>
          </div>
        )}

        {stage === "ready_to_finalize" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">All Beats Passed!</h2>
                  <p className="text-gray-400">Ready to render final video</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Rendering..." : "Finalize & Render"}
            </button>
          </div>
        )}

        {stage === "complete" && jobId && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Compilation Complete!</h2>
                  <p className="text-gray-400">Your final video is ready</p>
                </div>
              </div>
            </div>

            <a
              href={`/api/tools/vcm-motion-compiler/download?jobId=${jobId}`}
              data-output-name="vcm-motion-compiler.mp4"
              data-track-output="true"
              className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-center transition-colors"
            >
              Download Final Video (.mp4)
            </a>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Compile Another Video
            </button>
          </div>
        )}

        {stage === "halted" && (
          <div className="space-y-6">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Compilation Halted</h2>
                  <p className="text-red-300">Too many validation failures</p>
                </div>
              </div>
              <p className="text-gray-300">
                The job has been halted due to repeated boundary validation failures.
                Please start a new compile with corrected clips.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Start New Compile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
