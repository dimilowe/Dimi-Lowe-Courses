import { NextRequest, NextResponse } from "next/server";
import {
  TranscriptSegment,
  ClipRadarOptions,
  ClipRadarResult,
  ClipPeak,
  DEFAULT_OPTIONS,
  MAX_SEGMENTS,
  MAX_DURATION_SECONDS
} from "@/lib/clipradar/types";
import { normalizeTranscript } from "@/lib/clipradar/normalizeTranscript";
import { scoreTranscript } from "@/lib/clipradar/scoreTranscript";
import { selectPeaks } from "@/lib/clipradar/selectPeaks";
import { buildWindows } from "@/lib/clipradar/buildWindows";
import { generateMetadata } from "@/lib/clipradar/generateMetadata";
import { generateExports } from "@/lib/clipradar/exports";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateOptions(options: Partial<ClipRadarOptions>): ClipRadarOptions {
  return {
    style: options.style && ["balanced", "hype", "funny", "rage", "educational"].includes(options.style)
      ? options.style
      : DEFAULT_OPTIONS.style,
    minScore: typeof options.minScore === "number" && options.minScore >= 0 && options.minScore <= 100
      ? options.minScore
      : DEFAULT_OPTIONS.minScore,
    maxResults: typeof options.maxResults === "number" && options.maxResults >= 1 && options.maxResults <= 50
      ? options.maxResults
      : DEFAULT_OPTIONS.maxResults,
    mergeGapSeconds: typeof options.mergeGapSeconds === "number" && options.mergeGapSeconds >= 0
      ? options.mergeGapSeconds
      : DEFAULT_OPTIONS.mergeGapSeconds,
    windows: {
      short: options.windows?.short ?? DEFAULT_OPTIONS.windows.short,
      standard: options.windows?.standard ?? DEFAULT_OPTIONS.windows.standard,
      long: options.windows?.long ?? DEFAULT_OPTIONS.windows.long
    }
  };
}

function validateSegments(segments: unknown): segments is TranscriptSegment[] {
  if (!Array.isArray(segments)) return false;
  if (segments.length === 0) return false;
  if (segments.length > MAX_SEGMENTS) return false;
  
  return segments.every(seg => 
    typeof seg === "object" &&
    seg !== null &&
    typeof seg.start === "number" &&
    typeof seg.end === "number" &&
    typeof seg.text === "string" &&
    seg.start >= 0 &&
    seg.end >= seg.start
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { segments, options: rawOptions, videoUrl } = body;

    if (!validateSegments(segments)) {
      return NextResponse.json(
        { error: `Invalid segments. Provide an array of {start, end, text} objects (max ${MAX_SEGMENTS}).` },
        { status: 400 }
      );
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment.end > MAX_DURATION_SECONDS) {
      return NextResponse.json(
        { error: `Video too long. Maximum duration is ${MAX_DURATION_SECONDS / 3600} hours.` },
        { status: 400 }
      );
    }

    const options = validateOptions(rawOptions || {});

    const normalized = normalizeTranscript(segments, options.mergeGapSeconds);
    
    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "No valid transcript segments after processing." },
        { status: 400 }
      );
    }

    const scored = scoreTranscript(normalized, options.style);

    const peaks = selectPeaks(
      scored,
      options.minScore,
      options.maxResults,
      options.windows.standard
    );

    const results: ClipPeak[] = peaks.map(peak => {
      const windows = buildWindows(peak, options.windows, normalized);
      const metadata = generateMetadata(peak.segment);
      
      return {
        rank: peak.rank,
        peakTime: Math.round(peak.peakTime * 100) / 100,
        score: peak.segment.score,
        category: metadata.category,
        reasons: peak.segment.reasons,
        windows,
        titles: metadata.titles,
        captions: metadata.captions,
        segment: peak.segment
      };
    });

    const exports = generateExports(results);

    const durationSec = normalized.length > 0 
      ? normalized[normalized.length - 1].end 
      : 0;

    const result: ClipRadarResult = {
      videoUrl: typeof videoUrl === "string" ? videoUrl : "",
      stats: {
        segmentsIn: segments.length,
        segmentsMerged: normalized.length,
        durationSec: Math.round(durationSec)
      },
      results,
      exports
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("ClipRadar analyze error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
