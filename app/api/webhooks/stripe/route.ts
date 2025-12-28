import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { grantAccessForOffer, storePendingPurchase } from "@/lib/offers";
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

async function upsertCloudEntitlement(params: {
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
    [userId, cloudId, tier, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd]
  );

  console.log(`[Webhook] Upserted cloud entitlement: userId=${userId}, cloudId=${cloudId}, tier=${tier}, status=${status}`);
}

async function updateSubscriptionStatus(stripeSubscriptionId: string, status: string, currentPeriodEnd?: Date) {
  if (currentPeriodEnd) {
    await query(
      `UPDATE cloud_entitlements 
       SET status = $1, current_period_end = $2, updated_at = NOW()
       WHERE stripe_subscription_id = $3`,
      [status, currentPeriodEnd, stripeSubscriptionId]
    );
  } else {
    await query(
      `UPDATE cloud_entitlements 
       SET status = $1, updated_at = NOW()
       WHERE stripe_subscription_id = $2`,
      [status, stripeSubscriptionId]
    );
  }

  console.log(`[Webhook] Updated subscription ${stripeSubscriptionId} to status=${status}`);
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

  await upsertCloudEntitlement({
    userId: finalUserId,
    cloudId: finalCloudId,
    tier: finalTier,
    status: "active",
    stripeCustomerId: session.customer as string | null,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd,
  });
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

  let finalUserId = userIdStr ? parseInt(userIdStr, 10) : null;

  if (!finalUserId && customerEmail) {
    const user = await getUserByEmail(customerEmail);
    if (user) {
      finalUserId = user.id;
    }
  }

  if (!finalUserId) {
    console.error("[Webhook] Could not determine user for Global Pro subscription:", session.id);
    return;
  }

  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  for (const cloudId of PUBLIC_CLOUD_IDS) {
    await upsertCloudEntitlement({
      userId: finalUserId,
      cloudId,
      tier: 'pro',
      status: 'active',
      stripeCustomerId: session.customer as string | null,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
    });
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
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  let status = "active";
  if (subscription.status === "past_due") {
    status = "past_due";
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    status = "canceled";
  } else if (subscription.status === "active" || subscription.status === "trialing") {
    status = "active";
  }

  await updateSubscriptionStatus(stripeSubscriptionId, status, currentPeriodEnd);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;
  await updateSubscriptionStatus(stripeSubscriptionId, "canceled");
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
