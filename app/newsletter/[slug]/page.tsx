import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye, GraduationCap } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";

function formatContent(content: string): string {
  // Tiptap already outputs HTML, so just return it as-is
  return content;
}

interface BlogPost {
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

interface RecommendedCourse {
  id: number;
  slug: string;
  name: string;
  thumbnail_url: string | null;
  price_type: string | null;
  price: number | null;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const result = await query(
    `SELECT id, title, slug, content, excerpt, meta_description, featured_image_url, published_at, view_count, is_indexed
     FROM blog_posts 
     WHERE slug = $1 AND published_at IS NOT NULL AND published_at <= NOW()
     LIMIT 1`,
    [slug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

async function incrementViewCount(postId: number): Promise<void> {
  await query(
    `UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1`,
    [postId]
  );
}

async function getRelatedPosts(currentPostId: number): Promise<BlogPost[]> {
  const result = await query(
    `SELECT id, title, slug, excerpt, featured_image_url, published_at
     FROM blog_posts 
     WHERE id != $1 AND published_at IS NOT NULL AND published_at <= NOW()
     ORDER BY published_at DESC
     LIMIT 3`,
    [currentPostId]
  );
  return result.rows;
}

async function getRecommendedCourses(): Promise<RecommendedCourse[]> {
  const result = await query(
    `SELECT id, slug, name, thumbnail_url, price_type, price
     FROM products
     WHERE visibility = 'public'
       AND type IN ('video', 'course')
     ORDER BY created_at DESC
     LIMIT 3`
  );
  return result.rows;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  return {
    title: `${post.title} | VCM Suite`,
    description: post.meta_description || post.excerpt || post.title,
    robots: post.is_indexed 
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || post.title,
      type: 'article',
      publishedTime: post.published_at.toISOString(),
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    notFound();
  }
  
  // Increment view count only once during page render
  await incrementViewCount(post.id);
  
  const relatedPosts = await getRelatedPosts(post.id);
  const recommendedCourses = await getRecommendedCourses();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Image */}
      {post.featured_image_url && (
        <div 
          className="h-[400px] bg-cover bg-center relative"
          style={{ backgroundImage: `url('${post.featured_image_url}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/newsletter" 
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-2 bg-white rounded-lg shadow-sm p-8 md:p-12">
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                  {post.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={new Date(post.published_at).toISOString()}>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{post.view_count} views</span>
                  </div>
                </div>
              </header>
              
              {/* Audio Player */}
              <div className="mb-8">
                <AudioPlayer postId={post.id} />
              </div>
              
              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:mt-0
                  prose-a:text-orange-600 hover:prose-a:text-orange-700 
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:my-6 prose-ul:space-y-2
                  prose-ol:my-6 prose-ol:space-y-2
                  prose-li:text-gray-700
                  [&>p]:mb-6 [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />
              
              {/* Newsletter CTA */}
              <div className="mt-12 pt-8 border-t">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <h3 className="text-2xl font-bold mb-2">Want more content like this?</h3>
                    <p className="text-muted-foreground mb-4">
                      Join our newsletter for weekly insights delivered to your inbox.
                    </p>
                    <NewsletterSignup />
                  </CardContent>
                </Card>
              </div>
            </article>
            
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="space-y-6">
                {/* Related Courses */}
                <div className="bg-white rounded-lg border-2 border-orange-500 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-white" />
                      <h3 className="text-lg font-bold text-white">Recommended Courses</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Keep learning with these related courses.
                    </p>
                    {recommendedCourses.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {recommendedCourses.map((course) => (
                          <Link
                            key={course.id}
                            href={`/products/${course.slug}`}
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            <span className="line-clamp-1">{course.name}</span>
                            <span className="shrink-0 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                              {course.price_type === "free"
                                ? "Free"
                                : `$${((course.price || 0) / 100).toFixed(2)}`}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">
                        Course recommendations will appear here once courses are published.
                      </p>
                    )}
                    <Link
                      href="/store"
                      className="block w-full text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Browse Courses
                    </Link>
                  </div>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Related Articles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {relatedPosts.map((relatedPost) => (
                          <Link 
                            key={relatedPost.id} 
                            href={`/newsletter/${relatedPost.slug}`}
                            className="block group"
                          >
                            {relatedPost.featured_image_url && (
                              <div 
                                className="w-full h-32 bg-cover bg-center rounded-md mb-2"
                                style={{ backgroundImage: `url('${relatedPost.featured_image_url}')` }}
                              />
                            )}
                            <h4 className="font-semibold group-hover:text-orange-600 transition-colors line-clamp-2">
                              {relatedPost.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(relatedPost.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
