import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductRecommendations } from "@/components/product-recommendations";
import { ClaimButton } from "@/components/claim-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import CreatorStack from "@/components/CreatorStack";
import MonetizationBar from "@/components/MonetizationBar";
import ReactMarkdown from 'react-markdown';
import { extractOrderBumpMeta } from "@/lib/products/orderBump";

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string;
  type: string;
  price_type: string;
  price: number;
  stripe_price_id: string;
  meta: any;
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

async function getProduct(slug: string): Promise<Product | null> {
  const result = await query(
    `SELECT * FROM products WHERE slug = $1 AND visibility = 'public'`,
    [slug]
  );
  return result.rows[0] || null;
}

async function getOrderBumpProduct(productId: number): Promise<OrderBumpProduct | null> {
  const result = await query(
    `SELECT id, slug, name, description, price_type, price, visibility
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  return result.rows[0] || null;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const isFree = product.price_type === "free";
  const orderBumpMeta = extractOrderBumpMeta(product.meta);
  let orderBump: {
    id: string;
    name: string;
    price: number;
    headline?: string;
    description?: string;
    cta_label?: string;
  } | null = null;

  const productId = Number.parseInt(String(product.id), 10);
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
  
  // Convert plain text formatting to markdown
  const formatDescription = (text: string) => {
    const lines = text.split('\n');
    const formatted: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // Skip empty lines but preserve as paragraph breaks
      if (line === '') {
        formatted.push('');
        continue;
      }
      
      // Detect section headings (short lines that seem like titles)
      // Keywords that indicate major sections
      const sectionKeywords = ['What It Does', 'Who It\'s For', 'Why It Matters', 'Bottom Line', 'How It Works'];
      if (sectionKeywords.some(keyword => line.includes(keyword))) {
        formatted.push(`\n## ${line}\n`);
      }
      // Detect sub-headings (title case lines under 50 chars with descriptive next line)
      else if (line.length < 50 && nextLine.length > 0 && !line.includes('—') && !line.includes('.') && /^[A-Z]/.test(line)) {
        formatted.push(`\n### ${line}\n`);
      }
      // Regular paragraph text
      else {
        formatted.push(line);
      }
    }
    
    return formatted.join('\n');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        <div>
          {product.thumbnail_url && (
            <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <Badge variant="secondary" className="capitalize mb-4">
              {product.type}
            </Badge>
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          </div>

          <div className="prose prose-stone max-w-none text-lg text-muted-foreground mb-8">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                h2: ({ children }) => <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>,
                h3: ({ children }) => <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
              }}
            >
              {formatDescription(product.description)}
            </ReactMarkdown>
          </div>

          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold">
                {isFree ? "Free" : `$${(product.price / 100).toFixed(2)}`}
              </div>
            </div>
            
            <div className="space-y-3">
              <ClaimButton product={product} orderBump={orderBump} />
              <AddToCartButton product={product} />
            </div>
          </Card>

          {product.meta?.features && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">What's included:</h3>
              <ul className="space-y-2">
                {product.meta.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
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
