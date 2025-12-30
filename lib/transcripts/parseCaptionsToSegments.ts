export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface ParseResult {
  success: boolean;
  segments: CaptionSegment[];
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function parseTimestamp(timestamp: string): number {
  const cleaned = timestamp.trim().replace(",", ".");
  const parts = cleaned.split(":");
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  return parseFloat(cleaned) || 0;
}

function stripTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseVttToSegments(vttContent: string): CaptionSegment[] {
  const lines = vttContent.split("\n");
  const segments: CaptionSegment[] = [];
  
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  let currentText: string[] = [];

  const flushSegment = () => {
    if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
      const text = stripTags(currentText.join(" "));
      if (text) {
        segments.push({ start: currentStart, end: currentEnd, text });
      }
    }
    currentStart = null;
    currentEnd = null;
    currentText = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "WEBVTT" || trimmed === "" || trimmed.startsWith("NOTE") || /^\d+$/.test(trimmed)) {
      flushSegment();
      continue;
    }

    const timestampMatch = trimmed.match(/^(\d{1,2}:)?(\d{1,2}):(\d{2}[.,]\d+)\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2}[.,]\d+)/);
    if (timestampMatch) {
      flushSegment();
      const [fullMatch] = timestampMatch;
      const [startStr, endStr] = fullMatch.split("-->").map(s => s.trim());
      currentStart = parseTimestamp(startStr);
      currentEnd = parseTimestamp(endStr);
      continue;
    }

    if (currentStart !== null) {
      currentText.push(trimmed);
    }
  }

  flushSegment();
  return segments;
}

export function parseSrtToSegments(srtContent: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const blocks = srtContent.split(/\n\s*\n/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    
    let timestampLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timestampLineIndex = i;
        break;
      }
    }

    if (timestampLineIndex === -1) continue;

    const timestampLine = lines[timestampLineIndex];
    const [startStr, endStr] = timestampLine.split("-->").map(s => s.trim());
    
    if (!startStr || !endStr) continue;

    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    
    const textLines = lines.slice(timestampLineIndex + 1);
    const text = stripTags(textLines.join(" "));

    if (text && !isNaN(start) && !isNaN(end)) {
      segments.push({ start, end, text });
    }
  }

  return segments;
}

export function detectFormat(content: string): "vtt" | "srt" | "unknown" {
  const trimmed = content.trim();
  
  if (trimmed.startsWith("WEBVTT")) {
    return "vtt";
  }
  
  const srtPattern = /^\d+\s*\n\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/m;
  if (srtPattern.test(trimmed)) {
    return "srt";
  }
  
  if (trimmed.includes("-->")) {
    const hasVttTimestamp = /\d{1,2}:\d{2}[.,]\d+\s*-->\s*\d{1,2}:\d{2}[.,]\d+/.test(trimmed);
    if (hasVttTimestamp) {
      return "vtt";
    }
  }
  
  return "unknown";
}

export function parseCaptionsToSegments(content: string, filename?: string): ParseResult {
  if (!content || content.trim().length === 0) {
    return { success: false, segments: [], error: "File is empty" };
  }

  const byteSize = new TextEncoder().encode(content).length;
  if (byteSize > MAX_FILE_SIZE) {
    return { success: false, segments: [], error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  let format = detectFormat(content);
  
  if (format === "unknown" && filename) {
    const ext = filename.toLowerCase().split(".").pop();
    if (ext === "vtt") format = "vtt";
    else if (ext === "srt") format = "srt";
  }

  if (format === "unknown") {
    return { 
      success: false, 
      segments: [], 
      error: "Could not detect caption format. Please upload a valid .vtt or .srt file" 
    };
  }

  const segments = format === "vtt" 
    ? parseVttToSegments(content) 
    : parseSrtToSegments(content);

  if (segments.length === 0) {
    return { 
      success: false, 
      segments: [], 
      error: "No timestamps found — are you sure this is an SRT/VTT captions file?" 
    };
  }

  return { success: true, segments };
}

export function validateCaptionFile(filename: string): { valid: boolean; error?: string } {
  const ext = filename.toLowerCase().split(".").pop();
  
  if (!ext || !["vtt", "srt"].includes(ext)) {
    return { valid: false, error: "Only .vtt and .srt files are supported" };
  }
  
  return { valid: true };
}
