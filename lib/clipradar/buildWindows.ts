import { ClipWindow, ClipWindows, WindowConfig, TranscriptSegment } from "./types";
import { SelectedPeak } from "./selectPeaks";

export function buildWindows(
  peak: SelectedPeak,
  windowConfig: WindowConfig,
  segments: TranscriptSegment[]
): ClipWindows {
  const peakTime = peak.peakTime;
  const lastEnd = segments.length > 0 ? segments[segments.length - 1].end : peakTime + windowConfig.long;

  const buildWindow = (halfWidth: number): ClipWindow => {
    let start = Math.max(0, peakTime - halfWidth);
    let end = Math.min(lastEnd, peakTime + halfWidth);

    const startSegment = segments.find(s => s.start <= start && s.end >= start);
    if (startSegment) {
      start = startSegment.start;
    } else {
      const nearestBefore = segments.filter(s => s.end <= start).sort((a, b) => b.end - a.end)[0];
      if (nearestBefore && start - nearestBefore.end < 2) {
        start = nearestBefore.start;
      }
    }

    const endSegment = segments.find(s => s.start <= end && s.end >= end);
    if (endSegment) {
      end = endSegment.end;
    } else {
      const nearestAfter = segments.filter(s => s.start >= end).sort((a, b) => a.start - b.start)[0];
      if (nearestAfter && nearestAfter.start - end < 2) {
        end = nearestAfter.end;
      }
    }

    return {
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100
    };
  };

  return {
    short: buildWindow(windowConfig.short / 2),
    standard: buildWindow(windowConfig.standard / 2),
    long: buildWindow(windowConfig.long / 2)
  };
}

export function buildAllWindows(
  peaks: SelectedPeak[],
  windowConfig: WindowConfig,
  segments: TranscriptSegment[]
): Map<number, ClipWindows> {
  const result = new Map<number, ClipWindows>();
  for (const peak of peaks) {
    result.set(peak.rank, buildWindows(peak, windowConfig, segments));
  }
  return result;
}
