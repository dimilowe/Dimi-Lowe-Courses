import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getScan } from "@/lib/siteScan/db";

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

  return NextResponse.json({
    scan: {
      id: scan.id,
      status: scan.status,
      started_at: scan.startedAt,
      finished_at: scan.finishedAt,
      pages_crawled: scan.pagesCrawled,
      links_checked: scan.linksChecked,
      summary_json: scan.summaryJson,
      error_text: scan.errorText,
    },
  });
}
