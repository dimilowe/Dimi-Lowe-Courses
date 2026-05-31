import { query } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

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

interface ProductRecommendationsProps {
  currentProductId: string;
  productType: string;
}

async function getRecommendations(currentProductId: string, productType: string): Promise<Product[]> {
  const result = await query(
    `SELECT id, slug, name, description, thumbnail_url, type, price_type, price 
     FROM products 
     WHERE visibility = 'public' 
     AND id != $1 
     AND type = $2
     ORDER BY created_at DESC 
     LIMIT 3`,
    [currentProductId, productType]
  );
  return result.rows as unknown as Product[];
}

export async function ProductRecommendations({ currentProductId, productType }: ProductRecommendationsProps) {
  const recommendations = await getRecommendations(currentProductId, productType);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">You might also like</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
