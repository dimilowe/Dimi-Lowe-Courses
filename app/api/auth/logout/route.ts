import { NextResponse } from "next/server";
import { userSessionOptions } from "@/lib/user-session";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    const options = userSessionOptions.cookieOptions;
    response.cookies.set(userSessionOptions.cookieName as string, "", {
      secure: options?.secure ?? process.env.NODE_ENV === "production",
      httpOnly: options?.httpOnly ?? true,
      sameSite: options?.sameSite ?? "lax",
      maxAge: 0,
      path: options?.path ?? "/",
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
