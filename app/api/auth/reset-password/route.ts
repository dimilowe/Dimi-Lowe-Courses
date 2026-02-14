import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { consumePasswordResetToken } from "@/lib/auth-recovery";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const consumed = await consumePasswordResetToken(token);
    if (!consumed) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE email = $2", [
      newPasswordHash,
      consumed.email,
    ]);

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
