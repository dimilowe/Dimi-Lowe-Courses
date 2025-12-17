import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, mkdir, readdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_TRANSCRIPT_SIZE = 2 * 1024 * 1024;
const PROCESS_TIMEOUT = 15000;

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

function isValidYoutubeUrl(url: string): boolean {
  const cleanUrl = url.toLowerCase().trim();
  return cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be");
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

function parseVttToText(vttContent: string): string {
  const lines = vttContent.split("\n");
  const textLines: string[] = [];
  let inCue = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === "WEBVTT" || trimmed === "" || trimmed.startsWith("NOTE")) {
      inCue = false;
      continue;
    }
    
    if (trimmed.includes("-->")) {
      inCue = true;
      continue;
    }
    
    if (inCue && trimmed) {
      const cleanText = trimmed
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
      
      if (cleanText && !textLines.includes(cleanText)) {
        textLines.push(cleanText);
      }
    }
  }
  
  return textLines.join(" ").replace(/\s+/g, " ").trim();
}

async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  } catch {
  }
}

type TranscriptResult = 
  | { ok: true; transcript: string; source: "subtitles" | "auto_subtitles"; language: string }
  | { ok: false; code: "NO_CAPTIONS" | "TOO_LARGE" };

async function fetchTranscriptWithYtDlp(
  videoId: string,
  tempDir: string
): Promise<TranscriptResult> {
  const outputTemplate = path.join(tempDir, "%(id)s.%(ext)s");
  
  const tryFetch = async (useAutoSubs: boolean): Promise<{ content: string | null; tooLarge: boolean }> => {
    const subsFlag = useAutoSubs ? "--write-auto-subs" : "--write-subs";
    const cmd = `yt-dlp ${subsFlag} --sub-langs "en.*,en" --skip-download --no-warnings --no-playlist -o "${outputTemplate}" "https://www.youtube.com/watch?v=${videoId}"`;
    
    try {
      await execAsync(cmd, { timeout: PROCESS_TIMEOUT });
      
      const files = await readdir(tempDir);
      const vttFile = files.find(f => f.endsWith(".vtt"));
      
      if (vttFile) {
        const filePath = path.join(tempDir, vttFile);
        const content = await readFile(filePath, "utf-8");
        
        if (content.length > MAX_TRANSCRIPT_SIZE) {
          return { content: null, tooLarge: true };
        }
        
        return { content, tooLarge: false };
      }
      return { content: null, tooLarge: false };
    } catch {
      return { content: null, tooLarge: false };
    }
  };
  
  let result = await tryFetch(false);
  let source: "subtitles" | "auto_subtitles" = "subtitles";
  
  if (result.tooLarge) {
    return { ok: false, code: "TOO_LARGE" };
  }
  
  if (!result.content) {
    await cleanupTempDir(tempDir);
    await mkdir(tempDir, { recursive: true });
    
    result = await tryFetch(true);
    source = "auto_subtitles";
    
    if (result.tooLarge) {
      return { ok: false, code: "TOO_LARGE" };
    }
  }
  
  if (!result.content) {
    return { ok: false, code: "NO_CAPTIONS" };
  }
  
  const transcript = parseVttToText(result.content);
  
  if (!transcript) {
    return { ok: false, code: "NO_CAPTIONS" };
  }
  
  return {
    ok: true,
    transcript,
    source,
    language: "en"
  };
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;
  
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

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_URL", message: "Only YouTube URLs are supported." },
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

    tempDir = path.join("/tmp", "vcm-ytdlp", randomUUID());
    await mkdir(tempDir, { recursive: true });

    const result = await fetchTranscriptWithYtDlp(videoId, tempDir);
    
    if (!result.ok) {
      if (result.code === "TOO_LARGE") {
        return NextResponse.json({
          ok: false,
          code: "TOO_LARGE",
          message: "This video's transcript is too large to process. Please try a shorter video."
        });
      }
      return NextResponse.json({
        ok: false,
        code: "NO_CAPTIONS",
        message: "Captions are not available for this video. The video may be private, restricted, or have captions disabled."
      });
    }

    return NextResponse.json({
      ok: true,
      videoId,
      transcript: result.transcript,
      source: result.source,
      language: result.language
    });

  } catch (error) {
    console.error("YouTube transcript API error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  }
}
