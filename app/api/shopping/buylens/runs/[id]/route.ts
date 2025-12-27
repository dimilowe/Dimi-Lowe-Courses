import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "You must be signed in to view run details." },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.userId, 10);
    const { id: runId } = await params;
    
    const { rows: runRows } = await query(
      `SELECT * FROM buylens_runs WHERE id = $1 AND user_id = $2`,
      [runId, userId]
    );
    
    if (runRows.length === 0) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Run not found." },
        { status: 404 }
      );
    }
    
    const run = runRows[0];
    
    const { rows: sources } = await query(
      `SELECT domain, url, status, error_message, visited_at
       FROM buylens_sources WHERE run_id = $1
       ORDER BY visited_at`,
      [runId]
    );
    
    const { rows: results } = await query(
      `SELECT rank, title, url, domain, price_usd, shipping_usd, total_usd,
              condition, seller, key_specs, confidence, why, tradeoff
       FROM buylens_results WHERE run_id = $1
       ORDER BY rank`,
      [runId]
    );
    
    return NextResponse.json({
      run: {
        id: run.id,
        query_text: run.query_text,
        intent: run.intent_json,
        status: run.status,
        created_at: run.created_at,
        duration_ms: run.duration_ms,
        pages_visited: run.pages_visited,
        domains_visited: run.domains_visited,
      },
      sources,
      results,
    });
    
  } catch (error: any) {
    console.error("[BuyLens] Error fetching run details:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to fetch run details." },
      { status: 500 }
    );
  }
}
