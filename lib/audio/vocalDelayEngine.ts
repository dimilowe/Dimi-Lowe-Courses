export type Division = "1/4" | "1/8" | "1/16";

export interface DelaySettings {
  bpm: number;
  division: Division;
  feedback: number;
  mix: number;
  pingPong: boolean;
}

const DIVISION_MULTIPLIERS: Record<Division, number> = {
  "1/4": 1.0,
  "1/8": 0.5,
  "1/16": 0.25,
};

const TIME_CONSTANT = 0.01;
const MAX_FEEDBACK = 0.95;
const MIN_BPM = 40;
const MAX_BPM = 240;

export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
}

export function clampFeedback(feedback: number): number {
  return Math.max(0, Math.min(MAX_FEEDBACK, feedback));
}

export function calculateDelayTime(bpm: number, division: Division): number {
  const quarterMs = 60000 / clampBpm(bpm);
  const multiplier = DIVISION_MULTIPLIERS[division];
  return (quarterMs * multiplier) / 1000;
}

export function calculateTailSeconds(delaySeconds: number): number {
  return Math.min(6.0, Math.max(1.0, delaySeconds * 8));
}

export class VocalDelayEngine {
  private ctx: AudioContext | OfflineAudioContext;
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private delayL: DelayNode;
  private delayR: DelayNode;
  private fbL: GainNode;
  private fbR: GainNode;
  private selfLoopL: GainNode;
  private selfLoopR: GainNode;
  private merger: ChannelMergerNode;
  private splitter: ChannelSplitterNode;
  
  private settings: DelaySettings = {
    bpm: 120,
    division: "1/8",
    feedback: 0.35,
    mix: 0.25,
    pingPong: true,
  };

  constructor(ctx: AudioContext | OfflineAudioContext) {
    this.ctx = ctx;
    
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    
    const maxDelayTime = 3.0;
    this.delayL = ctx.createDelay(maxDelayTime);
    this.delayR = ctx.createDelay(maxDelayTime);
    
    this.fbL = ctx.createGain();
    this.fbR = ctx.createGain();
    this.selfLoopL = ctx.createGain();
    this.selfLoopR = ctx.createGain();
    
    this.merger = ctx.createChannelMerger(2);
    this.splitter = ctx.createChannelSplitter(2);
    
    this.buildGraph();
    this.applySettings();
  }

  private buildGraph() {
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    this.input.connect(this.splitter);
    
    this.splitter.connect(this.delayL, 0);
    this.splitter.connect(this.delayR, 1);
    
    this.delayL.connect(this.fbL);
    this.fbL.connect(this.delayR);
    
    this.delayR.connect(this.fbR);
    this.fbR.connect(this.delayL);
    
    this.delayL.connect(this.selfLoopL);
    this.selfLoopL.connect(this.delayL);
    
    this.delayR.connect(this.selfLoopR);
    this.selfLoopR.connect(this.delayR);
    
    this.delayL.connect(this.merger, 0, 0);
    this.delayR.connect(this.merger, 0, 1);
    
    this.merger.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }

  private applySettings() {
    const { bpm, division, feedback, mix, pingPong } = this.settings;
    const time = this.ctx.currentTime;
    
    const delayTime = calculateDelayTime(bpm, division);
    this.delayL.delayTime.setTargetAtTime(delayTime, time, TIME_CONSTANT);
    this.delayR.delayTime.setTargetAtTime(delayTime, time, TIME_CONSTANT);
    
    const clampedFeedback = clampFeedback(feedback);
    
    if (pingPong) {
      this.fbL.gain.setTargetAtTime(clampedFeedback, time, TIME_CONSTANT);
      this.fbR.gain.setTargetAtTime(clampedFeedback, time, TIME_CONSTANT);
      this.selfLoopL.gain.setTargetAtTime(0, time, TIME_CONSTANT);
      this.selfLoopR.gain.setTargetAtTime(0, time, TIME_CONSTANT);
    } else {
      this.fbL.gain.setTargetAtTime(0, time, TIME_CONSTANT);
      this.fbR.gain.setTargetAtTime(0, time, TIME_CONSTANT);
      this.selfLoopL.gain.setTargetAtTime(clampedFeedback, time, TIME_CONSTANT);
      this.selfLoopR.gain.setTargetAtTime(clampedFeedback, time, TIME_CONSTANT);
    }
    
    const mixValue = Math.max(0, Math.min(1, mix));
    const dryLevel = Math.cos(mixValue * Math.PI / 2);
    const wetLevel = Math.sin(mixValue * Math.PI / 2);
    
    this.dryGain.gain.setTargetAtTime(dryLevel, time, TIME_CONSTANT);
    this.wetGain.gain.setTargetAtTime(wetLevel, time, TIME_CONSTANT);
  }

  getInputNode(): GainNode {
    return this.input;
  }

  getOutputNode(): GainNode {
    return this.output;
  }

  setTempo(bpm: number, division: Division) {
    this.settings.bpm = clampBpm(bpm);
    this.settings.division = division;
    this.applySettings();
  }

  setFeedback(value: number) {
    this.settings.feedback = clampFeedback(value);
    this.applySettings();
  }

  setMix(value: number) {
    this.settings.mix = Math.max(0, Math.min(1, value));
    this.applySettings();
  }

  setPingPong(enabled: boolean) {
    this.settings.pingPong = enabled;
    this.applySettings();
  }

  getSettings(): DelaySettings {
    return { ...this.settings };
  }

  getDelayTimeMs(): number {
    return calculateDelayTime(this.settings.bpm, this.settings.division) * 1000;
  }

  disconnect() {
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.delayL.disconnect();
    this.delayR.disconnect();
    this.fbL.disconnect();
    this.fbR.disconnect();
    this.selfLoopL.disconnect();
    this.selfLoopR.disconnect();
    this.merger.disconnect();
    this.splitter.disconnect();
  }
}

export async function renderOffline(
  audioBuffer: AudioBuffer,
  settings: DelaySettings
): Promise<AudioBuffer> {
  const delayTime = calculateDelayTime(settings.bpm, settings.division);
  const tailSeconds = calculateTailSeconds(delayTime);
  const tailFrames = Math.ceil(tailSeconds * audioBuffer.sampleRate);
  const totalLength = audioBuffer.length + tailFrames;
  
  const offlineCtx = new OfflineAudioContext(
    2,
    totalLength,
    audioBuffer.sampleRate
  );
  
  const engine = new VocalDelayEngine(offlineCtx);
  engine.setTempo(settings.bpm, settings.division);
  engine.setFeedback(settings.feedback);
  engine.setMix(settings.mix);
  engine.setPingPong(settings.pingPong);
  
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(engine.getInputNode());
  engine.getOutputNode().connect(offlineCtx.destination);
  
  source.start(0);
  
  const renderedBuffer = await offlineCtx.startRendering();
  engine.disconnect();
  
  return renderedBuffer;
}
