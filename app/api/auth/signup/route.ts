import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { createUser } from "@/lib/auth";
import { claimPendingGlobalSubscriptions } from "@/lib/subscription/pending";
import { logSignupAuditEvent } from "@/lib/auth-signup-audit";
import { randomUUID } from "crypto";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  const attemptId = randomUUID();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || null;
  let email: string | null = null;

  await logSignupAuditEvent({
    attemptId,
    outcome: "attempt",
    ip: clientIp,
    userAgent,
  });

  try {
    const payload = await request.json().catch(() => null);
    const password = typeof payload?.password === "string" ? payload.password : null;
    email = typeof payload?.email === "string" ? payload.email : null;

    if (!email || !password) {
      await logSignupAuditEvent({
        attemptId,
        outcome: "validation_error",
        email,
        reason: "missing_email_or_password",
        statusCode: 400,
        ip: clientIp,
        userAgent,
      });
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      await logSignupAuditEvent({
        attemptId,
        outcome: "validation_error",
        email,
        reason: "password_too_short",
        statusCode: 400,
        ip: clientIp,
        userAgent,
      });
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password);

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    session.isAdmin = false;
    await session.save();

    try {
      await claimPendingGlobalSubscriptions({
        userId: user.id,
        email: user.email,
      });
    } catch (claimError) {
      console.error("Failed to claim pending global subscriptions on signup:", claimError);
    }

    await logSignupAuditEvent({
      attemptId,
      outcome: "success",
      email: user.email,
      userId: user.id,
      statusCode: 200,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({ success: true, userId: user.id, email: user.email });
  } catch (error: any) {
    console.error("Signup error:", error);
    
    if (error.code === "23505") {
      await logSignupAuditEvent({
        attemptId,
        outcome: "duplicate_email",
        email,
        reason: "email_already_exists",
        errorCode: error.code,
        statusCode: 409,
        ip: clientIp,
        userAgent,
      });
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    await logSignupAuditEvent({
      attemptId,
      outcome: "error",
      email,
      reason: error?.message || "signup_exception",
      errorCode: error?.code || null,
      statusCode: 500,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
