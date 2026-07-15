import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolveGrantedProductIdsForPurchaseProductIds } from "@/lib/products/bundleAccess";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import Stripe from "stripe";

const GLOBAL_SUBSCRIPTION = {
  currency: "usd",
  unitAmountCents: 4_900,
  interval: "month",
  productName: "Dimi Lowe All Access",
  description:
    "One subscription for every course, download, digital product, tool save feature, and workstation unlock.",
} as const;

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

type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  price_type: string | null;
  price: number | string | null;
  stripe_price_id: string | null;
  visibility: string | null;
};

async function getCatalogProductById(productId: number): Promise<CatalogProduct | null> {
  const result = await query(
    `SELECT id, slug, name, price_type, price,
            to_jsonb(products)->>'stripe_price_id' AS stripe_price_id,
            visibility
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  return (result.rows[0] as unknown as CatalogProduct) || null;
}

function toCheckoutLineItem(product: CatalogProduct, unitAmountCents: number) {
  if (product.stripe_price_id && product.stripe_price_id.trim().length > 0) {
    return {
      price: product.stripe_price_id,
      quantity: 1,
    } as const;
  }

  return {
    price_data: {
      currency: "usd",
      unit_amount: unitAmountCents,
      product_data: {
        name: product.name,
      },
    },
    quantity: 1,
  } as const;
}

async function handleCatalogProductCheckout(
  request: NextRequest,
  body: { productId: string | number; orderBumpProductId?: string | number | null }
) {
  const productIdNum = Number.parseInt(String(body.productId), 10);
  if (!Number.isFinite(productIdNum)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const product = await getCatalogProductById(productIdNum);
  if (!product || product.visibility !== "public") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const unitAmountCents = Math.round(Number(product.price || 0));
  const isFree = product.price_type === "free";
  if (isFree || unitAmountCents <= 0) {
    return NextResponse.json({ error: "This product is free and does not require checkout." }, { status: 400 });
  }

  const lineItems: Array<ReturnType<typeof toCheckoutLineItem>> = [toCheckoutLineItem(product, unitAmountCents)];
  const purchasedProductIds = [product.id];

  if (body.orderBumpProductId !== undefined && body.orderBumpProductId !== null && String(body.orderBumpProductId).trim() !== "") {
    const orderBumpProductId = Number.parseInt(String(body.orderBumpProductId), 10);
    if (!Number.isFinite(orderBumpProductId)) {
      return NextResponse.json({ error: "Invalid order bump product ID" }, { status: 400 });
    }

    if (orderBumpProductId === product.id) {
      return NextResponse.json({ error: "Order bump product must be different from the main product" }, { status: 400 });
    }

    const orderBumpProduct = await getCatalogProductById(orderBumpProductId);
    if (!orderBumpProduct || orderBumpProduct.visibility !== "public") {
      return NextResponse.json({ error: "Order bump product not found" }, { status: 404 });
    }

    const orderBumpAmountCents = Math.round(Number(orderBumpProduct.price || 0));
    if (orderBumpProduct.price_type === "free" || orderBumpAmountCents <= 0) {
      return NextResponse.json({ error: "Order bump product must be a paid product" }, { status: 400 });
    }

    lineItems.push(toCheckoutLineItem(orderBumpProduct, orderBumpAmountCents));
    purchasedProductIds.push(orderBumpProduct.id);
  }

  const grantedProductIds = await resolveGrantedProductIdsForPurchaseProductIds(purchasedProductIds);
  if (grantedProductIds.length === 0) {
    return NextResponse.json(
      { error: "This bundle is missing valid included products. Update the bundle before selling it." },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(request);
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  const customerEmail = session.isLoggedIn ? session.email || undefined : undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${baseUrl}/offers?success=true&session_id={CHECKOUT_SESSION_ID}&product=${product.slug}`,
    cancel_url: `${baseUrl}/products/${product.slug}?canceled=true`,
    customer_email: customerEmail,
    metadata: {
      productId: String(product.id),
      productIds: purchasedProductIds.join(","),
      purchasedProductIds: purchasedProductIds.join(","),
      grantedProductIds: grantedProductIds.join(","),
      productSlug: product.slug,
      checkout_type: "product",
    },
  });

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

  const productData = (cmsObject as Record<string, Record<string, unknown>>).data?.product_data as Record<string, unknown> | undefined;
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

  const priceId = (overridePriceId || productData.primary_price_id) as string;
  const mode = (overrideMode || productData.mode || 'payment') as string;
  const offerKey = (overrideOfferKey || productData.offer_key) as string;

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
    ? `${baseUrl}${productData.success_path as string}`
    : `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&product=${slug}`;

  const cancelUrl = productData.cancel_path
    ? `${baseUrl}${productData.cancel_path as string}`
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
        price_data: {
          currency: GLOBAL_SUBSCRIPTION.currency,
          unit_amount: GLOBAL_SUBSCRIPTION.unitAmountCents,
          recurring: {
            interval: GLOBAL_SUBSCRIPTION.interval,
          },
          product_data: {
            name: GLOBAL_SUBSCRIPTION.productName,
            description: GLOBAL_SUBSCRIPTION.description,
          },
        },
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

    if (body.productId) {
      return handleCatalogProductCheckout(request, body);
    } else if (checkoutType === "global") {
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
