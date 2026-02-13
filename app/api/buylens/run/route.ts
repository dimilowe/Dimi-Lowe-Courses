import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query, withTransaction } from "@/lib/db";
import {
  parseIntent,
  discoverSearchTargets,
  crawlSearchTargets,
  normalizeListings,
  deduplicateListings,
  rankListings,
  generateRunSummary,
  clearRobotsCache,
  HARD_CAPS,
  type BuyLensIntent,
  type Market,
  type Condition,
} from "@/server/lib/buylens";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "You must be signed in to use BuyLens." },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.userId, 10);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { rows: dailyRuns } = await query(
      `SELECT COUNT(*) as count FROM buylens_runs 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    
    if (parseInt(dailyRuns[0]?.count || "0", 10) >= HARD_CAPS.maxRunsPerDay) {
      return NextResponse.json(
        { 
          error: "RATE_LIMIT", 
          message: `You've reached the daily limit of ${HARD_CAPS.maxRunsPerDay} runs. Try again tomorrow.`,
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const queryText = String(body.queryText || "").trim();
    
    if (!queryText) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Please enter what you're looking to buy." },
        { status: 400 }
      );
    }
    
    if (queryText.length > HARD_CAPS.maxQueryLength) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: `Query too long. Maximum ${HARD_CAPS.maxQueryLength} characters.` },
        { status: 400 }
      );
    }
    
    const options = {
      maxBudget: body.maxBudget ? parseFloat(body.maxBudget) : undefined,
      market: (body.market || "both") as Market,
      condition: (body.condition || "any") as Condition,
      includeShippingTotal: body.includeShippingTotal !== false,
    };
    
    const intent = parseIntent(queryText, options);
    
    clearRobotsCache();
    
    const targets = discoverSearchTargets(intent);
    
    const { rows: [runRow] } = await query(
      `INSERT INTO buylens_runs (user_id, query_text, intent_json, status)
       VALUES ($1, $2, $3, 'running')
       RETURNING id`,
      [userId, queryText, JSON.stringify(intent)]
    );
    const runId = runRow.id;
    
    try {
      const crawlResult = await crawlSearchTargets(targets);
      
      for (const source of crawlResult.sources) {
        await query(
          `INSERT INTO buylens_sources (run_id, domain, url, status, error_message, visited_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [runId, source.domain, source.url, source.status, source.error_message || null, source.visited_at]
        );
      }
      
      const normalizedListings = normalizeListings(crawlResult.listings, intent);
      const uniqueListings = deduplicateListings(normalizedListings);
      const { results, sortExplanation } = rankListings(uniqueListings, intent);
      
      for (const result of results) {
        await query(
          `INSERT INTO buylens_results 
           (run_id, rank, title, url, domain, price_usd, shipping_usd, total_usd, 
            condition, seller, key_specs, confidence, why, tradeoff)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            runId, 
            result.rank, 
            result.title || null, 
            result.url, 
            result.domain,
            result.price_usd || null, 
            result.shipping_usd || null, 
            result.total_usd || null,
            result.condition || null, 
            result.seller || null, 
            result.key_specs ? JSON.stringify(result.key_specs) : null,
            result.confidence, 
            result.why || null, 
            result.tradeoff || null
          ]
        );
      }
      
      const duration_ms = Date.now() - startTime;
      const status = results.length > 0 
        ? "success" 
        : crawlResult.sources.some(s => s.status === "ok") 
          ? "partial" 
          : "failed";
      
      await query(
        `UPDATE buylens_runs 
         SET status = $1, duration_ms = $2, pages_visited = $3, domains_visited = $4
         WHERE id = $5`,
        [status, duration_ms, crawlResult.pagesVisited, crawlResult.domainsVisited, runId]
      );
      
      const summary = generateRunSummary(results, intent, sortExplanation);
      
      return NextResponse.json({
        runId,
        status,
        intent,
        results,
        sources: crawlResult.sources,
        duration_ms,
        summary,
        sort_explanation: sortExplanation,
      });
      
    } catch (pipelineError: any) {
      const duration_ms = Date.now() - startTime;
      
      await query(
        `UPDATE buylens_runs SET status = 'failed', duration_ms = $1 WHERE id = $2`,
        [duration_ms, runId]
      );
      
      console.error("[BuyLens] Pipeline error:", pipelineError);
      
      return NextResponse.json(
        { 
          error: "PIPELINE_ERROR", 
          message: "An error occurred while scanning. Please try again.",
          runId,
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("[BuyLens] Error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
