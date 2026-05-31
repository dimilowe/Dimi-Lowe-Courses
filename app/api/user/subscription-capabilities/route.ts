import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getSubscriptionCapabilitiesForUser } from "@/lib/subscription/capabilities";

export async function GET() {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({
        isLoggedIn: false,
        canSavePresets: false,
        canSaveWorkspace: false,
        canAccessAllContent: false,
      });
    }

    const userId = parseInt(session.userId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({
        isLoggedIn: false,
        canSavePresets: false,
        canSaveWorkspace: false,
        canAccessAllContent: false,
      });
    }

    const capabilities = await getSubscriptionCapabilitiesForUser(userId);

    return NextResponse.json({
      isLoggedIn: true,
      ...capabilities,
    });
  } catch (error) {
    console.error("[API] Error fetching subscription capabilities:", error);
    return NextResponse.json({
      isLoggedIn: false,
      canSavePresets: false,
      canSaveWorkspace: false,
      canAccessAllContent: false,
    });
  }
}
