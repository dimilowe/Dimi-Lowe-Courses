import { NextRequest, NextResponse } from "next/server";
import { sealData } from "iron-session";
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

    if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin not configured. Please set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD" },
        { status: 500 }
      );
    }

    const isValid = ADMIN_PASSWORD
      ? password === ADMIN_PASSWORD
      : await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const sessionData: AdminSessionData = { isAdmin: true };
    const sealed = await sealData(sessionData, {
      password: sessionOptions.password as string,
    });

    console.log("Login successful - Session saved with isAdmin: true");

    const response = NextResponse.json({ success: true });
    const opts = sessionOptions.cookieOptions as {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      maxAge?: number;
      path?: string;
    };
    response.cookies.set(sessionOptions.cookieName as string, sealed, {
      secure: opts.secure ?? (process.env.NODE_ENV === "production"),
      httpOnly: opts.httpOnly ?? true,
      sameSite: opts.sameSite ?? "lax",
      maxAge: opts.maxAge ?? 60 * 60 * 24 * 7,
      path: opts.path ?? "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
