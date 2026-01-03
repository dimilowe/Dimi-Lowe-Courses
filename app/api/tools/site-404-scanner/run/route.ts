import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { userSessionOptions, UserSessionData } from "@/lib/user-session";
import { createScan, countUserScansLastHour } from "@/lib/siteScan/db";
import { extractDomain } from "@/lib/siteScan/urlUtils";
import { quickUrlCheck } from "@/lib/siteScan/ssrf";

const TOOL_SLUG = "site-404-scanner";
const MAX_SCANS_PER_HOUR = 5;

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const cookieStore = await cookies();
  const session = await getIronSession<UserSessionData>(cookieStore, userSessionOptions);
  const userId = session.isLoggedIn ? session.userId : undefined;

  if (userId) {
    const recentScans = await countUserScansLastHour(userId);
    if (recentScans >= MAX_SCANS_PER_HOUR) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Maximum ${MAX_SCANS_PER_HOUR} scans per hour.` },
        { status: 429 }
      );
    }
  }

  let body: {
    start_url?: string;
    max_pages?: number;
    max_depth?: number;
    concurrency?: number;
    include_external?: boolean;
    strip_query_params?: boolean;
    soft404_patterns?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { start_url, max_pages, max_depth, concurrency, include_external, strip_query_params, soft404_patterns } = body;

  if (!start_url || typeof start_url !== "string") {
    return NextResponse.json({ error: "start_url is required" }, { status: 400 });
  }

  const urlCheck = quickUrlCheck(start_url);
  if (!urlCheck.valid) {
    return NextResponse.json({ error: urlCheck.error || "Invalid URL" }, { status: 400 });
  }

  const domain = extractDomain(start_url);
  if (!domain) {
    return NextResponse.json({ error: "Could not extract domain from URL" }, { status: 400 });
  }

  try {
    const scanId = await createScan({
      userId,
      startUrl: start_url,
      domain,
      maxPages: Math.min(max_pages || 500, 1000),
      maxDepth: Math.min(max_depth || 6, 10),
      concurrency: Math.min(concurrency || 8, 16),
      includeExternal: include_external || false,
      stripQueryParams: strip_query_params !== false,
      soft404Patterns: soft404_patterns || [],
    });

    return NextResponse.json({ scan_id: scanId });
  } catch (err) {
    console.error("Failed to create scan:", err);
    return NextResponse.json({ error: "Failed to create scan" }, { status: 500 });
  }
}
