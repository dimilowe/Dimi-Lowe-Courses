import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ClusterArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  cluster_slug: string;
  is_published: boolean;
  is_indexed: boolean;
}

async function getArticle(idOrSlug: string): Promise<ClusterArticle | null> {
  const isNumeric = /^\d+$/.test(idOrSlug);
  
  const result = await query(
    isNumeric 
      ? `SELECT id, title, slug, content, excerpt, meta_description, cluster_slug, is_published, is_indexed
         FROM cluster_articles WHERE id = $1`
      : `SELECT id, title, slug, content, excerpt, meta_description, cluster_slug, is_published, is_indexed
         FROM cluster_articles WHERE slug = $1`,
    [isNumeric ? parseInt(idOrSlug) : idOrSlug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0] as ClusterArticle;
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  
  if (!article) {
    notFound();
  }
  
  return <ArticleEditor article={article} />;
}
