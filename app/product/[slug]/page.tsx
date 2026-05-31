import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { query } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductRecommendations } from "@/components/product-recommendations";
import { ClaimButton } from "@/components/claim-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import CreatorStack from "@/components/CreatorStack";
import MonetizationBar from "@/components/MonetizationBar";
import {
  getBundleIncludedProducts,
  type BundleIncludedProductSummary,
} from "@/lib/products/bundleAccess";
import { extractOrderBumpMeta } from "@/lib/products/orderBump";
import { extractSalesPageMeta } from "@/lib/products/salesPageTemplate";
import { LongformOfferTemplate } from "@/components/sales-templates/LongformOfferTemplate";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  type: string;
  price_type: string;
  price: number;
  stripe_price_id: string;
  external_url?: string | null;
  meta: unknown;
}

interface OrderBumpProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_type: string;
  price: number;
  visibility: string;
}

interface ResolvedOrderBump {
  id: string;
  name: string;
  price: number;
  headline?: string;
  description?: string;
  cta_label?: string;
}

async function getProduct(slug: string): Promise<Product | null> {
  const result = await query(
    `SELECT * FROM products WHERE slug = $1 AND visibility = 'public'`,
    [slug]
  );
  return (result.rows[0] as unknown as Product | undefined) || null;
}

async function getOrderBumpProduct(productId: number): Promise<OrderBumpProduct | null> {
  const result = await query(
    `SELECT id, slug, name, description, price_type, price, visibility
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  return (result.rows[0] as unknown as OrderBumpProduct | undefined) || null;
}

function formatDescription(text: string) {
  const lines = text.split("\n");
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";

    if (line === "") {
      formatted.push("");
      continue;
    }

    const sectionKeywords = ["What It Does", "Who It's For", "Why It Matters", "Bottom Line", "How It Works"];
    if (sectionKeywords.some((keyword) => line.includes(keyword))) {
      formatted.push(`\n## ${line}\n`);
    } else if (
      line.length < 50 &&
      nextLine.length > 0 &&
      !line.includes("—") &&
      !line.includes(".") &&
      /^[A-Z]/.test(line)
    ) {
      formatted.push(`\n### ${line}\n`);
    } else {
      formatted.push(line);
    }
  }

  return formatted.join("\n");
}

function extractMetaFeatures(meta: unknown): string[] {
  if (typeof meta !== "object" || meta === null || Array.isArray(meta)) return [];
  const raw = (meta as Record<string, unknown>).features;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function DefaultProductTemplate({
  product,
  orderBump,
  includedBundleProducts,
}: {
  product: Product;
  orderBump: ResolvedOrderBump | null;
  includedBundleProducts: BundleIncludedProductSummary[];
}) {
  const isFree = product.price_type === "free";
  const isMembership = product.price_type === "membership";
  const featureList = extractMetaFeatures(product.meta);
  const saveButtonProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    price: product.price,
    thumbnail_url: product.thumbnail_url || undefined,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-16 grid gap-12 lg:grid-cols-2">
        <div>
          {product.thumbnail_url && (
            <div className="mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <Badge variant="secondary" className="mb-4 capitalize">
              {product.type}
            </Badge>
            <h1 className="mb-2 text-4xl font-bold">{product.name}</h1>
          </div>

          <div className="prose prose-stone mb-8 max-w-none text-lg text-muted-foreground">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h2 className="mb-3 mt-6 text-2xl font-bold">{children}</h2>,
                h2: ({ children }) => <h3 className="mb-2 mt-5 text-xl font-semibold">{children}</h3>,
                h3: ({ children }) => <h4 className="mb-2 mt-4 text-lg font-semibold">{children}</h4>,
                ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
              }}
            >
              {formatDescription(product.description)}
            </ReactMarkdown>
          </div>

          <Card className="mb-6 p-6">
            <div className="mb-6 text-center">
              <div className="text-3xl font-bold">
                {isFree ? "Free" : isMembership ? "Included with membership" : `$${(product.price / 100).toFixed(2)}`}
              </div>
              {isMembership && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Join for $49/month to access this and every other course, download, and digital product.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <ClaimButton product={product} orderBump={orderBump} />
              <AddToCartButton product={saveButtonProduct} />
            </div>
          </Card>

          {featureList.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">What's included:</h3>
              <ul className="space-y-2">
                {featureList.map((feature, i) => (
                  <li key={`${feature}-${i}`} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {includedBundleProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">Included Modules</h3>
              <div className="space-y-2">
                {includedBundleProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm capitalize text-gray-500">{item.type}</p>
                    </div>
                    {item.visibility === "public" && (
                      <a
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductRecommendations currentProductId={product.id} productType={product.type} />
      <CreatorStack />
      <MonetizationBar />
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const orderBumpMeta = extractOrderBumpMeta(product.meta);
  let orderBump: ResolvedOrderBump | null = null;

  const productId = Number.parseInt(String(product.id), 10);
  const includedBundleProducts = Number.isFinite(productId)
    ? await getBundleIncludedProducts(productId)
    : [];
  if (orderBumpMeta && Number.isFinite(productId) && orderBumpMeta.product_id !== productId) {
    const bumpProduct = await getOrderBumpProduct(orderBumpMeta.product_id);
    if (
      bumpProduct &&
      bumpProduct.visibility === "public" &&
      bumpProduct.price_type !== "free" &&
      Number(bumpProduct.price) > 0
    ) {
      orderBump = {
        id: String(bumpProduct.id),
        name: bumpProduct.name,
        price: Number(bumpProduct.price),
        headline: orderBumpMeta.headline,
        description: orderBumpMeta.description || bumpProduct.description || undefined,
        cta_label: orderBumpMeta.cta_label,
      };
    }
  }

  const salesPageMeta = extractSalesPageMeta(product.meta);
  if (salesPageMeta?.template_id === "longform_offer_v1") {
    return (
      <LongformOfferTemplate
        product={product}
        orderBump={orderBump}
        includedBundleProducts={includedBundleProducts}
      />
    );
  }

  return (
    <DefaultProductTemplate
      product={product}
      orderBump={orderBump}
      includedBundleProducts={includedBundleProducts}
    />
  );
}
