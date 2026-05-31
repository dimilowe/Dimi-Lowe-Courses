import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { newEmail, password } = await request.json();

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: "New email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get user's current password hash
    const userResult = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash as string);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 }
      );
    }

    // Check if email is already in use
    const emailCheck = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [newEmail.toLowerCase().trim(), session.userId]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "Email address is already in use" },
        { status: 409 }
      );
    }

    // Update email
    await query(
      "UPDATE users SET email = $1 WHERE id = $2",
      [newEmail.toLowerCase().trim(), session.userId]
    );

    // Update session
    session.email = newEmail.toLowerCase().trim();
    await session.save();

    return NextResponse.json({ success: true, message: "Email updated successfully", email: newEmail.toLowerCase().trim() });
  } catch (error) {
    console.error("Email change error:", error);
    return NextResponse.json(
      { error: "Failed to change email" },
      { status: 500 }
    );
  }
}
