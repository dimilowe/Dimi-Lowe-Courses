import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getCloudEntitlementsForUser } from "@/lib/cloudEntitlements";
import { query } from "@/lib/db";
import type { UserTier } from "@/lib/pricing/types";

export async function GET() {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({
        entitlements: [],
        isLoggedIn: false,
        userTier: "free" as UserTier,
      });
    }

    const userId = parseInt(session.userId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({
        entitlements: [],
        isLoggedIn: false,
        userTier: "free" as UserTier,
      });
    }
    const entitlements = await getCloudEntitlementsForUser(userId);
    const userResult = await query(
      "SELECT subscription_tier FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const userTier = (userResult.rows[0]?.subscription_tier as UserTier | undefined) || "free";
    
    return NextResponse.json({
      entitlements,
      isLoggedIn: true,
      userTier,
    });
  } catch (error) {
    console.error("[API] Error fetching cloud entitlements:", error);
    return NextResponse.json({
      entitlements: [],
      isLoggedIn: false,
      userTier: "free" as UserTier,
    });
  }
}
