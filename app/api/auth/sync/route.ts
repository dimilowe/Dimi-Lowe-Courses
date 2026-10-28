import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { sealData } from "iron-session";
import { findOrCreateUserByEmail, findUserById } from "@/lib/auth";
import { userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";
import { claimPendingGlobalSubscriptions } from "@/lib/subscription/pending";

export async function POST() {
  try {
    const { userId: clerkUserId, sessionId: clerkSessionId } = await auth();
    if (!clerkUserId || !clerkSessionId) {
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
    const linkedId = clerkUser.privateMetadata.vcmStoreUserId;
    if (linkedId !== undefined && (typeof linkedId !== "string" || !/^\d+$/.test(linkedId))) {
      return NextResponse.json({ error: "The store account link is invalid." }, { status: 409 });
    }
    const user = typeof linkedId === "string" && /^\d+$/.test(linkedId)
      ? await findUserById(linkedId)
      : await findOrCreateUserByEmail(primaryEmail.emailAddress);
    if (!user) {
      return NextResponse.json({ error: "The linked store account could not be found." }, { status: 409 });
    }

    // Private metadata keeps the local ID stable when the verified email changes.
    if (typeof linkedId !== "string") {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUserId, {
        privateMetadata: { vcmStoreUserId: user.id },
      });
    }
    const verifiedEmail = primaryEmail.emailAddress.trim().toLowerCase();
    if (user.email.toLowerCase() !== verifiedEmail) {
      await query("UPDATE users SET email = $1 WHERE id = $2", [verifiedEmail, user.id]);
      user.email = verifiedEmail;
    }

    await claimPendingGlobalSubscriptions({ userId: user.id, email: user.email });
    const sealed = await sealData(
      {
        userId: user.id,
        email: user.email,
        isLoggedIn: true,
        isAdmin: user.is_admin || false,
        clerkUserId,
        clerkSessionId,
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
