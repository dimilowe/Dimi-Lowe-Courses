import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { listRequests } from "@/lib/brandAccess/db";

export async function GET(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;

  const requests = await listRequests(status);

  return NextResponse.json({ requests });
}
