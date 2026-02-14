import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createPasswordResetToken, normalizeEmail } from "@/lib/auth-recovery";
import { sendAuthEmail } from "@/lib/auth-email";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return `${forwardedProto || protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const userResult = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);

    if (userResult.rows.length > 0) {
      const token = await createPasswordResetToken(normalizedEmail);
      const resetUrl = `${getBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;

      await sendAuthEmail({
        to: normalizedEmail,
        subject: "Reset your VCM Suite password",
        text: [
          "We received a request to reset your password.",
          "",
          `Reset link (valid for 60 minutes): ${resetUrl}`,
          "",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
