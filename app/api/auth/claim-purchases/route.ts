import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";
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
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user email
    const userResult = await query(
      "SELECT email FROM users WHERE id = $1",
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = userResult.rows[0].email;
    const stripe = getStripeClient();

    // Find pending purchases (with NULL user_id)
    const pendingResult = await query(
      `SELECT id, product_id, stripe_payment_intent_id
       FROM purchases
       WHERE status = 'pending'
       AND user_id IS NULL`
    );

    let claimed = 0;
    const downloadUrls: string[] = [];

    // Check each pending purchase to see if it matches this user's email
    for (const purchase of pendingResult.rows) {
      try {
        if (!purchase.stripe_payment_intent_id) continue;

        // Get the payment intent to find the associated checkout session
        const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id);
        
        // Get checkout sessions for this payment intent
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: purchase.stripe_payment_intent_id,
          limit: 1
        });

        if (sessions.data.length === 0) continue;

        const checkoutSession = sessions.data[0];
        const customerEmail = checkoutSession.customer_email || checkoutSession.customer_details?.email;

        if (customerEmail && customerEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
          // This purchase belongs to this user - claim it
          await query(
            "UPDATE purchases SET user_id = $1, status = 'completed' WHERE id = $2",
            [session.userId, purchase.id]
          );

          // Grant entitlement
          await query(
            `INSERT INTO entitlements (user_id, product_id, source)
             VALUES ($1, $2, 'purchase')
             ON CONFLICT (user_id, product_id) DO NOTHING`,
            [session.userId, purchase.product_id]
          );

          const numericProductId = Number(purchase.product_id);
          if (Number.isFinite(numericProductId)) {
            try {
              await ensureCourseWorkspaceEntryByProductId(session.userId, numericProductId);
            } catch (error) {
              console.error("Failed to create course workspace entry:", error);
            }
          }

          // Get product download URL
          const productResult = await query(
            "SELECT download_url FROM products WHERE id = $1",
            [purchase.product_id]
          );

          if (productResult.rows.length > 0 && productResult.rows[0].download_url) {
            downloadUrls.push(productResult.rows[0].download_url);
          }

          claimed++;
        }
      } catch (err) {
        console.error("Error claiming purchase:", purchase.id, err);
      }
    }

    return NextResponse.json({ claimed, downloadUrls });
  } catch (error) {
    console.error("Claim purchases error:", error);
    return NextResponse.json(
      { error: "Failed to claim purchases" },
      { status: 500 }
    );
  }
}
