import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { getRequestById, updateRequestStatus, publishEntry } from "@/lib/brandAccess/db";

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { request_id, manual_contact_url } = body;

    if (!request_id) {
      return NextResponse.json({ error: "request_id is required" }, { status: 400 });
    }

    const brandRequest = await getRequestById(request_id);

    if (!brandRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const contactUrl = manual_contact_url || brandRequest.resolved_contact_url;
    
    if (!contactUrl) {
      return NextResponse.json(
        { error: "No contact URL available. Provide manual_contact_url or resolve first." },
        { status: 400 }
      );
    }

    const websiteUrl = brandRequest.resolved_website_url || brandRequest.requested_website_url;

    const entryId = await publishEntry(
      brandRequest.requested_brand_name,
      websiteUrl,
      contactUrl,
      brandRequest.request_reason
    );

    await updateRequestStatus(
      request_id,
      'added',
      session.adminId || 'admin',
      undefined,
      entryId
    );

    return NextResponse.json({ ok: true, entry_id: entryId });
  } catch (error) {
    console.error('Brand Access publish error:', error);
    return NextResponse.json(
      { error: "Failed to publish entry" },
      { status: 500 }
    );
  }
}
