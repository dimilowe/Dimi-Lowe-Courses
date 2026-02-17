import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { getOpsMetricsSnapshot } from "@/lib/ops/metrics";

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getOpsMetricsSnapshot(), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
