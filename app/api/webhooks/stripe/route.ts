import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { grantAccessForOffer, storePendingPurchase } from "@/lib/offers";
import {
  storePendingGlobalSubscription,
  updatePendingGlobalSubscriptionStatus,
} from "@/lib/subscription/pending";
import { PUBLIC_CLOUD_IDS } from "@/lib/types/cloudEntitlements";
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

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

async function checkDuplicatePayment(sessionId: string): Promise<boolean> {
  const result = await query(
    "SELECT id FROM purchases WHERE stripe_payment_intent_id = $1",
    [sessionId]
  );
  return result.rows.length > 0;
}

async function getUserByEmail(email: string): Promise<{ id: number } | null> {
  const result = await query(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
}

async function upsertCloudEntitlementGrant(params: {
  userId: number;
  cloudId: string;
  tier: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  currentPeriodEnd: Date;
}) {
  const { userId, cloudId, tier, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd } = params;

  await query(
    `INSERT INTO cloud_entitlement_grants 
       (user_id, cloud_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (stripe_subscription_id, cloud_id) 
     DO UPDATE SET
       tier = EXCLUDED.tier,
       status = EXCLUDED.status,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()`,
    [userId, cloudId, tier, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd]
  );

  console.log(`[Webhook] Upserted grant: userId=${userId}, cloudId=${cloudId}, tier=${tier}, subscriptionId=${stripeSubscriptionId}`);
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
    console.log(`[Webhook] Recompute: No active grants for userId=${userId}, cloudId=${cloudId} - set to canceled`);
    return;
  }

  const winner = result.rows[0];
  const effectiveStatus = winner.status === 'trial' ? 'active' : winner.status;

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
    [userId, cloudId, winner.tier, effectiveStatus, winner.stripe_customer_id, winner.stripe_subscription_id, winner.current_period_end]
  );

  console.log(`[Webhook] Recompute: userId=${userId}, cloudId=${cloudId} -> tier=${winner.tier}, status=${effectiveStatus} from subscription=${winner.stripe_subscription_id}`);
}

async function recomputeAllCloudsForUser(userId: number) {
  const result = await query(
    `SELECT DISTINCT cloud_id FROM cloud_entitlement_grants WHERE user_id = $1`,
    [userId]
  );
  
  for (const row of result.rows) {
    await recomputeEffectiveEntitlement(userId, row.cloud_id);
  }
}

async function updateGrantsAndRecompute(stripeSubscriptionId: string, status: string, currentPeriodEnd?: Date) {
  const updateResult = currentPeriodEnd 
    ? await query(
        `UPDATE cloud_entitlement_grants 
         SET status = $1, current_period_end = $2, updated_at = NOW()
         WHERE stripe_subscription_id = $3
         RETURNING user_id, cloud_id`,
        [status, currentPeriodEnd, stripeSubscriptionId]
      )
    : await query(
        `UPDATE cloud_entitlement_grants 
         SET status = $1, updated_at = NOW()
         WHERE stripe_subscription_id = $2
         RETURNING user_id, cloud_id`,
        [status, stripeSubscriptionId]
      );

  console.log(`[Webhook] Updated ${updateResult.rows.length} grants for subscription ${stripeSubscriptionId} to status=${status}`);

  if (updateResult.rows.length === 0) {
    console.warn(`[Webhook] No grants found for subscription ${stripeSubscriptionId} - this is normal for subscriptions not yet provisioned`);
    return;
  }

  const affectedUsers = new Set<number>();
  const affectedClouds = new Map<number, Set<string>>();

  for (const row of updateResult.rows) {
    affectedUsers.add(row.user_id);
    if (!affectedClouds.has(row.user_id)) {
      affectedClouds.set(row.user_id, new Set());
    }
    affectedClouds.get(row.user_id)!.add(row.cloud_id);
  }

  for (const userId of affectedUsers) {
    const clouds = affectedClouds.get(userId)!;
    for (const cloudId of clouds) {
      await recomputeEffectiveEntitlement(userId, cloudId);
    }
  }
}

