import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { CATEGORY_INFO, ToolCategory } from "@/data/toolsRegistry";
import { getToolsForDirectory } from "@/lib/tools/getToolsForDirectory";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

const VALID_CATEGORIES = Object.keys(CATEGORY_INFO) as ToolCategory[];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const canonical = `/tools/categories/${categorySlug}`;
  
  if (!VALID_CATEGORIES.includes(categorySlug as ToolCategory)) {
    return {
      title: "Category Not Found",
      robots: "noindex, nofollow",
      alternates: { canonical },
    };
  }

  const categoryInfo = CATEGORY_INFO[categorySlug as ToolCategory];

  return {
    title: `${categoryInfo.label} - Free Online Tools | VCM Suite`,
    description: `${categoryInfo.description}. Browse all free ${categoryInfo.label.toLowerCase()} available on VCM Suite.`,
    openGraph: {
      title: `${categoryInfo.label} | VCM Suite`,
      description: categoryInfo.description,
      type: "website",
      url: canonical,
    },
    robots: "index, follow",
    alternates: { canonical },
  };
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((categorySlug) => ({
    categorySlug,
  }));
}

async function getToolsForCategory(category: ToolCategory): Promise<{ slug: string; name: string; description: string }[]> {
  const allTools = await getToolsForDirectory();
  return allTools
    .filter(t => t.category === category)
    .map(t => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
    }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  if (!VALID_CATEGORIES.includes(categorySlug as ToolCategory)) {
    notFound();
  }

  const category = categorySlug as ToolCategory;
  const categoryInfo = CATEGORY_INFO[category];
  const tools = await getToolsForCategory(category);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryInfo.label,
    "description": categoryInfo.description,
    "mainEntity": {
      "@type": "ItemList",
      "name": categoryInfo.label,
      "numberOfItems": tools.length,
      "itemListElement": tools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.description,
          "url": `https://vcmsuite.com/tools/${tool.slug}`,
          "applicationCategory": "WebApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tools Explorer
            </Link>
            
            <div className="mb-2 text-4xl">
              {categoryInfo.emoji}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {categoryInfo.label}
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              {categoryInfo.description}. Browse all {tools.length} free tools in this category.
            </p>
          </div>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Wrench className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">
                All {categoryInfo.label} ({tools.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>

            {tools.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No tools in this category yet.</p>
              </div>
            )}
          </section>

          <section className="p-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Build Your Creator Business
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Join VCM OS to access premium creator tools, resources, and a community of ambitious creators.
              </p>
              <Link
                href="https://vcmos.io"
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors"
              >
                Open VCM OS
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          <div className="mt-12 text-center">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse All Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
