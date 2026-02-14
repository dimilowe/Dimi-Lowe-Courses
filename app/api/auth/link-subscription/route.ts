import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";
import { PUBLIC_CLOUD_IDS } from "@/lib/types/cloudEntitlements";
import { claimPendingGlobalSubscriptionBySubscription } from "@/lib/subscription/pending";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "canceled" {
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled";
  return "active";
}

async function recomputeEffectiveEntitlement(userId: number, cloudId: string) {
  const result = await query(
    `SELECT tier, status, stripe_customer_id, stripe_subscription_id, current_period_end
     FROM cloud_entitlement_grants
     WHERE user_id = $1
       AND cloud_id = $2
       AND status IN ('active', 'trial', 'past_due')
       AND (current_period_end IS NULL OR current_period_end >= NOW())
     ORDER BY
       CASE status WHEN 'active' THEN 2 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 0 END DESC,
       CASE tier
         WHEN 'pro' THEN 4
         WHEN 'basic' THEN 3
         WHEN 'starter' THEN 2
         WHEN 'free' THEN 1
         ELSE 0
       END DESC
     LIMIT 1`,
    [userId, cloudId]
  );

  if (result.rows.length === 0) {
    await query(
      `UPDATE cloud_entitlements
       SET status = 'canceled', updated_at = NOW()
       WHERE user_id = $1 AND cloud_id = $2`,
      [userId, cloudId]
    );
    return;
  }

  const winner = result.rows[0];
  const effectiveStatus = winner.status === "trial" ? "active" : winner.status;

  await query(
    `INSERT INTO cloud_entitlements
       (user_id, cloud_id, tier, source, status, stripe_customer_id, stripe_subscription_id, current_period_end, valid_from, updated_at)
     VALUES ($1, $2, $3, 'stripe', $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (user_id, cloud_id)
     DO UPDATE SET
       tier = EXCLUDED.tier,
       status = EXCLUDED.status,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()`,
    [
      userId,
      cloudId,
      winner.tier,
      effectiveStatus,
      winner.stripe_customer_id,
      winner.stripe_subscription_id,
      winner.current_period_end,
    ]
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { checkoutSessionId } = await request.json();
    if (!checkoutSessionId || typeof checkoutSessionId !== "string") {
      return NextResponse.json({ error: "Checkout session ID is required" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId.trim());
    const checkoutType = checkoutSession.metadata?.type || checkoutSession.metadata?.checkout_type;

    if (checkoutType !== "global") {
      return NextResponse.json(
        { error: "This checkout session is not a global subscription purchase." },
        { status: 400 }
      );
    }

    if (!checkoutSession.subscription) {
      return NextResponse.json({ error: "Checkout session has no subscription." }, { status: 400 });
    }

    const subscriptionResponse = await stripe.subscriptions.retrieve(String(checkoutSession.subscription));
    const subscription = subscriptionResponse as Stripe.Subscription;
    const entitlementStatus = mapStripeStatus(subscription.status);
    const currentPeriodEnd =
      typeof (subscription as any).current_period_end === "number"
        ? new Date((subscription as any).current_period_end * 1000)
        : null;

    const currentUserId = parseInt(session.userId, 10);
    if (!Number.isFinite(currentUserId)) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const previousOwners = await query(
      `SELECT DISTINCT user_id
       FROM cloud_entitlement_grants
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    for (const cloudId of PUBLIC_CLOUD_IDS) {
      await query(
        `INSERT INTO cloud_entitlement_grants
           (user_id, cloud_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
         VALUES ($1, $2, 'pro', $3, $4, $5, $6, NOW())
         ON CONFLICT (stripe_subscription_id, cloud_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           tier = EXCLUDED.tier,
           status = EXCLUDED.status,
           stripe_customer_id = EXCLUDED.stripe_customer_id,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()`,
        [
          currentUserId,
          cloudId,
          entitlementStatus,
          (checkoutSession.customer as string) || null,
          subscription.id,
          currentPeriodEnd,
        ]
      );

      await recomputeEffectiveEntitlement(currentUserId, cloudId);
    }

    const oldUserIds = previousOwners.rows
      .map((row) => Number(row.user_id))
      .filter((id) => Number.isFinite(id) && id !== currentUserId);

    for (const oldUserId of oldUserIds) {
      for (const cloudId of PUBLIC_CLOUD_IDS) {
        await recomputeEffectiveEntitlement(oldUserId, cloudId);
      }
    }

    await claimPendingGlobalSubscriptionBySubscription({
      stripeSubscriptionId: subscription.id,
      userId: currentUserId,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription linked to this account successfully.",
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Link subscription error:", error);
    return NextResponse.json({ error: "Failed to link subscription" }, { status: 500 });
  }
}
