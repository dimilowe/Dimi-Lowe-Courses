import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getOrCreateAnonId(): Promise<string> {
  const cookieStore = await cookies();
  let anonId = cookieStore.get("prediction_anon_id")?.value;
  
  if (!anonId) {
    anonId = crypto.randomUUID();
  }
  
  return anonId;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const predictionId = parseInt(id);
    const body = await request.json();
    const { choice } = body;

    if (isNaN(predictionId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    if (choice !== "yes" && choice !== "no") {
      return NextResponse.json({ error: "Choice must be 'yes' or 'no'" }, { status: 400 });
    }

    const predictionResult = await query(
      "SELECT id, status FROM predictions WHERE id = $1",
      [predictionId]
    );

    if (predictionResult.rows.length === 0) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    if (predictionResult.rows[0].status !== "open") {
      return NextResponse.json({ error: "Voting is closed for this prediction" }, { status: 400 });
    }

    const anonId = await getOrCreateAnonId();

    const existingVote = await query(
      "SELECT id FROM prediction_votes WHERE prediction_id = $1 AND anon_id = $2",
      [predictionId, anonId]
    );

    if (existingVote.rows.length > 0) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    await query(
      `INSERT INTO prediction_votes (prediction_id, anon_id, choice)
       VALUES ($1, $2, $3)`,
      [predictionId, anonId, choice]
    );

    const statsResult = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN choice = 'yes' THEN 1 ELSE 0 END), 0) as yes_count,
        COALESCE(SUM(CASE WHEN choice = 'no' THEN 1 ELSE 0 END), 0) as no_count
      FROM prediction_votes
      WHERE prediction_id = $1`,
      [predictionId]
    );

    const yesCount = parseInt(statsResult.rows[0].yes_count as string) || 0;
    const noCount = parseInt(statsResult.rows[0].no_count as string) || 0;
    const totalVotes = yesCount + noCount;
    const yesPercent = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 50;
    const noPercent = totalVotes > 0 ? 100 - yesPercent : 50;

    const response = NextResponse.json({
      success: true,
      yesCount,
      noCount,
      totalVotes,
      yesPercent,
      noPercent
    });

    response.cookies.set("prediction_anon_id", anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const predictionId = parseInt(id);
    const anonId = await getOrCreateAnonId();

    if (isNaN(predictionId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    const existingVote = await query(
      "SELECT choice FROM prediction_votes WHERE prediction_id = $1 AND anon_id = $2",
      [predictionId, anonId]
    );

    const response = NextResponse.json({
      hasVoted: existingVote.rows.length > 0,
      choice: existingVote.rows[0]?.choice || null
    });

    response.cookies.set("prediction_anon_id", anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return NextResponse.json({ error: "Failed to check vote status" }, { status: 500 });
  }
}
