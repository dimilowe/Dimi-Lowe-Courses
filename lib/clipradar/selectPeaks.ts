import { ScoredSegment } from "./types";

export interface SelectedPeak {
  rank: number;
  segment: ScoredSegment;
  peakTime: number;
}

export function selectPeaks(
  segments: ScoredSegment[],
  minScore: number,
  maxResults: number,
  suppressionWindowSeconds: number = 20
): SelectedPeak[] {
  const sorted = [...segments]
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const selected: SelectedPeak[] = [];
  const suppressedTimes = new Set<number>();

  for (const segment of sorted) {
    if (selected.length >= maxResults) break;

    const peakTime = (segment.start + segment.end) / 2;
    
    let isSuppressed = false;
    for (const existingTime of suppressedTimes) {
      if (Math.abs(peakTime - existingTime) < suppressionWindowSeconds) {
        isSuppressed = true;
        break;
      }
    }

    if (isSuppressed) continue;

    selected.push({
      rank: selected.length + 1,
      segment,
      peakTime
    });

    suppressedTimes.add(peakTime);
  }

  return selected;
}
