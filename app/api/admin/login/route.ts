import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Check if admin auth is configured
    if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin not configured. Please set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD" },
        { status: 500 }
      );
    }

    // Verify password (plain password takes precedence for local/dev simplicity)
    const isValid = ADMIN_PASSWORD
      ? password === ADMIN_PASSWORD
      : await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set session
    const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
    session.isAdmin = true;
    await session.save();

    console.log("Login successful - Session saved with isAdmin:", session.isAdmin);

    const response = NextResponse.json({ success: true });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
