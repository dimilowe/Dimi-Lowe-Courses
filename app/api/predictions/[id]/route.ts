import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const predictionId = parseInt(id);

    if (isNaN(predictionId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        p.id,
        p.question,
        p.description,
        p.category,
        p.created_at,
        p.close_date,
        p.status,
        p.outcome,
        COALESCE(
          (SELECT COUNT(*) FROM prediction_votes WHERE prediction_id = p.id AND choice = 'yes'),
          0
        ) as yes_count,
        COALESCE(
          (SELECT COUNT(*) FROM prediction_votes WHERE prediction_id = p.id AND choice = 'no'),
          0
        ) as no_count
      FROM predictions p
      WHERE p.id = $1`,
      [predictionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const p = result.rows[0];
    const yesCount = parseInt(p.yes_count as string) || 0;
    const noCount = parseInt(p.no_count as string) || 0;
    const totalVotes = yesCount + noCount;
    const yesPercent = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 50;
    const noPercent = totalVotes > 0 ? 100 - yesPercent : 50;

    return NextResponse.json({
      prediction: {
        id: p.id,
        question: p.question,
        description: p.description,
        category: p.category,
        createdAt: p.created_at,
        closeDate: p.close_date,
        status: p.status,
        outcome: p.outcome,
        yesCount,
        noCount,
        totalVotes,
        yesPercent,
        noPercent
      }
    });
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json({ error: "Failed to fetch prediction" }, { status: 500 });
  }
}
