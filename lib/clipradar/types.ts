export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface SegmentFeatures {
  emotionHits: number;
  eventHits: number;
  audienceHits: number;
  educationalHits: number;
  paceWps: number;
  punctCount: number;
  repetitionScore: number;
}

export interface ScoredSegment extends TranscriptSegment {
  score: number;
  reasons: string[];
  features: SegmentFeatures;
}

export interface ClipWindow {
  start: number;
  end: number;
}

export interface ClipWindows {
  short: ClipWindow;
  standard: ClipWindow;
  long: ClipWindow;
}

export interface ClipPeak {
  rank: number;
  peakTime: number;
  score: number;
  category: ClipCategory;
  reasons: string[];
  windows: ClipWindows;
  titles: string[];
  captions: string[];
  segment: ScoredSegment;
}

export type ClipStyle = "balanced" | "hype" | "funny" | "rage" | "educational";

export type ClipCategory = "hype" | "funny" | "rage" | "educational" | "highlight" | "unknown";

export interface WindowConfig {
  short: number;
  standard: number;
  long: number;
}

export interface ClipRadarOptions {
  style: ClipStyle;
  minScore: number;
  maxResults: number;
  mergeGapSeconds: number;
  windows: WindowConfig;
}

export interface ClipRadarStats {
  segmentsIn: number;
  segmentsMerged: number;
  durationSec: number;
}

export interface ClipRadarExports {
  csv: string;
  youtubeTimestamps: string;
  markersCsv: string;
}

export interface ClipRadarResult {
  videoUrl: string;
  stats: ClipRadarStats;
  results: ClipPeak[];
  exports: ClipRadarExports;
}

export const DEFAULT_OPTIONS: ClipRadarOptions = {
  style: "balanced",
  minScore: 55,
  maxResults: 20,
  mergeGapSeconds: 0.7,
  windows: {
    short: 10,
    standard: 20,
    long: 40
  }
};

export const MAX_SEGMENTS = 20000;
export const MAX_DURATION_SECONDS = 6 * 60 * 60;
