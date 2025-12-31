import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { getRequestById, updateRequestStatus } from "@/lib/brandAccess/db";

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { request_id, admin_notes } = body;

    if (!request_id) {
      return NextResponse.json({ error: "request_id is required" }, { status: 400 });
    }

    const brandRequest = await getRequestById(request_id);

    if (!brandRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await updateRequestStatus(
      request_id,
      'rejected',
      'admin',
      admin_notes || null
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Brand Access reject error:', error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
