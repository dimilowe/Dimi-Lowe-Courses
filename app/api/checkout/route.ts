import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import Stripe from "stripe";
import { ALL_CLOUD_IDS, CloudId } from "@/lib/cloudTheme";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:5000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  return `${forwardedProto || protocol}://${host}`;
}

async function getCmsProductBySlug(slug: string) {
  const result = await query(
    `SELECT * FROM cms_objects WHERE slug = $1 AND type = 'product'`,
    [slug]
  );
  return result.rows[0] || null;
}

const TIER_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  global_pro: process.env.STRIPE_PRICE_GLOBAL_PRO,
};

function isValidCloudId(cloudId: string): cloudId is CloudId {
  return ALL_CLOUD_IDS.includes(cloudId as CloudId);
}

function isValidTier(tier: string): tier is "starter" | "basic" | "pro" {
  return ["starter", "basic", "pro"].includes(tier);
}

async function handleCloudSubscriptionCheckout(
  request: NextRequest,
  body: { cloudId: string; tier: string }
) {
  const { cloudId, tier } = body;

  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json(
      { error: "You must be signed in to subscribe. Please sign in first." },
      { status: 401 }
    );
  }

  const userId = session.userId;

  if (!cloudId || !isValidCloudId(cloudId)) {
    return NextResponse.json(
      { error: "Invalid or missing cloudId. Must be one of the 10 valid clouds." },
      { status: 400 }
    );
  }

  if (!tier || !isValidTier(tier)) {
    return NextResponse.json(
      { error: "Invalid or missing tier. Must be starter, basic, or pro." },
      { status: 400 }
    );
  }

  const priceId = TIER_PRICE_MAP[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for tier: ${tier}` },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(request);

  const metadata = {
    type: "cloud",
    cloud_id: cloudId,
    tier: tier,
    user_id: userId,
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pricing?success=1`,
    cancel_url: `${baseUrl}/pricing?canceled=1`,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  console.log(`[Checkout] Created cloud subscription session: ${checkoutSession.id}, cloudId=${cloudId}, tier=${tier}, userId=${userId}`);

  return NextResponse.json({ url: checkoutSession.url });
}

async function handleCmsProductCheckout(
  request: NextRequest,
  body: { slug: string; priceId?: string; mode?: string; offerKey?: string }
) {
  const { slug, priceId: overridePriceId, mode: overrideMode, offerKey: overrideOfferKey } = body;

  if (!slug) {
    return NextResponse.json(
      { error: "Missing product slug" },
      { status: 400 }
    );
  }

  const cmsObject = await getCmsProductBySlug(slug);
  if (!cmsObject) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  const productData = cmsObject.data?.product_data;
  if (!productData) {
    return NextResponse.json(
      { error: "Product has no product_data configured" },
      { status: 500 }
    );
  }

  if (productData.checkout_strategy !== 'stripe') {
    return NextResponse.json(
      { error: "Product not configured for Stripe checkout" },
      { status: 400 }
    );
  }

  const priceId = overridePriceId || productData.primary_price_id;
  const mode = overrideMode || productData.mode || 'payment';
  const offerKey = overrideOfferKey || productData.offer_key;

  if (!priceId) {
    return NextResponse.json(
      { error: "No Stripe price ID configured for this product" },
      { status: 500 }
    );
  }

  if (!offerKey) {
    return NextResponse.json(
      { error: "No offer_key configured for this product" },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(request);

  const successUrl = productData.success_path
    ? `${baseUrl}${productData.success_path}`
    : `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&product=${slug}`;

  const cancelUrl = productData.cancel_path
    ? `${baseUrl}${productData.cancel_path}`
    : `${baseUrl}/products/${slug}?canceled=true`;

  const checkoutMode = mode === 'subscription' ? 'subscription' : 'payment';

  const session = await stripe.checkout.sessions.create({
    mode: checkoutMode,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      offer_key: offerKey,
      cms_slug: slug,
      checkout_type: 'cms',
    },
  });

  return NextResponse.json({ url: session.url });
}

async function handleGlobalProCheckout(request: NextRequest) {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json(
      { error: "You must be signed in to subscribe. Please sign in first." },
      { status: 401 }
    );
  }

  const userId = session.userId;

  const priceId = TIER_PRICE_MAP.global_pro;
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for Global Pro" },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(request);

  const metadata = {
    type: "global",
    tier: "pro",
    user_id: userId,
    offer_key: "cloud_all_pro_monthly",
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pricing?success=1`,
    cancel_url: `${baseUrl}/pricing?canceled=1`,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  console.log(`[Checkout] Created Global Pro subscription session: ${checkoutSession.id}, userId=${userId}`);

  return NextResponse.json({ url: checkoutSession.url });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const checkoutType = body.type;

    if (checkoutType === "global") {
      return handleGlobalProCheckout(request);
    } else if (checkoutType === "cloud") {
      return handleCloudSubscriptionCheckout(request, body);
    } else {
      return handleCmsProductCheckout(request, body);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
