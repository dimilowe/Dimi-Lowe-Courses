import { query } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { EmailCapture } from "@/components/email-capture";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Store | VCM Suite",
  description: "Shop VCM Suite apps, downloads, templates, and creator resources.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Store | VCM Suite",
    description: "Apps, downloads, templates, and creator resources from VCM Suite.",
    url: "/store",
    type: "website",
  },
};

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string;
  type: string;
  price_type: string;
  price: number;
}

async function getProducts(): Promise<Product[]> {
  const result = await query(
    `SELECT id, slug, name, description, thumbnail_url, type, price_type, price 
     FROM products 
     WHERE visibility = 'public' AND type != 'invisible'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export default async function StorePage() {
  const products = await getProducts();
  
  const productsByType = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const typeOrder = ["app", "course", "funnel", "download", "freebie"];
  const sortedTypes = typeOrder.filter(type => productsByType[type]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Store</h1>
        <p className="text-xl text-muted-foreground">
          Browse all our apps, courses, downloads, and more
        </p>
      </div>

      {sortedTypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No products available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedTypes.map((type) => (
            <section key={type}>
              <h2 className="text-2xl font-bold mb-6 capitalize">{type}s</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsByType[type].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-16 max-w-2xl mx-auto">
        <EmailCapture source="store" />
      </div>
    </div>
  );
}
