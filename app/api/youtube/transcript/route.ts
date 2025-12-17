import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", message: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: "Please provide a valid YouTube URL." },
        { status: 400 }
      );
    }

    if (url.length > 500) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: "URL is too long." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url.trim());
    
    if (!videoId) {
      return NextResponse.json(
        { ok: false, code: "INVALID_URL", message: "Could not find a valid YouTube video ID. Please check your URL." },
        { status: 400 }
      );
    }

    try {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptArray || transcriptArray.length === 0) {
        return NextResponse.json({
          ok: false,
          code: "NO_CAPTIONS",
          message: "Captions are not available for this video. The creator may have disabled them."
        });
      }

      const segments = transcriptArray.map((item) => ({
        start: item.offset / 1000,
        dur: item.duration / 1000,
        text: item.text
      }));

      const transcript = transcriptArray.map((item) => item.text).join(" ");

      return NextResponse.json({
        ok: true,
        videoId,
        transcript,
        segments
      });
    } catch (transcriptError: unknown) {
      const errorMessage = transcriptError instanceof Error ? transcriptError.message : String(transcriptError);
      
      if (errorMessage.includes("disabled") || 
          errorMessage.includes("not available") || 
          errorMessage.includes("Could not find") ||
          errorMessage.includes("Transcript is disabled")) {
        return NextResponse.json({
          ok: false,
          code: "NO_CAPTIONS",
          message: "Captions are not available for this video."
        });
      }
      return NextResponse.json({
        ok: false,
        code: "FETCH_ERROR",
        message: "Failed to fetch transcript. The video may be private or have captions disabled."
      });
    }
  } catch (error) {
    console.error("YouTube transcript API error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
