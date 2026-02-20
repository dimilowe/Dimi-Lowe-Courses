import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { findOrCreateUserByEmail } from "@/lib/auth";
import { ensureCourseWorkspaceEntryByProductId } from "@/lib/workspace/courseResources";
import Stripe from "stripe";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    const customerEmail = checkoutSession.customer_email || checkoutSession.customer_details?.email;
    const productId = checkoutSession.metadata?.productId;
    const checkoutType = checkoutSession.metadata?.type || checkoutSession.metadata?.checkout_type;
    const paymentIntentId = checkoutSession.payment_intent;
    const amount = checkoutSession.amount_total;
    const { query } = await import("@/lib/db");
    
    if (!customerEmail) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    if (checkoutType === "global" && checkoutSession.subscription) {
      const result = await query(
        "SELECT id, email FROM users WHERE email = $1",
        [customerEmail.toLowerCase().trim()]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          userExists: true,
          email: customerEmail,
          purchaseType: "subscription",
        });
      }

      return NextResponse.json({
        userExists: false,
        email: customerEmail,
        purchaseType: "subscription",
      });
    }

    if (!productId || !paymentIntentId) {
      return NextResponse.json({ error: "Invalid purchase data" }, { status: 400 });
    }

    // Record the purchase immediately (if not already recorded)
    const existingPurchase = await query(
      "SELECT id FROM purchases WHERE stripe_payment_intent_id = $1",
      [paymentIntentId]
    );

    if (existingPurchase.rows.length === 0) {
      // Check if user exists
      const userResult = await query(
        "SELECT id FROM users WHERE email = $1",
        [customerEmail.toLowerCase().trim()]
      );

      if (userResult.rows.length > 0) {
        // User exists - record purchase with their ID and grant entitlement
        const userId = userResult.rows[0].id;

        await query(
          `INSERT INTO purchases (user_id, product_id, stripe_payment_intent_id, amount, status) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, productId, paymentIntentId, amount, "completed"]
        );

        await query(
          `INSERT INTO entitlements (user_id, product_id, source) 
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO NOTHING`,
          [userId, productId, "purchase"]
        );

        const numericProductId = parseInt(productId, 10);
        if (Number.isFinite(numericProductId)) {
          try {
            await ensureCourseWorkspaceEntryByProductId(userId, numericProductId);
          } catch (error) {
            console.error("Failed to create course workspace entry:", error);
          }
        }
      } else {
        // User doesn't exist - store pending purchase
        await query(
          `INSERT INTO purchases (user_id, product_id, stripe_payment_intent_id, amount, status) 
           VALUES ($1, $2, $3, $4, $5)`,
          [null, productId, paymentIntentId, amount, "pending"]
        );
      }
    }

    // Check if user exists and return appropriate response
    const result = await query(
      "SELECT id, email FROM users WHERE email = $1",
      [customerEmail.toLowerCase().trim()]
    );

    if (result.rows.length > 0) {
      // User exists - return their info so they can login
      return NextResponse.json({ 
        userExists: true, 
        email: customerEmail 
      });
    } else {
      // User doesn't exist - return email so they can sign up
      return NextResponse.json({ 
        userExists: false, 
        email: customerEmail 
      });
    }
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (session.isLoggedIn && session.userId) {
      return NextResponse.json({
        isLoggedIn: true,
        userId: session.userId,
        email: session.email,
        isAdmin: session.isAdmin || false,
      });
    }
    
    return NextResponse.json({ isLoggedIn: false });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ isLoggedIn: false });
  }
}
