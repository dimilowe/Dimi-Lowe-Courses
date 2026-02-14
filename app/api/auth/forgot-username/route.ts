import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth-recovery";
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
      const loginUrl = `${getBaseUrl(request)}/login`;
      await sendAuthEmail({
        to: normalizedEmail,
        subject: "Your VCM Suite sign-in email",
        text: [
          "You requested help recovering your sign-in details.",
          "",
          `Your VCM Suite sign-in email is: ${normalizedEmail}`,
          `Sign in here: ${loginUrl}`,
          "",
          "If you do not remember your password, use Forgot Password on the login page.",
        ].join("\n"),
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reminder has been sent.",
    });
  } catch (error) {
    console.error("Forgot username error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
