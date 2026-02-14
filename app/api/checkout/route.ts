import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
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
  const userId = session.isLoggedIn && session.userId ? session.userId : null;
  const customerEmail = session.email || undefined;

  const priceId =
    process.env.STRIPE_PRICE_UNIVERSAL_SUBSCRIPTION || process.env.STRIPE_PRICE_GLOBAL_PRO;
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Stripe price not configured for global subscription. Set STRIPE_PRICE_UNIVERSAL_SUBSCRIPTION.",
      },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(request);

  const metadata: Record<string, string> = {
    type: "global",
    tier: "pro",
    offer_key: "global_workspace_subscription_monthly",
  };
  if (userId) {
    metadata.user_id = String(userId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?canceled=1`,
    customer_email: customerEmail,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  console.log(
    `[Checkout] Created global subscription session: ${checkoutSession.id}, userId=${userId}`
  );

  return NextResponse.json({ url: checkoutSession.url });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const checkoutType = body.type;

    if (checkoutType === "global") {
      return handleGlobalProCheckout(request);
    } else if (checkoutType === "cloud") {
      return NextResponse.json(
        {
          error:
            "Cloud-specific subscriptions are no longer sold. Use the global subscription instead.",
        },
        { status: 410 }
      );
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
