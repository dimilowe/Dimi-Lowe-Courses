import { NextRequest, NextResponse } from "next/server";
import { parseCaptionsToSegments, validateCaptionFile } from "@/lib/transcripts/parseCaptionsToSegments";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
        { success: false, error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    
    let content: string;
    let filename: string = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 }
        );
      }

      filename = file.name;
      
      const validation = validateCaptionFile(filename);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      content = await file.text();
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      content = body.content;
      filename = body.filename || "";
      
      if (!content) {
        return NextResponse.json(
          { success: false, error: "No content provided" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported content type. Use multipart/form-data or application/json" },
        { status: 400 }
      );
    }

    const result = parseCaptionsToSegments(content, filename);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      segments: result.segments,
      count: result.segments.length
    });

  } catch (error) {
    console.error("Parse captions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse captions file" },
      { status: 500 }
    );
  }
}
