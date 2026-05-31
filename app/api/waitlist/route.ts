import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingResult = await query(
      "SELECT id FROM vcm_os_waitlist WHERE email = $1",
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { message: "You're already on the waitlist!", alreadyExists: true },
        { status: 200 }
      );
    }

    await query(
      "INSERT INTO vcm_os_waitlist (email, source) VALUES ($1, $2)",
      [normalizedEmail, "vcm-suite"]
    );

    return NextResponse.json(
      { message: "Successfully joined the waitlist!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await query(
      "SELECT COUNT(*) as count FROM vcm_os_waitlist"
    );
    
    return NextResponse.json({
      count: parseInt(result.rows[0].count as string, 10)
    });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
