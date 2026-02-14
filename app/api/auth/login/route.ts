import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { verifyPassword } from "@/lib/auth";
import { claimPendingGlobalSubscriptions } from "@/lib/subscription/pending";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await verifyPassword(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    session.isAdmin = user.is_admin || false;
    await session.save();

    try {
      await claimPendingGlobalSubscriptions({
        userId: user.id,
        email: user.email,
      });
    } catch (claimError) {
      console.error("Failed to claim pending global subscriptions on login:", claimError);
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
