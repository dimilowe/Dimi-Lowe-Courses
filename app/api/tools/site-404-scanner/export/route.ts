import { NextRequest, NextResponse } from "next/server";
import { gateToolForRequest } from "@/lib/entitlements/withToolGate";
import { getScan, getAllLinks } from "@/lib/siteScan/db";

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

  const links = await getAllLinks(scanId);

  const csvRows = [
    ["source_url", "target_url", "status_code", "error_type", "is_soft_404", "anchor_text", "is_internal"].join(","),
  ];

  for (const link of links) {
    const row = [
      escapeCsv(link.sourceUrl),
      escapeCsv(link.targetUrl),
      link.statusCode?.toString() || "",
      link.errorType || "",
      link.isSoft404 ? "true" : "false",
      escapeCsv(link.anchorText || ""),
      link.isInternal ? "true" : "false",
    ];
    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="scan-${scanId}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
