import { TranscriptSegment } from "./types";

export function normalizeTranscript(
  segments: TranscriptSegment[],
  mergeGapSeconds: number = 0.7
): TranscriptSegment[] {
  if (!segments || segments.length === 0) return [];

  const cleaned = segments
    .map(s => ({
      start: s.start,
      end: s.end,
      text: s.text.trim()
    }))
    .filter(s => s.text.length > 0)
    .sort((a, b) => a.start - b.start);

  if (cleaned.length === 0) return [];

  const merged: TranscriptSegment[] = [];
  let current = { ...cleaned[0] };

  for (let i = 1; i < cleaned.length; i++) {
    const next = cleaned[i];
    const gap = next.start - current.end;
    const currentDuration = current.end - current.start;

    const shouldMerge = gap <= mergeGapSeconds && (currentDuration < 1.2 || gap <= 0.3);

    if (shouldMerge) {
      current.text = current.text + " " + next.text;
      current.end = next.end;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged;
}

export function parseVttTimestamp(timestamp: string): number {
  const parts = timestamp.split(":");
  let hours = 0, minutes = 0, seconds = 0;

  if (parts.length === 3) {
    hours = parseFloat(parts[0]);
    minutes = parseFloat(parts[1]);
    seconds = parseFloat(parts[2].replace(",", "."));
  } else if (parts.length === 2) {
    minutes = parseFloat(parts[0]);
    seconds = parseFloat(parts[1].replace(",", "."));
  }

  return hours * 3600 + minutes * 60 + seconds;
}

export function parseVttToSegments(vttContent: string): TranscriptSegment[] {
  const lines = vttContent.split("\n");
  const segments: TranscriptSegment[] = [];
  
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  let currentText: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "WEBVTT" || trimmed === "" || trimmed.startsWith("NOTE") || /^\d+$/.test(trimmed)) {
      if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
        const text = currentText
          .join(" ")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, " ")
          .trim();

        if (text) {
          segments.push({ start: currentStart, end: currentEnd, text });
        }
        currentStart = null;
        currentEnd = null;
        currentText = [];
      }
      continue;
    }

    const timestampMatch = trimmed.match(/^(\d{1,2}:)?(\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}:\d{2}[.,]\d{3})/);
    if (timestampMatch) {
      if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
        const text = currentText
          .join(" ")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, " ")
          .trim();

        if (text) {
          segments.push({ start: currentStart, end: currentEnd, text });
        }
      }

      const startStr = (timestampMatch[1] || "") + timestampMatch[2];
      const endStr = (timestampMatch[3] || "") + timestampMatch[4];
      currentStart = parseVttTimestamp(startStr);
      currentEnd = parseVttTimestamp(endStr);
      currentText = [];
      continue;
    }

    if (currentStart !== null) {
      currentText.push(trimmed);
    }
  }

  if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
    const text = currentText
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      segments.push({ start: currentStart, end: currentEnd, text });
    }
  }

  return segments;
}
