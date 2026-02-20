import { query } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { EmailCapture } from "@/components/email-capture";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Courses | VCM Suite",
  description: "Explore VCM Suite courses, lessons, and training resources for creators.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Courses | VCM Suite",
    description: "Courses, lessons, and training resources for creators.",
    url: "/courses",
    type: "website",
  },
};

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

async function getCourses(): Promise<Product[]> {
  const result = await query(
    `SELECT id, slug, name, description, thumbnail_url, type, price_type, price
     FROM products
     WHERE visibility = 'public'
       AND type IN ('course', 'video')
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-neutral-900/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">COURSES</h1>
          <p className="text-xl tracking-wide text-neutral-100">Video courses and training programs</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-neutral-600">No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
            {courses.map((course) => (
              <ProductCard key={course.id} product={course} />
            ))}
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-20">
          <EmailCapture source="courses-page" />
        </div>
      </div>
    </div>
  );
}
