export type BpmCandidate = {
  bpm: number;
  score: number;
};

export type BpmResult = {
  primaryBpm: number;
  confidence: "High" | "Medium" | "Low";
  candidates: BpmCandidate[];
  halfTime?: number;
  doubleTime?: number;
  debug?: {
    ratio: number;
    envelopeRate: number;
    duration: number;
  };
};

const MIN_BPM = 60;
const MAX_BPM = 200;
const MAX_ANALYSIS_SECONDS = 90;
const TARGET_SAMPLE_RATE = 11025;

function downsample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    result[i] = samples[srcIndex];
  }
  
  return result;
}

function toMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const mono = new Float32Array(length);
  
  if (buffer.numberOfChannels === 1) {
    buffer.copyFromChannel(mono, 0);
    return mono;
  }
  
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  
  for (let i = 0; i < length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  
  return mono;
}

function computeOnsetEnvelope(
  samples: Float32Array,
  frameSize: number,
  hopSize: number
): Float32Array {
  const numFrames = Math.floor((samples.length - frameSize) / hopSize) + 1;
  const envelope = new Float32Array(numFrames);
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const sample = samples[start + j];
      sum += sample * sample;
    }
    envelope[i] = Math.sqrt(sum / frameSize);
  }
  
  const flux = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    flux[i] = Math.max(0, envelope[i] - envelope[i - 1]);
  }
  
  const smoothWindow = 6;
  const smoothed = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - smoothWindow); j <= Math.min(numFrames - 1, i + smoothWindow); j++) {
      sum += flux[j];
      count++;
    }
    smoothed[i] = sum / count;
  }
  
  return smoothed;
}

function autocorrelate(
  envelope: Float32Array,
  envelopeRate: number,
  minBpm: number,
  maxBpm: number
): BpmCandidate[] {
  const minLag = Math.floor((60 * envelopeRate) / maxBpm);
  const maxLag = Math.ceil((60 * envelopeRate) / minBpm);
  
  const correlations: { lag: number; value: number }[] = [];
  
  for (let lag = minLag; lag <= Math.min(maxLag, envelope.length / 2); lag++) {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < envelope.length - lag; i++) {
      sum += envelope[i] * envelope[i + lag];
      count++;
    }
    
    if (count > 0) {
      correlations.push({ lag, value: sum / count });
    }
  }
  
  if (correlations.length === 0) {
    return [];
  }
  
  const maxCorr = Math.max(...correlations.map(c => c.value));
  correlations.forEach(c => {
    c.value = c.value / (maxCorr || 1);
  });
  
  const peaks: BpmCandidate[] = [];
  
  for (let i = 1; i < correlations.length - 1; i++) {
    const prev = correlations[i - 1].value;
    const curr = correlations[i].value;
    const next = correlations[i + 1].value;
    
    if (curr > prev && curr > next && curr > 0.1) {
      const bpm = (60 * envelopeRate) / correlations[i].lag;
      peaks.push({ bpm: Math.round(bpm * 10) / 10, score: curr });
    }
  }
  
  peaks.sort((a, b) => b.score - a.score);
  
  const merged: BpmCandidate[] = [];
  for (const peak of peaks) {
    const existing = merged.find(m => Math.abs(m.bpm - peak.bpm) < 2);
    if (!existing) {
      merged.push(peak);
    } else if (peak.score > existing.score) {
      existing.bpm = peak.bpm;
      existing.score = peak.score;
    }
  }
  
  return merged.slice(0, 10);
}

function normalizeToRange(bpm: number): number {
  while (bpm < MIN_BPM) bpm *= 2;
  while (bpm > MAX_BPM) bpm /= 2;
  return Math.round(bpm * 10) / 10;
}

function computeConfidence(
  candidates: BpmCandidate[]
): { label: "High" | "Medium" | "Low"; ratio: number } {
  if (candidates.length < 2) {
    return { label: "Low", ratio: 0 };
  }
  
  const topScore = candidates[0].score;
  const secondScore = candidates[1].score;
  
  if (secondScore === 0) {
    return { label: "High", ratio: Infinity };
  }
  
  const ratio = topScore / secondScore;
  
  if (ratio >= 1.35 && topScore > 0.3) {
    return { label: "High", ratio };
  } else if (ratio >= 1.15) {
    return { label: "Medium", ratio };
  } else {
    return { label: "Low", ratio };
  }
}

export async function detectBpmFromArrayBuffer(
  arrayBuffer: ArrayBuffer
): Promise<BpmResult> {
  const audioContext = new AudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return detectBpmFromAudioBuffer(audioBuffer);
  } finally {
    await audioContext.close();
  }
}

export function detectBpmFromAudioBuffer(audioBuffer: AudioBuffer): BpmResult {
  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  
  let mono = toMono(audioBuffer);
  
  const maxSamples = MAX_ANALYSIS_SECONDS * sampleRate;
  if (mono.length > maxSamples) {
    mono = mono.slice(0, maxSamples);
  }
  
  const downsampled = downsample(mono, sampleRate, TARGET_SAMPLE_RATE);
  
  const frameSize = 1024;
  const hopSize = 512;
  const envelopeRate = TARGET_SAMPLE_RATE / hopSize;
  
  const envelope = computeOnsetEnvelope(downsampled, frameSize, hopSize);
  
  let candidates = autocorrelate(envelope, envelopeRate, MIN_BPM, MAX_BPM);
  
  if (candidates.length === 0) {
    return {
      primaryBpm: 120,
      confidence: "Low",
      candidates: [],
      debug: { ratio: 0, envelopeRate, duration },
    };
  }
  
  let primaryBpm = normalizeToRange(candidates[0].bpm);
  
  const normalizedCandidates = candidates.map(c => ({
    bpm: normalizeToRange(c.bpm),
    score: c.score,
  }));
  
  const uniqueCandidates: BpmCandidate[] = [];
  for (const c of normalizedCandidates) {
    if (!uniqueCandidates.find(u => Math.abs(u.bpm - c.bpm) < 2)) {
      uniqueCandidates.push(c);
    }
  }
  
  const { label, ratio } = computeConfidence(uniqueCandidates);
  
  let confidence = label;
  if (duration < 8) {
    confidence = "Low";
  }
  
  const halfTime = primaryBpm / 2 >= 30 ? Math.round(primaryBpm / 2 * 10) / 10 : undefined;
  const doubleTime = primaryBpm * 2 <= 300 ? Math.round(primaryBpm * 2 * 10) / 10 : undefined;
  
  return {
    primaryBpm,
    confidence,
    candidates: uniqueCandidates.slice(0, 5),
    halfTime,
    doubleTime,
    debug: { ratio, envelopeRate, duration },
  };
}
