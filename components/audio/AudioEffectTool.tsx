"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Play, Pause, Square, Download, Loader2, Music2 } from "lucide-react";
import { encodeWav, downloadBlob } from "@/lib/audio/wav";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { TOOL_QUICK_IMPORT_EVENT, type ToolQuickImportDetail } from "@/lib/workspace/toolQuickImport";
import { fileFromWorkspaceDrag } from "@/lib/workspace/workspaceDragImport";

export type AudioEffectKind =
  | "pitch-shift"
  | "reverb"
  | "delay"
  | "compressor"
  | "limiter"
  | "high-pass"
  | "low-pass"
  | "bitcrusher"
  | "effect-chain"
  | "vocal-chain";

type EffectSettings = {
  bypass: boolean;
  mix: number;
  outputGain: number;
  semitones: number;
  roomSize: number;
  damp: number;
  preDelay: number;
  delayMs: number;
  feedback: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  frequency: number;
  q: number;
  bits: number;
  downsample: number;
  chainCompressorOn: boolean;
  chainEqOn: boolean;
  chainReverbOn: boolean;
  chainDelayOn: boolean;
};

const DEFAULT_SETTINGS: EffectSettings = {
  bypass: false,
  mix: 0.5,
  outputGain: 1,
  semitones: 0,
  roomSize: 0.35,
  damp: 0.4,
  preDelay: 20,
  delayMs: 220,
  feedback: 0.25,
  threshold: -24,
  ratio: 4,
  attack: 0.01,
  release: 0.25,
  knee: 18,
  frequency: 180,
  q: 0.707,
  bits: 8,
  downsample: 4,
  chainCompressorOn: true,
  chainEqOn: true,
  chainReverbOn: false,
  chainDelayOn: false,
};

type PresetRecord = ToolPresetRecord<EffectSettings>;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function createImpulseResponse(ctx: BaseAudioContext, roomSize: number, damp: number) {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * (0.4 + roomSize * 3.6)));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const dampFactor = 1 - clamp01(damp);

  for (let c = 0; c < 2; c++) {
    const ch = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, 1 + roomSize * 3) * dampFactor;
      ch[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  return impulse;
}

function createBitcrusherNode(ctx: AudioContext | OfflineAudioContext, bits: number, downsample: number) {
  const processor = ctx.createScriptProcessor(2048, 2, 2);
  const levels = Math.max(2, Math.pow(2, Math.max(2, Math.min(16, bits))));
  const holdSamples = Math.max(1, Math.floor(downsample));
  let holdL = 0;
  let holdR = 0;
  let count = 0;

  processor.onaudioprocess = (e) => {
    const inL = e.inputBuffer.getChannelData(0);
    const inR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inL;
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);

    for (let i = 0; i < inL.length; i++) {
      if (count % holdSamples === 0) {
        holdL = Math.round(inL[i] * levels) / levels;
        holdR = Math.round(inR[i] * levels) / levels;
      }
      outL[i] = holdL;
      outR[i] = holdR;
      count += 1;
    }
  };

  return processor;
}

function applyBitcrusherBufferInPlace(buffer: AudioBuffer, bits: number, downsample: number) {
  const levels = Math.max(2, Math.pow(2, Math.max(2, Math.min(16, bits))));
  const holdSamples = Math.max(1, Math.floor(downsample));

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    let hold = 0;
    for (let i = 0; i < data.length; i++) {
      if (i % holdSamples === 0) {
        hold = Math.round(data[i] * levels) / levels;
      }
      data[i] = hold;
    }
  }
}

function toolDefaults(kind: AudioEffectKind): EffectSettings {
  const d = { ...DEFAULT_SETTINGS };
  if (kind === "pitch-shift") return { ...d, mix: 1, semitones: 3 };
  if (kind === "reverb") return { ...d, mix: 0.4, roomSize: 0.55, damp: 0.35 };
  if (kind === "delay") return { ...d, mix: 0.35, delayMs: 260, feedback: 0.32 };
  if (kind === "compressor") return { ...d, mix: 1, threshold: -22, ratio: 4.5, attack: 0.015, release: 0.2 };
  if (kind === "limiter") return { ...d, mix: 1, threshold: -6, ratio: 20, attack: 0.003, release: 0.08, knee: 0 };
  if (kind === "high-pass") return { ...d, mix: 1, frequency: 120, q: 0.707 };
  if (kind === "low-pass") return { ...d, mix: 1, frequency: 5000, q: 0.707 };
  if (kind === "bitcrusher") return { ...d, mix: 0.8, bits: 8, downsample: 5 };
  if (kind === "effect-chain") {
    return {
      ...d,
      mix: 1,
      threshold: -20,
      ratio: 3,
      frequency: 130,
      roomSize: 0.4,
      delayMs: 200,
      feedback: 0.2,
      chainCompressorOn: true,
      chainEqOn: true,
      chainReverbOn: true,
      chainDelayOn: false,
    };
  }
  return {
    ...d,
    mix: 1,
    threshold: -18,
    ratio: 3.5,
    frequency: 110,
    roomSize: 0.35,
    delayMs: 160,
    feedback: 0.16,
    chainCompressorOn: true,
    chainEqOn: true,
    chainReverbOn: true,
    chainDelayOn: true,
  };
}

