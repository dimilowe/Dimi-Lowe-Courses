import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { SessionManager } from "@/components/SessionManager";
import { LoginForm } from "@/components/LoginForm";
import type { Metadata } from "next";
import { getEntitledProductsForUser, type EntitledProduct } from "@/lib/products/entitlements";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Dashboard | VCM Suite",
  robots: { index: false, follow: false },
};

async function getUserEntitlements(userId: string): Promise<EntitledProduct[]> {
  return getEntitledProductsForUser(userId);
}

function isCourseProductType(productType: string): boolean {
  return productType === "video" || productType === "course";
}

function ProductCardItem({ item }: { item: EntitledProduct }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {item.thumbnail_url && (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img
            src={item.thumbnail_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{item.product_name}</CardTitle>
          <Badge variant="secondary" className="capitalize shrink-0">
            {item.product_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Added {new Date(item.created_at).toLocaleDateString()}
        </p>
        {isCourseProductType(item.product_type) && (
          <Link
            href={`/courses/${item.product_slug}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 h-10 px-4 py-2 w-full"
          >
            Continue Course
          </Link>
        )}
        {item.download_url && (
          <a
            href={item.download_url}
            download
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-500 text-white hover:bg-orange-600 h-10 px-4 py-2 w-full"
          >
            Download Now
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ success?: string; session_id?: string }> }) {
  const params = await searchParams;
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Access your courses, products, and membership library
          </p>
        </div>
        {params.session_id ? (
          <SessionManager sessionId={params.session_id} />
        ) : (
          <LoginForm />
        )}
      </div>
    );
  }

  const entitlements = await getUserEntitlements(session.userId);
  const courseEntitlements = entitlements.filter((item) => isCourseProductType(item.product_type));
  const otherEntitlements = entitlements.filter((item) => !isCourseProductType(item.product_type));
  const showSuccess = params.success === 'true';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Access your courses, products, and membership library
          </p>
        </div>
        <Link
          href="/workspace"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 h-10 px-4 py-2"
        >
          Open Workspace
        </Link>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Purchase successful. Your content is ready.
          </p>
        </div>
      )}

      {entitlements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              You don't have any products or membership content yet.
            </p>
            <Link
              href="/store"
              className="text-primary hover:underline font-medium"
            >
              Browse the store
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {courseEntitlements.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
                <p className="text-muted-foreground">Continue watching your purchased video courses.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseEntitlements.map((item) => (
                  <ProductCardItem key={`course-${item.product_id}`} item={item} />
                ))}
              </div>
            </section>
          )}

          {otherEntitlements.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
                <p className="text-muted-foreground">Downloads and other purchased resources.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherEntitlements.map((item) => (
                  <ProductCardItem key={`product-${item.product_id}`} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
