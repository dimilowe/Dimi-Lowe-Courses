import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Ruler, Layers, Image as ImageIcon } from "lucide-react";
import { getImageSizeBankPages } from "@/lib/pseo/imageSizeBankRepo";

export const revalidate = 3600;

const HUB_PATH = "/tools/image-size-bank";

export const metadata: Metadata = {
  title: "Image Size Bank - Platform Dimensions Library | VCM Suite",
  description:
    "Browse platform image dimensions and aspect ratios for social channels, ads, and marketplaces. Jump directly to exact size pages and resize fast.",
  alternates: {
    canonical: HUB_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Image Size Bank - Platform Dimensions Library",
    description:
      "A searchable bank of exact image dimensions and aspect ratios with direct links to free resizing workflows.",
    url: HUB_PATH,
    type: "website",
  },
};

function templateLabel(templateSlug: string): string {
  if (templateSlug === "size") return "Size Queries";
  if (templateSlug === "dimensions") return "Dimensions Queries";
  if (templateSlug === "aspect-ratio") return "Aspect Ratio Queries";
  if (templateSlug === "resolution") return "Resolution Queries";
  if (templateSlug === "pixel-size") return "Pixel Size Queries";
  if (templateSlug === "recommended-size") return "Recommended Size Queries";
  if (templateSlug === "safe-area-size") return "Safe Area Queries";
  if (templateSlug === "image-specs") return "Image Specs Queries";
  if (templateSlug === "size-guide") return "Size Guide Queries";
  return "All Queries";
}

export default async function ImageSizeBankPage() {
  const pages = await getImageSizeBankPages({ indexedOnly: true });
  const groups = new Map<string, typeof pages>();
  for (const page of pages) {
    const group = groups.get(page.templateSlug) || [];
    group.push(page);
    groups.set(page.templateSlug, group);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            <Ruler className="h-4 w-4" />
            Programmatic Image Size Bank
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">Image Size Bank</h1>
          <p className="text-gray-600">
            Predictable, high-intent query pages grouped by phrase patterns. Start from this hub, then drill into exact platform
            size pages and open the free resizer workflow.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/social-media-image-sizes"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Open Resizer Tool
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
              <Layers className="h-4 w-4" />
              {pages.length} indexed pages
            </div>
          </div>
        </div>

        {groups.size === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
            No generated bank pages yet. Run <code className="rounded bg-gray-100 px-1 py-0.5">npm run pseo:image-size:generate</code>.
          </div>
        ) : (
          <div className="space-y-6">
            {[...groups.entries()].map(([templateSlug, items]) => (
              <section key={templateSlug} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">{templateLabel(templateSlug)}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((page) => {
                    const pixels = page.body.pixels || `${page.body.width || "?"}x${page.body.height || "?"}`;
                    return (
                      <Link
                        key={page.slug}
                        href={page.urlPath}
                        className="group rounded-xl border border-gray-200 p-4 transition hover:border-orange-300 hover:shadow-sm"
                      >
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                          <ImageIcon className="h-4 w-4" />
                          {page.body.platform || "Platform"} • {page.body.assetType || "Asset"}
                        </div>
                        <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-orange-600">{page.h1}</h3>
                        <p className="text-sm text-gray-600">{pixels} • {page.body.aspectRatio || "N/A"}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
