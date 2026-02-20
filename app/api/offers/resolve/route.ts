import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "@/lib/db";
import { extractPostPurchaseOffersMeta } from "@/lib/products/postPurchaseOffers";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  price_type: string | null;
  price: number | string | null;
  visibility: string | null;
  meta?: unknown;
};

async function getProductById(productId: number, includeMeta = false): Promise<ProductRow | null> {
  const result = includeMeta
    ? await query(
        `SELECT id, slug, name, description, thumbnail_url, price_type, price, visibility, meta
         FROM products
         WHERE id = $1
         LIMIT 1`,
        [productId]
      )
    : await query(
        `SELECT id, slug, name, description, thumbnail_url, price_type, price, visibility
         FROM products
         WHERE id = $1
         LIMIT 1`,
        [productId]
      );

  return result.rows[0] || null;
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function toOfferPayload(product: ProductRow, copy?: { headline?: string; description?: string; cta_label?: string }) {
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    description: (copy?.description || product.description || "").trim(),
    headline: copy?.headline || undefined,
    cta_label: copy?.cta_label || undefined,
    thumbnail_url: product.thumbnail_url,
    price: Math.round(Number(product.price || 0)),
  };
}

function isEligibleOfferProduct(product: ProductRow | null): product is ProductRow {
  if (!product) return false;
  if (product.visibility !== "public") return false;
  if (product.price_type === "free") return false;
  const cents = Math.round(Number(product.price || 0));
  return cents > 0;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId.trim());
    const checkoutType = checkoutSession.metadata?.type || checkoutSession.metadata?.checkout_type;
    if (checkoutType !== "product") {
      return NextResponse.json({ offers: null });
    }
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ offers: null });
    }

    const primaryProductId = toPositiveInt(checkoutSession.metadata?.productId);
    if (!primaryProductId) {
      return NextResponse.json({ offers: null });
    }

    const primaryProduct = await getProductById(primaryProductId, true);
    if (!primaryProduct) {
      return NextResponse.json({ offers: null });
    }

    const offersMeta = extractPostPurchaseOffersMeta(primaryProduct.meta);
    if (!offersMeta) {
      return NextResponse.json({
        offers: {
          sourceProduct: {
            id: String(primaryProduct.id),
            slug: primaryProduct.slug,
            name: primaryProduct.name,
          },
          upsell: null,
          downsell: null,
        },
      });
    }

    let upsell: ReturnType<typeof toOfferPayload> | null = null;
    let downsell: ReturnType<typeof toOfferPayload> | null = null;

    if (offersMeta.upsell_product_id && offersMeta.upsell_product_id !== primaryProduct.id) {
      const upsellProduct = await getProductById(offersMeta.upsell_product_id);
      if (isEligibleOfferProduct(upsellProduct)) {
        upsell = toOfferPayload(upsellProduct, {
          headline: offersMeta.upsell_headline,
          description: offersMeta.upsell_description,
          cta_label: offersMeta.upsell_cta_label,
        });
      }
    }

    if (offersMeta.downsell_product_id && offersMeta.downsell_product_id !== primaryProduct.id) {
      const downsellProduct = await getProductById(offersMeta.downsell_product_id);
      if (isEligibleOfferProduct(downsellProduct)) {
        downsell = toOfferPayload(downsellProduct, {
          headline: offersMeta.downsell_headline,
          description: offersMeta.downsell_description,
          cta_label: offersMeta.downsell_cta_label,
        });
      }
    }

    if (upsell && downsell && upsell.id === downsell.id) {
      downsell = null;
    }

    return NextResponse.json({
      offers: {
        sourceProduct: {
          id: String(primaryProduct.id),
          slug: primaryProduct.slug,
          name: primaryProduct.name,
        },
        upsell,
        downsell,
      },
    });
  } catch (error) {
    console.error("Failed to resolve post-purchase offers:", error);
    return NextResponse.json({ error: "Failed to resolve offers" }, { status: 500 });
  }
}
