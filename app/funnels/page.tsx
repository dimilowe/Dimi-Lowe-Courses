import { ProductCard } from "@/components/product-card";
import { EmailCapture } from "@/components/email-capture";
import { queryPublicCatalogProducts, type PublicCatalogProduct } from "@/lib/products/publicCatalog";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Templates | VCM Suite",
  description: "Browse conversion-oriented templates and funnel assets from VCM Suite.",
  alternates: {
    canonical: "/funnels",
  },
  openGraph: {
    title: "Templates | VCM Suite",
    description: "Conversion-oriented templates and funnel assets for creators.",
    url: "/funnels",
    type: "website",
  },
};

async function getFunnels(): Promise<PublicCatalogProduct[]> {
  return queryPublicCatalogProducts(
    `SELECT id, slug, name, description, thumbnail_url, type, price_type, price 
     FROM products 
     WHERE visibility = 'public' AND type = 'funnel'
     ORDER BY created_at DESC`
  );
}

export default async function FunnelsPage() {
  const funnels = await getFunnels();

  return (
    <div className="min-h-screen bg-white">
      <div 
        className="relative h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-neutral-900/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">TEMPLATES</h1>
          <p className="text-xl tracking-wide text-neutral-100">Conversion-optimized sales systems</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {funnels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-neutral-600">No templates available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
            {funnels.map((funnel) => (
              <ProductCard key={funnel.id} product={funnel} />
            ))}
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-20">
          <EmailCapture source="funnels-page" />
        </div>
      </div>
    </div>
  );
}
