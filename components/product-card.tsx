import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isFree = product.price_type === "free";
  const isApp = product.type === "app";
  const isMembership = product.price_type === "membership";
  
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border-gray-200 group">
        <CardHeader className="p-0">
          {product.thumbnail_url && (
            <div className="aspect-[4/5] bg-gray-50 overflow-hidden">
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-base font-semibold tracking-wide text-gray-900">{product.name}</CardTitle>
            <Badge variant="outline" className="capitalize shrink-0 text-xs border-orange-500 text-orange-500">
              {product.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-0 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">
            {isFree ? (isApp ? "In App" : "Free") : isMembership ? "Included with membership" : `$${(product.price / 100).toFixed(2)}`}
          </div>
          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
            View
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
