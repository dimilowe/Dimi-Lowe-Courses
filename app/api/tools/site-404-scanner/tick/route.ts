import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { runScanTick, markScanFailed } from "@/lib/siteScan/crawler";
import { getScan } from "@/lib/siteScan/db";

const TOOL_SLUG = "site-404-scanner";

export async function POST(req: NextRequest) {
  const gateResult = await gateToolForRequest(TOOL_SLUG);
  if (!gateResult.allowed) {
    return gateResult.response;
  }

  let body: { scan_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { scan_id } = body;
  if (!scan_id || typeof scan_id !== "string") {
    return NextResponse.json({ error: "scan_id is required" }, { status: 400 });
  }

  const scan = await getScan(scan_id);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status === "done" || scan.status === "failed") {
    return NextResponse.json({
      done: true,
      status: scan.status,
      pages_crawled: scan.pagesCrawled,
      links_checked: scan.linksChecked,
      error_text: scan.errorText,
    });
  }

  try {
    const result = await runScanTick(scan_id);

    return NextResponse.json({
      done: result.done,
      status: result.done ? "done" : "running",
      pages_crawled: result.pagesCrawled,
      links_checked: result.linksChecked,
      error: result.error,
    });
  } catch (err) {
    console.error("Scan tick failed:", err);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await markScanFailed(scan_id, errorMsg);
    return NextResponse.json(
      { done: true, status: "failed", error: errorMsg },
      { status: 500 }
    );
  }
}
