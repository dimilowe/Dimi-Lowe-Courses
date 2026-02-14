"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Volume2,
  Music,
  Loader2,
  FileAudio,
  ArrowLeftRight,
} from "lucide-react";
import {
  VocalDelayEngine,
  renderOffline,
  calculateDelayTime,
  clampBpm,
  clampFeedback,
  type Division,
  type DelaySettings,
} from "@/lib/audio/vocalDelayEngine";
import { encodeWav, downloadBlob } from "@/lib/audio/wav";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";

const DEFAULT_SETTINGS: DelaySettings = {
  bpm: 120,
  division: "1/8",
  feedback: 0.35,
  mix: 0.25,
  pingPong: true,
};

type VocalDelayPresetJson = DelaySettings;
type VocalDelayPresetRecord = ToolPresetRecord<VocalDelayPresetJson>;

export default function VocalDelayClient() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [bpm, setBpm] = useState(DEFAULT_SETTINGS.bpm);
  const [division, setDivision] = useState<Division>(DEFAULT_SETTINGS.division);
  const [feedback, setFeedback] = useState(DEFAULT_SETTINGS.feedback);
  const [mix, setMix] = useState(DEFAULT_SETTINGS.mix);
  const [pingPong, setPingPong] = useState(DEFAULT_SETTINGS.pingPong);
  const [presetName, setPresetName] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<VocalDelayEngine | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<VocalDelayPresetJson>({
    toolId: "vocal-delay",
    originCloudId: "music",
  });

  const delayMs = calculateDelayTime(bpm, division) * 1000;

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setAudioFile(file);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
    } catch (err) {
      console.error("Failed to decode audio:", err);
      setAudioFile(null);
      setAudioBuffer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.disconnect();
      engineRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (!audioBuffer) return;
    
    stopPlayback();
    
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const engine = new VocalDelayEngine(ctx);
    engine.setTempo(bpm, division);
    engine.setFeedback(feedback);
    engine.setMix(mix);
    engine.setPingPong(pingPong);
    engineRef.current = engine;
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(engine.getInputNode());
    engine.getOutputNode().connect(ctx.destination);
    
    source.onended = () => {
      setIsPlaying(false);
    };
    
    source.start(0);
    sourceRef.current = source;
    setIsPlaying(true);
  }, [audioBuffer, bpm, division, feedback, mix, pingPong, getAudioContext, stopPlayback]);

  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.setTempo(bpm, division);
    }
  }, [bpm, division, isPlaying]);

  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.setFeedback(feedback);
    }
  }, [feedback, isPlaying]);

  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.setMix(mix);
    }
  }, [mix, isPlaying]);

  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.setPingPong(pingPong);
    }
  }, [pingPong, isPlaying]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopPlayback]);

  const handleExport = async () => {
    if (!audioBuffer) return;
    
    setIsExporting(true);
    
    try {
      const settings: DelaySettings = {
        bpm: clampBpm(bpm),
        division,
        feedback: clampFeedback(feedback),
        mix,
        pingPong,
      };
      
      const rendered = await renderOffline(audioBuffer, settings);
      const wavBlob = encodeWav(rendered);
      downloadBlob(wavBlob, "vcm-vocal-delay.wav");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setBpm(DEFAULT_SETTINGS.bpm);
    setDivision(DEFAULT_SETTINGS.division);
    setFeedback(DEFAULT_SETTINGS.feedback);
    setMix(DEFAULT_SETTINGS.mix);
    setPingPong(DEFAULT_SETTINGS.pingPong);
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, {
      bpm,
      division,
      feedback,
      mix,
      pingPong,
    });
    if (ok) setPresetName("");
  };

  const handleApplyPreset = (preset: VocalDelayPresetRecord) => {
    const payload = preset?.preset_json;
    if (!payload) return;
    setBpm(clampBpm(payload.bpm ?? DEFAULT_SETTINGS.bpm));
    setDivision(
      payload.division === "1/4" || payload.division === "1/8" || payload.division === "1/16"
        ? payload.division
        : DEFAULT_SETTINGS.division
    );
    setFeedback(clampFeedback(payload.feedback ?? DEFAULT_SETTINGS.feedback));
    setMix(Math.min(1, Math.max(0, payload.mix ?? DEFAULT_SETTINGS.mix)));
    setPingPong(Boolean(payload.pingPong));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="space-y-4">
        <label className="block">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileAudio className="w-4 h-4" />
            Upload Vocal
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
              className="flex items-center justify-center gap-2 w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <span className="text-gray-600">Loading audio...</span>
                </>
              ) : audioFile ? (
                <>
                  <Music className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-900 font-medium">{audioFile.name}</span>
                  {audioBuffer && (
                    <span className="text-gray-500 text-sm">
                      ({formatDuration(audioBuffer.duration)} / {audioBuffer.sampleRate}Hz)
                    </span>
                  )}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            BPM (40–240)
          </label>
          <input
            type="number"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(clampBpm(parseInt(e.target.value) || 120))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Division
          </label>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value as Division)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="1/4">1/4 Note (Quarter)</option>
            <option value="1/8">1/8 Note (Eighth)</option>
            <option value="1/16">1/16 Note (Sixteenth)</option>
          </select>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg px-4 py-2 text-center">
        <span className="text-sm text-purple-700">
          Delay Time: <strong>{delayMs.toFixed(1)} ms</strong>
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Feedback
            </label>
            <span className="text-sm text-gray-500">{Math.round(feedback * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.01}
            value={feedback}
            onChange={(e) => setFeedback(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Mix (Dry/Wet)
            </label>
            <span className="text-sm text-gray-500">{Math.round(mix * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mix}
            onChange={(e) => setMix(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className={`w-5 h-5 ${pingPong ? "text-purple-500" : "text-gray-400"}`} />
          <div>
            <p className="font-medium text-gray-900">Ping-Pong Delay</p>
            <p className="text-sm text-gray-500">Bounce repeats between left and right channels</p>
          </div>
        </div>
        <button
          onClick={() => setPingPong(!pingPong)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            pingPong ? "bg-purple-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              pingPong ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <ToolPresetBar
        presetName={presetName}
        onPresetNameChange={setPresetName}
        onSave={handleSavePreset}
        saving={savingPreset}
        presets={presets}
        onApply={handleApplyPreset}
        lockedMessage="Subscribe to save your vocal delay presets."
      />

      <div className="flex flex-wrap gap-3">
        {!isPlaying ? (
          <button
            onClick={startPlayback}
            disabled={!audioBuffer || isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            Preview
          </button>
        ) : (
          <>
            <button
              onClick={stopPlayback}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
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
              Rendering...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export WAV
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
        Your audio is processed locally in your browser. Nothing is uploaded or stored.
      </p>
    </div>
  );
}
