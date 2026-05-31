import { query } from "@/lib/db";

export interface PublicCatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string;
  type: string;
  price_type: string;
  price: number;
}

type DbErrorWithCode = {
  code?: string;
};

function isMissingProductsRelation(error: unknown): boolean {
  return (error as DbErrorWithCode | null | undefined)?.code === "42P01";
}

export async function queryPublicCatalogProducts(
  sql: string,
  params?: unknown[]
): Promise<PublicCatalogProduct[]> {
  try {
    const result = await query(sql, params as any[]);
    return result.rows as unknown as PublicCatalogProduct[];
  } catch (error) {
    if (isMissingProductsRelation(error)) {
      console.warn("[public-catalog] products table is unavailable; returning empty catalog.", error);
      return [];
    }
    throw error;
  }
}
