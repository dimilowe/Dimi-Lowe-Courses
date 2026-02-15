import { query } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { EmailCapture } from "@/components/email-capture";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Freebies | VCM Suite",
  description: "Get free creator resources, templates, and starter tools from VCM Suite.",
  alternates: {
    canonical: "/freebies",
  },
  openGraph: {
    title: "Freebies | VCM Suite",
    description: "Free creator resources, templates, and starter tools.",
    url: "/freebies",
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

async function getFreebies(): Promise<Product[]> {
  const result = await query(
    `SELECT id, slug, name, description, thumbnail_url, type, price_type, price 
     FROM products 
     WHERE visibility = 'public' AND type = 'freebie'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export default async function FreebiesPage() {
  const freebies = await getFreebies();

  return (
    <div className="min-h-screen bg-white">
      <div 
        className="relative h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-neutral-900/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">FREEBIES</h1>
          <p className="text-xl tracking-wide text-neutral-100">Free tools and resources to get started</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {freebies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-neutral-600">No freebies available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
            {freebies.map((freebie) => (
              <ProductCard key={freebie.id} product={freebie} />
            ))}
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-20">
          <EmailCapture source="freebies-page" />
        </div>
      </div>
    </div>
  );
}
