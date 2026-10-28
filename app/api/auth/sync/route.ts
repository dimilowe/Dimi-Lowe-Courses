import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sealData } from "iron-session";
import { findOrCreateUserByEmail } from "@/lib/auth";
import { userSessionOptions } from "@/lib/user-session";

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Not authenticated with Clerk" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== clerkUserId) {
      return NextResponse.json({ error: "Could not load the signed-in account" }, { status: 401 });
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );
    if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
      return NextResponse.json(
        { error: "Verify your email address before continuing." },
        { status: 403 }
      );
    }

    // Link verified Clerk identities to existing local records by email. This
    // preserves purchases, entitlements, workspace data, and admin permissions.
    const user = await findOrCreateUserByEmail(primaryEmail.emailAddress);
    const sealed = await sealData(
      {
        userId: user.id,
        email: user.email,
        isLoggedIn: true,
        isAdmin: user.is_admin || false,
      },
      { password: userSessionOptions.password as string }
    );

    const cookieOptions = userSessionOptions.cookieOptions;
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false,
    });
    response.cookies.set(userSessionOptions.cookieName as string, sealed, {
      secure: cookieOptions?.secure ?? process.env.NODE_ENV === "production",
      httpOnly: cookieOptions?.httpOnly ?? true,
      sameSite: cookieOptions?.sameSite ?? "lax",
      maxAge: cookieOptions?.maxAge ?? 60 * 60 * 24 * 30,
      path: cookieOptions?.path ?? "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to synchronize Clerk account:", error);
    return NextResponse.json({ error: "Failed to finish signing in." }, { status: 500 });
  }
}
