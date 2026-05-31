import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import { BlogPostEditor } from "@/components/BlogPostEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  published_at: Date | null;
  unlisted: boolean;
}

async function getBlogPost(idOrSlug: string): Promise<BlogPost | null> {
  const isNumeric = /^\d+$/.test(idOrSlug);
  
  const result = await query(
    isNumeric 
      ? `SELECT id, title, slug, content, excerpt, meta_description, featured_image_url, published_at, unlisted
         FROM blog_posts WHERE id = $1`
      : `SELECT id, title, slug, content, excerpt, meta_description, featured_image_url, published_at, unlisted
         FROM blog_posts WHERE slug = $1`,
    [isNumeric ? parseInt(idOrSlug) : idOrSlug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0] as unknown as BlogPost;
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPost(id);
  
  if (!post) {
    notFound();
  }
  
  return <BlogPostEditor post={post} />;
}