async function handleCloudCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata || {};
  const cloudId = metadata.cloud_id;
  const tier = metadata.tier;
  const userIdStr = metadata.user_id;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!session.subscription) {
    console.error("[Webhook] Cloud checkout missing subscription:", session.id);
    return;
  }

  const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
  const subscription = subscriptionResponse as Stripe.Subscription;
  const subMetadata = subscription.metadata || {};

  const finalCloudId = cloudId || subMetadata.cloud_id;
  const finalTier = tier || subMetadata.tier;
  let finalUserId = userIdStr ? parseInt(userIdStr, 10) : null;

  if (!finalUserId && customerEmail) {
    const user = await getUserByEmail(customerEmail);
    if (user) {
      finalUserId = user.id;
    }
  }

  if (!finalUserId) {
    console.error("[Webhook] Could not determine user for cloud subscription:", session.id);
    return;
  }

  if (!finalCloudId || !finalTier) {
    console.error("[Webhook] Missing cloud_id or tier in metadata:", { finalCloudId, finalTier });
    return;
  }

  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  await upsertCloudEntitlementGrant({
    userId: finalUserId,
    cloudId: finalCloudId,
    tier: finalTier,
    status: "active",
    stripeCustomerId: session.customer as string | null,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd,
  });

  await recomputeEffectiveEntitlement(finalUserId, finalCloudId);
}

async function handleGlobalProCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata || {};
  const userIdStr = metadata.user_id;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!session.subscription) {
    console.error("[Webhook] Global Pro checkout missing subscription:", session.id);
    return;
  }

  const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
  const subscription = subscriptionResponse as Stripe.Subscription;
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  let finalUserId = userIdStr ? parseInt(userIdStr, 10) : null;

  if (!finalUserId && customerEmail) {
    const user = await getUserByEmail(customerEmail);
    if (user) {
      finalUserId = user.id;
    }
  }

  if (!finalUserId) {
    if (customerEmail) {
      await storePendingGlobalSubscription({
        email: customerEmail,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: (session.customer as string) || null,
        status: "active",
        currentPeriodEnd,
      });
      console.log(
        `[Webhook] Stored pending Global Pro subscription for email=${customerEmail}, subscriptionId=${subscription.id}`
      );
      return;
    }

    console.error("[Webhook] Could not determine user for Global Pro subscription:", session.id);
    return;
  }

  for (const cloudId of PUBLIC_CLOUD_IDS) {
    await upsertCloudEntitlementGrant({
      userId: finalUserId,
      cloudId,
      tier: 'pro',
      status: 'active',
      stripeCustomerId: session.customer as string | null,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
    });
    await recomputeEffectiveEntitlement(finalUserId, cloudId);
  }

  console.log(`[Webhook] Granted Global Pro access to ${PUBLIC_CLOUD_IDS.length} clouds for userId=${finalUserId}, subscriptionId=${subscription.id}`);
}

async function handleCmsCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  const offerKey = session.metadata?.offer_key;
  const cmsSlug = session.metadata?.cms_slug;

  if (!customerEmail) {
    console.error("[Webhook] Missing customer email in session:", session.id);
    return;
  }

  if (!offerKey || !cmsSlug) {
    console.error("[Webhook] Invalid CMS checkout metadata:", { offerKey, cmsSlug });
    return;
  }

  const isDuplicate = await checkDuplicatePayment(session.id);
  if (isDuplicate) {
    console.log(`[Webhook] Duplicate event ignored for session: ${session.id}`);
    return;
  }

  const user = await getUserByEmail(customerEmail);

  if (user) {
    await grantAccessForOffer({
      userId: String(user.id),
      offerKey,
      cmsSlug,
      stripeCustomerId: session.customer as string | null,
      stripeSessionId: session.id,
      amountTotal: session.amount_total,
    });
  } else {
    await storePendingPurchase({
      email: customerEmail,
      offerKey,
      cmsSlug,
      stripeSessionId: session.id,
      amountTotal: session.amount_total,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  const currentPeriodEnd =
    typeof (subscription as any).current_period_end === "number"
      ? new Date((subscription as any).current_period_end * 1000)
      : undefined;

  let status: "active" | "past_due" | "canceled" = "active";

  if (subscription.status === "past_due") {
    status = "past_due";
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    status = "canceled";
  }

  await updatePendingGlobalSubscriptionStatus({
    stripeSubscriptionId,
    status,
    currentPeriodEnd: currentPeriodEnd ?? null,
  });

  await updateGrantsAndRecompute(stripeSubscriptionId, status, currentPeriodEnd);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;
  await updatePendingGlobalSubscriptionStatus({
    stripeSubscriptionId,
    status: "canceled",
    currentPeriodEnd: null,
  });
  await updateGrantsAndRecompute(stripeSubscriptionId, "canceled");
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutType = session.metadata?.type || session.metadata?.checkout_type;

      if (checkoutType === "global") {
        await handleGlobalProCheckoutCompleted(stripe, session);
      } else if (checkoutType === "cloud") {
        await handleCloudCheckoutCompleted(stripe, session);
      } else if (checkoutType === "cms" || session.metadata?.offer_key) {
        await handleCmsCheckoutCompleted(session);
      } else {
        console.log(`[Webhook] Unhandled checkout type: ${checkoutType}`);
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
