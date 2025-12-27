import { encodeWav, downloadBlob } from "./wav";

export interface DoublerSettings {
  mix: number;
  width: number;
  baseDelay: number;
  range: number;
  wow: number;
  flutter: number;
  satDrive: number;
  satTone: number;
  panA: number;
  panB: number;
  phaseInvert: boolean;
  lowLatency: boolean;
  lfoRate: number;
}

export const DEFAULT_DOUBLER_SETTINGS: DoublerSettings = {
  mix: 0.5,
  width: 1.0,
  baseDelay: 20,
  range: 5,
  wow: 0.3,
  flutter: 0.2,
  satDrive: 0,
  satTone: 12000,
  panA: -0.3,
  panB: 0.3,
  phaseInvert: false,
  lowLatency: false,
  lfoRate: 0.5,
};

class OfflineDoublerProcessor {
  private sampleRate: number;
  private maxDelaySamples: number;
  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writeIndex: number = 0;
  private wanderL: number = 0;
  private wanderR: number = 0;
  private wanderCounter: number = 0;
  private lfoPhase: number = 0;
  private lpStateL: number = 0;
  private lpStateR: number = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.maxDelaySamples = Math.ceil(0.2 * sampleRate);
    this.delayBufferL = new Float32Array(this.maxDelaySamples);
    this.delayBufferR = new Float32Array(this.maxDelaySamples);
  }

  private random(): number {
    return Math.random() * 2 - 1;
  }

  private updateWander(): void {
    const step = 0.02;
    this.wanderL += this.random() * step;
    this.wanderR += this.random() * step;
    this.wanderL = Math.max(-1, Math.min(1, this.wanderL));
    this.wanderR = Math.max(-1, Math.min(1, this.wanderR));
  }

  private readInterpolated(buffer: Float32Array, pos: number): number {
    const len = buffer.length;
    const idx0 = Math.floor(pos);
    const frac = pos - idx0;
    const i0 = ((idx0 % len) + len) % len;
    const i1 = ((idx0 + 1) % len + len) % len;
    return buffer[i0] * (1 - frac) + buffer[i1] * frac;
  }

  private saturate(x: number, drive: number): number {
    if (drive <= 0) return x;
    const preGain = 1 + drive * 3;
    return Math.tanh(x * preGain) / preGain * (1 + drive * 0.5);
  }

  private lowpass(input: number, state: number, cutoff: number): number {
    const rc = 1.0 / (2 * Math.PI * cutoff);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);
    return state + alpha * (input - state);
  }

  process(inputL: Float32Array, inputR: Float32Array, settings: DoublerSettings): { left: Float32Array; right: Float32Array } {
    const length = inputL.length;
    const outL = new Float32Array(length);
    const outR = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      this.wanderCounter++;
      if (this.wanderCounter >= 256) {
        this.wanderCounter = 0;
        this.updateWander();
      }

      const lfoInc = (settings.lfoRate * 2 * Math.PI) / this.sampleRate;
      this.lfoPhase += lfoInc;
      if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;

      const lfoVal = Math.sin(this.lfoPhase);
      const flutterNoiseL = this.random() * 0.1;
      const flutterNoiseR = this.random() * 0.1;

      let effectiveRange = settings.range;
      let effectiveWow = settings.wow;
      let effectiveFlutter = settings.flutter;

      if (settings.lowLatency) {
        effectiveRange = Math.min(effectiveRange, 5);
        effectiveWow = 0;
        effectiveFlutter = 0;
      }

      let modL = effectiveRange * (
        effectiveWow * this.wanderL +
        effectiveFlutter * (lfoVal + flutterNoiseL)
      ) * settings.width;

      let modR = effectiveRange * (
        effectiveWow * this.wanderR +
        effectiveFlutter * (lfoVal + flutterNoiseR)
      ) * settings.width;

      let delayMsL = Math.max(1, Math.min(199, settings.baseDelay + modL));
      let delayMsR = Math.max(1, Math.min(199, settings.baseDelay + modR));

      const delaySamplesL = (delayMsL / 1000) * this.sampleRate;
      const delaySamplesR = (delayMsR / 1000) * this.sampleRate;

      this.delayBufferL[this.writeIndex] = inputL[i];
      this.delayBufferR[this.writeIndex] = inputR[i];

      let readPosL = this.writeIndex - delaySamplesL;
      let readPosR = this.writeIndex - delaySamplesR;
      if (readPosL < 0) readPosL += this.maxDelaySamples;
      if (readPosR < 0) readPosR += this.maxDelaySamples;

      let wetL = this.readInterpolated(this.delayBufferL, readPosL);
      let wetR = this.readInterpolated(this.delayBufferR, readPosR);

      if (settings.satDrive > 0.01) {
        wetL = this.saturate(wetL, settings.satDrive);
        wetR = this.saturate(wetR, settings.satDrive);
        this.lpStateL = this.lowpass(wetL, this.lpStateL, settings.satTone);
        this.lpStateR = this.lowpass(wetR, this.lpStateR, settings.satTone);
        wetL = this.lpStateL;
        wetR = this.lpStateR;
      }

      if (settings.phaseInvert) {
        wetL = -wetL;
        wetR = -wetR;
      }

      const panLGainL = Math.cos((settings.panA + 1) * Math.PI / 4);
      const panLGainR = Math.sin((settings.panA + 1) * Math.PI / 4);
      const panRGainL = Math.cos((settings.panB + 1) * Math.PI / 4);
      const panRGainR = Math.sin((settings.panB + 1) * Math.PI / 4);

      const pannedWetL = wetL * panLGainL + wetR * panRGainL;
      const pannedWetR = wetL * panLGainR + wetR * panRGainR;

      const dryGain = Math.cos(settings.mix * Math.PI / 2);
      const wetGain = Math.sin(settings.mix * Math.PI / 2);

      outL[i] = inputL[i] * dryGain + pannedWetL * wetGain;
      outR[i] = inputR[i] * dryGain + pannedWetR * wetGain;

      this.writeIndex = (this.writeIndex + 1) % this.maxDelaySamples;
    }

    return { left: outL, right: outR };
  }
}

export async function renderDoublerOffline(
  audioBuffer: AudioBuffer,
  settings: DoublerSettings,
  maxDurationSeconds?: number
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  let length = audioBuffer.length;
  
  if (maxDurationSeconds && maxDurationSeconds > 0) {
    const maxSamples = Math.floor(maxDurationSeconds * sampleRate);
    length = Math.min(length, maxSamples);
  }

  const inputL = new Float32Array(length);
  const inputR = new Float32Array(length);
  
  audioBuffer.copyFromChannel(inputL, 0, 0);
  if (audioBuffer.numberOfChannels > 1) {
    audioBuffer.copyFromChannel(inputR, 1, 0);
  } else {
    inputR.set(inputL);
  }

  const processor = new OfflineDoublerProcessor(sampleRate);
  const { left, right } = processor.process(inputL, inputR, settings);

  const audioCtx = new AudioContext();
  const resultBuffer = audioCtx.createBuffer(2, length, sampleRate);
  
  const leftChannel = resultBuffer.getChannelData(0);
  const rightChannel = resultBuffer.getChannelData(1);
  leftChannel.set(left);
  rightChannel.set(right);
  
  await audioCtx.close();

  return resultBuffer;
}

export function exportDoublerWav(audioBuffer: AudioBuffer, filename: string = "vcm-vocal-doubler.wav"): void {
  const wavBlob = encodeWav(audioBuffer);
  downloadBlob(wavBlob, filename);
}
