import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
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
      ORDER BY 
        CASE WHEN p.status = 'open' THEN 0 ELSE 1 END,
        p.created_at DESC
    `);

    const predictions = result.rows.map(p => {
      const yesCount = parseInt(p.yes_count as string) || 0;
      const noCount = parseInt(p.no_count as string) || 0;
      const totalVotes = yesCount + noCount;
      const yesPercent = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 50;
      const noPercent = totalVotes > 0 ? 100 - yesPercent : 50;

      return {
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
      };
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, description, category, closeDate } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (question.length > 200) {
      return NextResponse.json({ error: "Question must be 200 characters or less" }, { status: 400 });
    }

    if (description && description.length > 1000) {
      return NextResponse.json({ error: "Description must be 1000 characters or less" }, { status: 400 });
    }

    if (category && category.length > 50) {
      return NextResponse.json({ error: "Category must be 50 characters or less" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO predictions (question, description, category, close_date, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id, question, description, category, created_at, close_date, status`,
      [
        question.trim(),
        description?.trim() || null,
        category?.trim() || null,
        closeDate || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      prediction: result.rows[0] 
    });
  } catch (error) {
    console.error("Error creating prediction:", error);
    return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 });
  }
}
