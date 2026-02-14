"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Music,
  Loader2,
  FileAudio,
  Mic,
  MicOff,
  Settings2,
  Sliders,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";
import {
  renderDoublerOffline,
  exportDoublerWav,
  DEFAULT_DOUBLER_SETTINGS,
  type DoublerSettings,
} from "@/lib/audio/offlineRenderDoubler";

type InputMode = "file" | "mic";

const PRESETS: { name: string; settings: Partial<DoublerSettings> }[] = [
  {
    name: "Tight Double",
    settings: { baseDelay: 12, range: 3, wow: 0.1, flutter: 0.1, width: 0.8, mix: 0.4 },
  },
  {
    name: "Wide Chorusy",
    settings: { baseDelay: 25, range: 12, wow: 0.4, flutter: 0.4, width: 1.3, mix: 0.5 },
  },
  {
    name: "Dreamy Drift",
    settings: { baseDelay: 35, range: 20, wow: 0.7, flutter: 0.3, width: 1.2, mix: 0.6, lfoRate: 0.2 },
  },
  {
    name: "Slap Thickener",
    settings: { baseDelay: 8, range: 2, wow: 0, flutter: 0.05, width: 1.0, mix: 0.35, satDrive: 0.2 },
  },
];

export default function VocalDoublerClient() {
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [workletReady, setWorkletReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<DoublerSettings>(DEFAULT_DOUBLER_SETTINGS);
  const [presetName, setPresetName] = useState("");
  const { presets: savedPresets, savingPreset, savePreset } = useToolPresets<Partial<DoublerSettings>>({
    toolId: "vocal-doubler",
    originCloudId: "music",
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const initWorklet = useCallback(async () => {
    try {
      const ctx = await getAudioContext();
      
      if (!workletReady) {
        await ctx.audioWorklet.addModule("/audio-worklets/vocalDoublerWorklet.js");
        setWorkletReady(true);
      }
    } catch (err) {
      console.error("Worklet init failed:", err);
      setError("AudioWorklet not supported in this browser. Try Chrome or Firefox.");
    }
  }, [getAudioContext, workletReady]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setAudioFile(file);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = await getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      await initWorklet();
    } catch (err) {
      console.error("Failed to decode audio:", err);
      setError("Could not decode audio file. Try a different format.");
      setAudioFile(null);
      setAudioBuffer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkletParams = useCallback(() => {
    if (!workletNodeRef.current) return;

    const params = workletNodeRef.current.parameters;
    const now = audioContextRef.current?.currentTime || 0;

    (params.get("mix") as AudioParam)?.setTargetAtTime(settings.mix, now, 0.02);
    (params.get("width") as AudioParam)?.setTargetAtTime(settings.width, now, 0.02);
    (params.get("baseDelay") as AudioParam)?.setTargetAtTime(settings.baseDelay, now, 0.05);
    (params.get("range") as AudioParam)?.setTargetAtTime(settings.range, now, 0.05);
    (params.get("wow") as AudioParam)?.setTargetAtTime(settings.wow, now, 0.02);
    (params.get("flutter") as AudioParam)?.setTargetAtTime(settings.flutter, now, 0.02);
    (params.get("satDrive") as AudioParam)?.setTargetAtTime(settings.satDrive, now, 0.02);
    (params.get("satTone") as AudioParam)?.setTargetAtTime(settings.satTone, now, 0.02);
    (params.get("panA") as AudioParam)?.setTargetAtTime(settings.panA, now, 0.02);
    (params.get("panB") as AudioParam)?.setTargetAtTime(settings.panB, now, 0.02);
    (params.get("phaseInvert") as AudioParam)?.setValueAtTime(settings.phaseInvert ? 1 : 0, now);
    (params.get("lowLatency") as AudioParam)?.setValueAtTime(settings.lowLatency ? 1 : 0, now);
    (params.get("lfoRate") as AudioParam)?.setTargetAtTime(settings.lfoRate, now, 0.02);
  }, [settings]);

  useEffect(() => {
    updateWorkletParams();
  }, [updateWorkletParams]);

  const stopPlayback = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (sourceRef.current) {
      try {
        if ("stop" in sourceRef.current) {
          (sourceRef.current as AudioBufferSourceNode).stop();
        }
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsPlaying(false);
    setIsMicActive(false);
    setCurrentTime(0);
  }, []);

  const startPlayback = useCallback(async () => {
    if (!audioBuffer) return;

    stopPlayback();

    try {
      const ctx = await getAudioContext();
      await initWorklet();

      const workletNode = new AudioWorkletNode(ctx, "vocal-doubler-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      workletNodeRef.current = workletNode;

      updateWorkletParams();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(workletNode);
      workletNode.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(duration);
      };

      startTimeRef.current = ctx.currentTime;
      source.start(0);
      sourceRef.current = source;
      setIsPlaying(true);

      const updateTime = () => {
        if (audioContextRef.current && isPlaying) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
          setCurrentTime(Math.min(elapsed, duration));
          if (elapsed < duration) {
            animationRef.current = requestAnimationFrame(updateTime);
          }
        }
      };
      animationRef.current = requestAnimationFrame(updateTime);
    } catch (err) {
      console.error("Playback failed:", err);
      setError("Playback failed. Please try again.");
    }
  }, [audioBuffer, duration, getAudioContext, initWorklet, stopPlayback, updateWorkletParams, isPlaying]);

  const startMic = useCallback(async () => {
    stopPlayback();

    try {
      const ctx = await getAudioContext();
      await initWorklet();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const workletNode = new AudioWorkletNode(ctx, "vocal-doubler-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      workletNodeRef.current = workletNode;

      updateWorkletParams();

      const source = ctx.createMediaStreamSource(stream);
      source.connect(workletNode);
      workletNode.connect(ctx.destination);

      sourceRef.current = source;
      setIsMicActive(true);
      setIsPlaying(true);
    } catch (err) {
      console.error("Mic access failed:", err);
      setError("Microphone access denied or not available.");
    }
  }, [getAudioContext, initWorklet, stopPlayback, updateWorkletParams]);

  const handleExport = async () => {
    if (!audioBuffer) return;

    setIsExporting(true);
    setError(null);

    try {
      const maxDuration = 30;
      const rendered = await renderDoublerOffline(audioBuffer, settings, maxDuration);
      exportDoublerWav(rendered);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_DOUBLER_SETTINGS);
  };

  const applyBuiltInPreset = (preset: typeof PRESETS[0]) => {
    setSettings({ ...DEFAULT_DOUBLER_SETTINGS, ...preset.settings });
  };

  const handleSavePreset = async () => {
    const didSave = await savePreset(presetName, settings);
    if (didSave) {
      setPresetName("");
    }
  };

  const applySavedPreset = (savedPreset: ToolPresetRecord<Partial<DoublerSettings>>) => {
    setSettings({ ...DEFAULT_DOUBLER_SETTINGS, ...savedPreset.preset_json });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopPlayback]);

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    unit = "",
    formatValue,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    unit?: string;
    formatValue?: (v: number) => string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {formatValue ? formatValue(value) : value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setInputMode("file")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === "file"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FileAudio className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => setInputMode("mic")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === "mic"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Mic className="w-4 h-4" />
          Microphone
        </button>
      </div>

      {inputMode === "file" && (
        <div className="space-y-4">
          <label className="block">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileAudio className="w-4 h-4" />
              Upload Vocal
            </div>
            <input
              type="file"
              accept=".wav,.mp3,.m4a,audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="flex items-center justify-center gap-2 w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-gray-600">Loading...</span>
                </>
              ) : audioFile ? (
                <>
                  <Music className="w-5 h-5 text-indigo-500" />
                  <span className="text-gray-900 font-medium">{audioFile.name}</span>
                  <span className="text-gray-500 text-sm">({formatTime(duration)})</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Click to upload WAV, MP3, or M4A</span>
                </>
              )}
            </label>
          </label>

          {audioBuffer && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {inputMode === "mic" && (
        <div className="text-center py-8">
          {isMicActive ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600">Microphone is live. Adjust settings and hear the effect in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <MicOff className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Click Start Mic to enable live monitoring with the doubler effect.</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 mr-2 self-center">Presets:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyBuiltInPreset(preset)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <ToolPresetBar
        presetName={presetName}
        onPresetNameChange={setPresetName}
        onSave={handleSavePreset}
        saving={savingPreset}
        presets={savedPresets}
        onApply={applySavedPreset}
        chipHoverClassName="hover:border-indigo-500 hover:text-indigo-700"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Main Controls
          </h3>
          <SliderControl
            label="Mix"
            value={settings.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, mix: v }))}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <SliderControl
            label="Width"
            value={settings.width}
            min={0}
            max={1.5}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, width: v }))}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <SliderControl
            label="Base Delay"
            value={settings.baseDelay}
            min={5}
            max={40}
            step={1}
            onChange={(v) => setSettings((s) => ({ ...s, baseDelay: v }))}
            unit="ms"
          />
          <SliderControl
            label="Range"
            value={settings.range}
            min={0}
            max={25}
            step={0.5}
            onChange={(v) => setSettings((s) => ({ ...s, range: v }))}
            unit="ms"
          />
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Modulation
          </h3>
          <SliderControl
            label="Wow (Drift)"
            value={settings.wow}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, wow: v }))}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <SliderControl
            label="Flutter"
            value={settings.flutter}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, flutter: v }))}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <SliderControl
            label="LFO Rate"
            value={settings.lfoRate}
            min={0.05}
            max={6}
            step={0.05}
            onChange={(v) => setSettings((s) => ({ ...s, lfoRate: v }))}
            unit="Hz"
          />
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Saturation
          </h3>
          <SliderControl
            label="Drive"
            value={settings.satDrive}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, satDrive: v }))}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <SliderControl
            label="Tone"
            value={settings.satTone}
            min={6000}
            max={18000}
            step={100}
            onChange={(v) => setSettings((s) => ({ ...s, satTone: v }))}
            formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
          />
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900">Stereo & Options</h3>
          <SliderControl
            label="Deck A Pan"
            value={settings.panA}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, panA: v }))}
            formatValue={(v) => (v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : v > 0 ? `R${Math.round(v * 100)}` : "C")}
          />
          <SliderControl
            label="Deck B Pan"
            value={settings.panB}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => setSettings((s) => ({ ...s, panB: v }))}
            formatValue={(v) => (v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : v > 0 ? `R${Math.round(v * 100)}` : "C")}
          />
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.phaseInvert}
                onChange={(e) => setSettings((s) => ({ ...s, phaseInvert: e.target.checked }))}
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm text-gray-700">Phase Invert</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.lowLatency}
                onChange={(e) => setSettings((s) => ({ ...s, lowLatency: e.target.checked }))}
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm text-gray-700">Low Latency</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
        {inputMode === "file" ? (
          <>
            {!isPlaying ? (
              <button
                onClick={startPlayback}
                disabled={!audioBuffer || isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
            ) : (
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}
          </>
        ) : (
          <>
            {!isMicActive ? (
              <button
                onClick={startMic}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors"
              >
                <Mic className="w-4 h-4" />
                Start Mic
              </button>
            ) : (
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
              >
                <MicOff className="w-4 h-4" />
                Stop Mic
              </button>
            )}
          </>
        )}

        <button
          onClick={handleExport}
          data-track-output="true"
          disabled={!audioBuffer || isExporting || isPlaying}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export WAV (30s max)
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

      <p className="text-xs text-gray-500 text-center">
        Audio processed locally. Nothing uploaded.
      </p>
    </div>
  );
}
