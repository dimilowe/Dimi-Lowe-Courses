import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import Stripe from "stripe";
import { query } from "@/lib/db";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");

  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:5000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${request.headers.get("x-forwarded-proto") || protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const userId = Number.parseInt(session.userId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: "Invalid account." }, { status: 400 });
    }

    const result = await query(
      `SELECT stripe_customer_id
       FROM cloud_entitlements
       WHERE user_id = $1
         AND stripe_customer_id IS NOT NULL
         AND status IN ('active', 'trial', 'past_due')
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );
    const customerId = String(result.rows[0]?.stripe_customer_id || "");

    if (!customerId.startsWith("cus_")) {
      return NextResponse.json(
        { error: "No active Stripe subscription is linked to this account." },
        { status: 404 }
      );
    }

    const portalSession = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl(request)}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Unable to open subscription management. Please try again." },
      { status: 500 }
    );
  }
}
