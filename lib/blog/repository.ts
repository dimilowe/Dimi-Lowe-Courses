import { cache } from "react";
import { query } from "@/lib/db";

export interface BlogPostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: Date;
  view_count: number;
  categories: { id: number; name: string; slug: string }[];
}

export interface BlogPostDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  published_at: Date;
  view_count: number;
  is_indexed: boolean;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

type PaginatedBlogPosts = {
  posts: BlogPostListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

const POSTS_PER_PAGE = 10;

const resolveBlogSchema = cache(async (): Promise<"blog_posts" | "posts"> => {
  const result = await query<{ has_blog_posts: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'blog_posts'
     ) AS has_blog_posts`
  );

  return result.rows[0]?.has_blog_posts ? "blog_posts" : "posts";
});

export async function getPaginatedBlogPosts(
  categorySlug?: string,
  page: number = 1
): Promise<PaginatedBlogPosts> {
  const schema = await resolveBlogSchema();
  const offset = (page - 1) * POSTS_PER_PAGE;

  if (schema === "blog_posts") {
    let countSql = `
      SELECT COUNT(DISTINCT bp.id) as count
      FROM blog_posts bp
      LEFT JOIN blog_post_categories bpc ON bp.id = bpc.blog_post_id
      WHERE bp.published_at IS NOT NULL AND bp.published_at <= NOW() AND (bp.unlisted IS NULL OR bp.unlisted = false)
    `;

    let sql = `
      SELECT 
        bp.id, 
        bp.title, 
        bp.slug, 
        bp.excerpt, 
        bp.featured_image_url, 
        bp.published_at, 
        bp.view_count,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM blog_posts bp
      LEFT JOIN blog_post_categories bpc ON bp.id = bpc.blog_post_id
      LEFT JOIN categories c ON bpc.category_id = c.id
      WHERE bp.published_at IS NOT NULL AND bp.published_at <= NOW() AND (bp.unlisted IS NULL OR bp.unlisted = false)
    `;

    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (categorySlug) {
      const categoryFilter = ` AND bp.id IN (
        SELECT blog_post_id FROM blog_post_categories
        WHERE category_id = (SELECT id FROM categories WHERE slug = $${paramIndex})
      )`;
      sql += categoryFilter;
      countSql += categoryFilter;
      params.push(categorySlug);
      paramIndex++;
    }

    sql += `
      GROUP BY bp.id
      ORDER BY bp.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await query<{ count: string }>(countSql, categorySlug ? [categorySlug] : []);
    const totalCount = parseInt(countResult.rows[0]?.count || "0", 10);
    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
    const result = await query<BlogPostListItem>(sql, [...params, POSTS_PER_PAGE, offset]);

    return {
      posts: result.rows,
      totalCount,
      totalPages,
      currentPage: page,
    };
  }

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM posts
     WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()`
  );
  const totalCount = parseInt(countResult.rows[0]?.count || "0", 10);
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const result = await query<BlogPostListItem>(
    `SELECT
       id,
       title,
       slug,
       COALESCE(excerpt, '') AS excerpt,
       cover_image_url AS featured_image_url,
       published_at,
       0::integer AS view_count,
       '[]'::json AS categories
     FROM posts
     WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()
     ORDER BY published_at DESC
     LIMIT $1 OFFSET $2`,
    [POSTS_PER_PAGE, offset]
  );

  return {
    posts: result.rows,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const schema = await resolveBlogSchema();

  if (schema !== "blog_posts") {
    return [];
  }

  const result = await query<BlogCategory>(
    `SELECT 
      c.id, 
      c.name, 
      c.slug,
      COUNT(bpc.blog_post_id) as post_count
     FROM categories c
     LEFT JOIN blog_post_categories bpc ON c.id = bpc.category_id
     LEFT JOIN blog_posts bp ON bpc.blog_post_id = bp.id 
       AND bp.published_at IS NOT NULL 
       AND bp.published_at <= NOW()
       AND (bp.unlisted IS NULL OR bp.unlisted = false)
     GROUP BY c.id
     HAVING COUNT(bpc.blog_post_id) > 0
     ORDER BY c.name ASC`
  );

  return result.rows;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const schema = await resolveBlogSchema();

  if (schema === "blog_posts") {
    const result = await query<BlogPostDetail>(
      `SELECT id, title, slug, content, excerpt, meta_description, featured_image_url, published_at, view_count, is_indexed
       FROM blog_posts
       WHERE slug = $1 AND published_at IS NOT NULL AND published_at <= NOW()
       LIMIT 1`,
      [slug]
    );

    return result.rows[0] || null;
  }

  const result = await query<BlogPostDetail>(
    `SELECT
       id,
       title,
       slug,
       content,
       excerpt,
       NULL::text AS meta_description,
       cover_image_url AS featured_image_url,
       published_at,
       0::integer AS view_count,
       true AS is_indexed
     FROM posts
     WHERE slug = $1 AND status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] || null;
}

export async function incrementBlogPostViewCount(postId: number): Promise<void> {
  const schema = await resolveBlogSchema();

  if (schema !== "blog_posts") {
    return;
  }

  await query(`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1`, [postId]);
}

export async function getRelatedBlogPosts(currentPostId: number): Promise<BlogPostListItem[]> {
  const schema = await resolveBlogSchema();

  if (schema === "blog_posts") {
    const result = await query<BlogPostListItem>(
      `SELECT
         id,
         title,
         slug,
         COALESCE(excerpt, '') AS excerpt,
         featured_image_url,
         published_at,
         view_count,
         '[]'::json AS categories
       FROM blog_posts
       WHERE id != $1 AND published_at IS NOT NULL AND published_at <= NOW()
       ORDER BY published_at DESC
       LIMIT 3`,
      [currentPostId]
    );
    return result.rows;
  }

  const result = await query<BlogPostListItem>(
    `SELECT
       id,
       title,
       slug,
       COALESCE(excerpt, '') AS excerpt,
       cover_image_url AS featured_image_url,
       published_at,
       0::integer AS view_count,
       '[]'::json AS categories
     FROM posts
     WHERE id != $1 AND status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()
     ORDER BY published_at DESC
     LIMIT 3`,
    [currentPostId]
  );

  return result.rows;
}
