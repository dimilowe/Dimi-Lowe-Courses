import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "You must be signed in to view runs." },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.userId, 10);
    
    const { rows } = await query(
      `SELECT 
         id, 
         query_text, 
         status, 
         created_at, 
         duration_ms, 
         pages_visited, 
         domains_visited,
         (SELECT COUNT(*) FROM buylens_results WHERE run_id = buylens_runs.id) as result_count
       FROM buylens_runs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    return NextResponse.json({ runs: rows });
    
  } catch (error: any) {
    console.error("[BuyLens] Error fetching runs:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to fetch runs." },
      { status: 500 }
    );
  }
}