export default function AudioEffectTool({
  kind,
  toolId,
  originCloudId = "music",
  downloadName,
}: {
  kind: AudioEffectKind;
  toolId: string;
  originCloudId?: string;
  downloadName: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [settings, setSettings] = useState<EffectSettings>(() => toolDefaults(kind));

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const dynNodesRef = useRef<AudioNode[]>([]);

  const { presets, savingPreset, savePreset } = useToolPresets<EffectSettings>({
    toolId,
    originCloudId,
  });

  const getCtx = useCallback(async () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const clearRuntimeNodes = useCallback(() => {
    for (const n of dynNodesRef.current) {
      try {
        if (typeof n.disconnect === "function") n.disconnect();
      } catch {}
    }
    dynNodesRef.current = [];
  }, []);

  const stopPlayback = useCallback(() => {
    try {
      sourceRef.current?.stop();
    } catch {}
    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;
    clearRuntimeNodes();
    setPlaying(false);
  }, [clearRuntimeNodes]);

  const decodeFile = useCallback(async (f: File) => {
    setLoading(true);
    setError(null);
    try {
      const arr = await f.arrayBuffer();
      const ctx = await getCtx();
      const decoded = await ctx.decodeAudioData(arr.slice(0));
      setFile(f);
      setAudioBuffer(decoded);
    } catch {
      setError("Could not decode this audio file. Try WAV, MP3, M4A, or OGG.");
      setFile(null);
      setAudioBuffer(null);
    } finally {
      setLoading(false);
    }
  }, [getCtx]);

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await decodeFile(f);
  };

  const onDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const nativeFile = e.dataTransfer.files?.[0];
    if (nativeFile) {
      await decodeFile(nativeFile);
      return;
    }
    const workspaceFile = await fileFromWorkspaceDrag(e.dataTransfer);
    if (workspaceFile) await decodeFile(workspaceFile);
  };

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<ToolQuickImportDetail>).detail;
      if (detail?.file) decodeFile(detail.file);
    };
    window.addEventListener(TOOL_QUICK_IMPORT_EVENT, handler as EventListener);
    return () => window.removeEventListener(TOOL_QUICK_IMPORT_EVENT, handler as EventListener);
  }, [decodeFile]);

  const connectSingleEffect = useCallback(
    (ctx: AudioContext | OfflineAudioContext, input: AudioNode): AudioNode => {
      switch (kind) {
        case "reverb": {
          const convolver = ctx.createConvolver();
          convolver.buffer = createImpulseResponse(ctx, settings.roomSize, settings.damp);
          const preDelay = ctx.createDelay(2);
          preDelay.delayTime.value = Math.max(0, settings.preDelay) / 1000;
          input.connect(preDelay);
          preDelay.connect(convolver);
          dynNodesRef.current.push(preDelay, convolver);
          return convolver;
        }
        case "delay": {
          const delay = ctx.createDelay(2);
          delay.delayTime.value = Math.max(1, settings.delayMs) / 1000;
          const feedback = ctx.createGain();
          feedback.gain.value = clamp01(settings.feedback);
          input.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          dynNodesRef.current.push(delay, feedback);
          return delay;
        }
        case "compressor":
        case "limiter": {
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = settings.threshold;
          comp.ratio.value = settings.ratio;
          comp.attack.value = settings.attack;
          comp.release.value = settings.release;
          comp.knee.value = settings.knee;
          input.connect(comp);
          dynNodesRef.current.push(comp);
          return comp;
        }
        case "high-pass":
        case "low-pass": {
          const biquad = ctx.createBiquadFilter();
          biquad.type = kind === "high-pass" ? "highpass" : "lowpass";
          biquad.frequency.value = settings.frequency;
          biquad.Q.value = settings.q;
          input.connect(biquad);
          dynNodesRef.current.push(biquad);
          return biquad;
        }
        case "bitcrusher": {
          const crush = createBitcrusherNode(ctx, settings.bits, settings.downsample);
          input.connect(crush);
          dynNodesRef.current.push(crush);
          return crush;
        }
        case "effect-chain":
        case "vocal-chain": {
          let current: AudioNode = input;

          if (settings.chainCompressorOn) {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = settings.threshold;
            comp.ratio.value = settings.ratio;
            comp.attack.value = settings.attack;
            comp.release.value = settings.release;
            comp.knee.value = settings.knee;
            current.connect(comp);
            dynNodesRef.current.push(comp);
            current = comp;
          }

          if (settings.chainEqOn) {
            const hp = ctx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = settings.frequency;
            hp.Q.value = settings.q;
            current.connect(hp);
            dynNodesRef.current.push(hp);
            current = hp;
          }

          if (settings.chainReverbOn) {
            const rev = ctx.createConvolver();
            rev.buffer = createImpulseResponse(ctx, settings.roomSize, settings.damp);
            current.connect(rev);
            dynNodesRef.current.push(rev);
            current = rev;
          }

          if (settings.chainDelayOn) {
            const delay = ctx.createDelay(2);
            delay.delayTime.value = Math.max(1, settings.delayMs) / 1000;
            const fb = ctx.createGain();
            fb.gain.value = clamp01(settings.feedback);
            current.connect(delay);
            delay.connect(fb);
            fb.connect(delay);
            dynNodesRef.current.push(delay, fb);
            current = delay;
          }

          return current;
        }
        default:
          return input;
      }
    },
    [kind, settings]
  );

  const startPlayback = useCallback(async () => {
    if (!audioBuffer) return;
    setError(null);
    stopPlayback();

    const ctx = await getCtx();
    const out = ctx.createGain();
    out.gain.value = Math.max(0, settings.outputGain);

    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = settings.bypass ? 1 : Math.cos(clamp01(settings.mix) * Math.PI / 2);
    wet.gain.value = settings.bypass ? 0 : Math.sin(clamp01(settings.mix) * Math.PI / 2);

    out.connect(ctx.destination);

    if (kind === "pitch-shift") {
      const rate = Math.pow(2, settings.semitones / 12);

      const srcDry = ctx.createBufferSource();
      srcDry.buffer = audioBuffer;
      srcDry.playbackRate.value = 1;
      srcDry.connect(dry);
      dry.connect(out);

      const srcWet = ctx.createBufferSource();
      srcWet.buffer = audioBuffer;
      srcWet.playbackRate.value = rate;
      srcWet.connect(wet);
      wet.connect(out);

      srcDry.start(0);
      srcWet.start(0);

      sourceRef.current = srcDry;
      dynNodesRef.current.push(srcWet, out, dry, wet);

      srcDry.onended = () => setPlaying(false);
      setPlaying(true);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(dry);
    dry.connect(out);

    const effectOut = connectSingleEffect(ctx, source);
    effectOut.connect(wet);
    wet.connect(out);

    source.start(0);
    source.onended = () => setPlaying(false);

    sourceRef.current = source;
    dynNodesRef.current.push(out, dry, wet);

    setPlaying(true);
  }, [audioBuffer, connectSingleEffect, getCtx, kind, settings, stopPlayback]);

  const exportAudioLocal = useCallback(async () => {
    if (!audioBuffer) return;
    const rate = kind === "pitch-shift" ? Math.pow(2, settings.semitones / 12) : 1;
    const length = Math.ceil(audioBuffer.length / Math.max(0.5, Math.min(2, rate)) + audioBuffer.sampleRate * 2);
    const offline = new OfflineAudioContext(2, length, audioBuffer.sampleRate);

    const out = offline.createGain();
    out.gain.value = Math.max(0, settings.outputGain);
    out.connect(offline.destination);

    const dry = offline.createGain();
    const wet = offline.createGain();
    dry.gain.value = settings.bypass ? 1 : Math.cos(clamp01(settings.mix) * Math.PI / 2);
    wet.gain.value = settings.bypass ? 0 : Math.sin(clamp01(settings.mix) * Math.PI / 2);

    if (kind === "pitch-shift") {
      const srcDry = offline.createBufferSource();
      srcDry.buffer = audioBuffer;
      srcDry.playbackRate.value = 1;
      srcDry.connect(dry);
      dry.connect(out);

      const srcWet = offline.createBufferSource();
      srcWet.buffer = audioBuffer;
      srcWet.playbackRate.value = rate;
      srcWet.connect(wet);
      wet.connect(out);

      srcDry.start(0);
      srcWet.start(0);
    } else {
      const src = offline.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(dry);
      dry.connect(out);

      const effectOut = connectSingleEffect(offline, src);
      effectOut.connect(wet);
      wet.connect(out);

      src.start(0);
    }

    const rendered = await offline.startRendering();
    if (kind === "bitcrusher") {
      applyBitcrusherBufferInPlace(rendered, settings.bits, settings.downsample);
    }
    const blob = encodeWav(rendered);
    downloadBlob(blob, downloadName);
  }, [audioBuffer, connectSingleEffect, downloadName, kind, settings]);

  const exportAudio = useCallback(async () => {
    if (!file && !audioBuffer) return;
    setExporting(true);
    setError(null);

    try {
      if (file) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);
        body.append("settings", JSON.stringify(settings));

        const res = await fetch("/api/audio/pedalboard", {
          method: "POST",
          body,
        });

        if (res.ok) {
          const blob = await res.blob();
          downloadBlob(blob, downloadName);
          return;
        }

        const payload = await res.json().catch(() => ({}));
        console.warn("Pedalboard server render failed; falling back to browser render.", payload);
      }

      await exportAudioLocal();
    } catch (e) {
      console.error(e);
      setError("Export failed. Try a shorter file or lower settings.");
    } finally {
      setExporting(false);
    }
  }, [audioBuffer, downloadName, exportAudioLocal, file, kind, settings]);

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, settings);
    if (ok) setPresetName("");
  };

  const applyPreset = (preset: PresetRecord) => {
    setSettings({ ...toolDefaults(kind), ...preset.preset_json });
  };

  const setNum = (key: keyof EffectSettings, value: number) => setSettings((s) => ({ ...s, [key]: value }));
  const setBool = (key: keyof EffectSettings, value: boolean) => setSettings((s) => ({ ...s, [key]: value }));

  const secondaryControls = useMemo(() => {
    switch (kind) {
      case "pitch-shift":
        return (
          <>
            <Range label="Semitones" min={-12} max={12} step={1} value={settings.semitones} onChange={(v) => setNum("semitones", v)} />
            <p className="text-xs text-gray-500">Positive raises pitch, negative lowers. Like pedalboard PitchShift style behavior.</p>
          </>
        );
      case "reverb":
        return (
          <>
            <Range label="Room Size" min={0} max={1} step={0.01} value={settings.roomSize} onChange={(v) => setNum("roomSize", v)} />
            <Range label="Damping" min={0} max={1} step={0.01} value={settings.damp} onChange={(v) => setNum("damp", v)} />
            <Range label="Pre-delay (ms)" min={0} max={250} step={1} value={settings.preDelay} onChange={(v) => setNum("preDelay", v)} />
          </>
        );
      case "delay":
        return (
          <>
            <Range label="Delay Time (ms)" min={10} max={1200} step={1} value={settings.delayMs} onChange={(v) => setNum("delayMs", v)} />
            <Range label="Feedback" min={0} max={0.95} step={0.01} value={settings.feedback} onChange={(v) => setNum("feedback", v)} />
          </>
        );
      case "compressor":
      case "limiter":
        return (
          <>
            <Range label="Threshold (dB)" min={-60} max={0} step={1} value={settings.threshold} onChange={(v) => setNum("threshold", v)} />
            <Range label="Ratio" min={1} max={kind === "limiter" ? 20 : 12} step={0.5} value={settings.ratio} onChange={(v) => setNum("ratio", v)} />
            <Range label="Attack (s)" min={0.001} max={0.2} step={0.001} value={settings.attack} onChange={(v) => setNum("attack", v)} />
            <Range label="Release (s)" min={0.02} max={1.5} step={0.01} value={settings.release} onChange={(v) => setNum("release", v)} />
          </>
        );
      case "high-pass":
      case "low-pass":
        return (
          <>
            <Range label="Cutoff Frequency (Hz)" min={20} max={20000} step={1} value={settings.frequency} onChange={(v) => setNum("frequency", v)} />
            <Range label="Resonance (Q)" min={0.1} max={20} step={0.1} value={settings.q} onChange={(v) => setNum("q", v)} />
          </>
        );
      case "bitcrusher":
        return (
          <>
            <Range label="Bit Depth" min={2} max={16} step={1} value={settings.bits} onChange={(v) => setNum("bits", v)} />
            <Range label="Downsample" min={1} max={16} step={1} value={settings.downsample} onChange={(v) => setNum("downsample", v)} />
          </>
        );
      case "effect-chain":
      case "vocal-chain":
        return (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Toggle label="Compressor" value={settings.chainCompressorOn} onChange={(v) => setBool("chainCompressorOn", v)} />
              <Toggle label={kind === "vocal-chain" ? "Voice EQ" : "EQ"} value={settings.chainEqOn} onChange={(v) => setBool("chainEqOn", v)} />
              <Toggle label="Reverb" value={settings.chainReverbOn} onChange={(v) => setBool("chainReverbOn", v)} />
              <Toggle label="Delay" value={settings.chainDelayOn} onChange={(v) => setBool("chainDelayOn", v)} />
            </div>
            <Range label="Threshold (dB)" min={-60} max={0} step={1} value={settings.threshold} onChange={(v) => setNum("threshold", v)} />
            <Range label="Ratio" min={1} max={12} step={0.5} value={settings.ratio} onChange={(v) => setNum("ratio", v)} />
            <Range label="EQ High-pass (Hz)" min={20} max={600} step={1} value={settings.frequency} onChange={(v) => setNum("frequency", v)} />
            <Range label="Reverb Size" min={0} max={1} step={0.01} value={settings.roomSize} onChange={(v) => setNum("roomSize", v)} />
            <Range label="Delay (ms)" min={30} max={650} step={1} value={settings.delayMs} onChange={(v) => setNum("delayMs", v)} />
            <Range label="Delay Feedback" min={0} max={0.8} step={0.01} value={settings.feedback} onChange={(v) => setNum("feedback", v)} />
          </>
        );
      default:
        return null;
    }
  }, [kind, settings]);

  useEffect(() => {
    return () => {
      stopPlayback();
      ctxRef.current?.close().catch(() => {});
    };
  }, [stopPlayback]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <label
        className="block border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-6 text-center cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" onChange={onFileInput} className="hidden" />
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Decoding audio...</div>
        ) : file ? (
          <div className="text-gray-800 font-medium">{file.name}</div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-600"><Upload className="w-4 h-4" /> Upload or drop audio file</div>
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={startPlayback} disabled={!audioBuffer || playing} className="px-3 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50 inline-flex items-center gap-2">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? "Playing" : "Preview"}
            </button>
            <button onClick={stopPlayback} disabled={!playing} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 inline-flex items-center gap-2">
              <Square className="w-4 h-4" /> Stop
            </button>
            <button onClick={exportAudio} data-track-output="true" disabled={!audioBuffer || exporting} className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 inline-flex items-center gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
            </button>
          </div>

          <Toggle label="Bypass (A/B)" value={settings.bypass} onChange={(v) => setBool("bypass", v)} />
          <Range label="Wet / Dry Mix" min={0} max={1} step={0.01} value={settings.mix} onChange={(v) => setNum("mix", v)} />
          <Range label="Output Gain" min={0} max={2} step={0.01} value={settings.outputGain} onChange={(v) => setNum("outputGain", v)} />

          <ToolPresetBar
            title="Preset Saving (Subscriber Feature)"
            presetName={presetName}
            onPresetNameChange={setPresetName}
            onSave={handleSavePreset}
            saving={savingPreset}
            presets={presets as PresetRecord[]}
            onApply={applyPreset}
            lockedMessage="Subscribe to save reusable effect presets."
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 inline-flex items-center gap-2"><Music2 className="w-4 h-4" /> Effect Controls</h3>
            <div className="space-y-3">{secondaryControls}</div>
          </div>
          <p className="text-xs text-gray-500">Download uses server Pedalboard processing when available, with browser fallback.</p>
        </div>
      </div>
    </div>
  );
}

function Range({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span>{label}</span>
        <span>{Number.isInteger(value) ? value : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${value ? "bg-green-50 border-green-300 text-green-800" : "bg-white border-gray-300 text-gray-700"}`}>
      {label}: {value ? "On" : "Off"}
    </button>
  );
}
