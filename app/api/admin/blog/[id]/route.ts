import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, slug, content, excerpt, meta_description, featured_image_url, published_at, category_ids, unlisted, save_only } = await request.json();

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists for a different post
    const existing = await query(
      "SELECT id FROM blog_posts WHERE slug = $1 AND id != $2",
      [slug, id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    if (save_only) {
      await query(
        `UPDATE blog_posts 
         SET title = $1, slug = $2, content = $3, excerpt = $4, meta_description = $5, 
             featured_image_url = $6, unlisted = $7, updated_at = NOW()
         WHERE id = $8`,
        [title, slug, content, excerpt, meta_description, featured_image_url, unlisted || false, id]
      );
    } else {
      await query(
        `UPDATE blog_posts 
         SET title = $1, slug = $2, content = $3, excerpt = $4, meta_description = $5, 
             featured_image_url = $6, published_at = $7, unlisted = $8, updated_at = NOW()
         WHERE id = $9`,
        [title, slug, content, excerpt, meta_description, featured_image_url, published_at, unlisted || false, id]
      );
    }

    // Update categories - remove old ones and add new ones
    await query("DELETE FROM blog_post_categories WHERE blog_post_id = $1", [id]);
    
    if (category_ids && category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await query(
          "INSERT INTO blog_post_categories (blog_post_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, categoryId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update blog post error:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { id } = await params;

    await query("DELETE FROM blog_posts WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete blog post error:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
