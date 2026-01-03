import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getScan, getBrokenTargets, getSourcePages } from "@/lib/siteScan/db";

const TOOL_SLUG = "site-404-scanner";

export async function GET(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");

  if (!scanId) {
    return NextResponse.json({ error: "scanId is required" }, { status: 400 });
  }

  const scan = await getScan(scanId);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "done") {
    return NextResponse.json({ error: "Scan not complete yet" }, { status: 400 });
  }

  const [brokenTargets, sourcePages] = await Promise.all([
    getBrokenTargets(scanId),
    getSourcePages(scanId),
  ]);

  return NextResponse.json({
    brokenTargets: brokenTargets.map(t => ({
      target_url: t.targetUrl,
      status_code: t.statusCode,
      error_type: t.errorType,
      is_soft_404: t.isSoft404,
      times_found: t.timesFound,
      sources: t.sources,
    })),
    sourcePages: sourcePages.map(s => ({
      source_url: s.sourceUrl,
      broken_count: s.brokenCount,
      broken_links: s.brokenLinks.map(l => ({
        target_url: l.targetUrl,
        status_code: l.statusCode,
        error_type: l.errorType,
        is_soft_404: l.isSoft404,
        anchor_text: l.anchorText,
      })),
    })),
  });
}
