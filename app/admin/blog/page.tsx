import { query } from "@/lib/db";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { BlogSearchList } from "@/components/BlogSearchList";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  published_at: Date | null;
  created_at: Date;
  view_count: number;
}

async function getAllBlogPosts(): Promise<BlogPost[]> {
  const result = await query(
    `SELECT id, title, slug, published_at, created_at, view_count
     FROM blog_posts 
     ORDER BY created_at DESC`,
    []
  );
  return result.rows as unknown as BlogPost[];
}

export default async function AdminBlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-500" />
              Blog
            </h1>
            <p className="text-gray-500 mt-1">Create and manage your blog posts</p>
          </div>
          <Link href="/admin/blog/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No blog posts yet. Create your first post!
              </p>
              <Link href="/admin/blog/new">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <BlogSearchList posts={posts} />
        )}
      </div>
    </AdminLayout>
  );
}
