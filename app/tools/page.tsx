import { Metadata } from "next";
import Link from "next/link";
import ToolsDirectoryClient from "./ToolsDirectoryClient";
import { getAllIndexedPillars } from "@/lib/cms/getPillarBySlug";
import { PillarCollections } from "@/components/tools/PillarCollections";
import { getToolsForDirectory, type DirectoryTool } from "@/lib/tools/getToolsForDirectory";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "VCM Tools Explorer — 50+ Free Creator Tools",
  description: "A curated library of powerful utilities for creators, businesses, and everyday workflows. Image resizers, AI tools, calculators, and more — all 100% free.",
  keywords: "free tools, creator tools, image resizer, youtube thumbnail maker, instagram resizer, calorie calculator, AI tools, pdf editor, gif compressor",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "VCM Tools Explorer — 50+ Free Creator Tools",
    description: "A curated library of powerful utilities for creators, businesses, and everyday workflows.",
    type: "website",
    url: "/tools",
  }
};

function generateSchemaMarkup(tools: DirectoryTool[]) {
  const itemListElements = tools.map((tool, index) => ({
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
  }));

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://vcmsuite.com/tools",
        "url": "https://vcmsuite.com/tools",
        "name": "VCM Tools Explorer — Free Creator Tools",
        "description": "A curated library of powerful utilities for creators, businesses, and everyday workflows.",
        "isPartOf": {
          "@type": "WebSite",
          "name": "VCM Suite",
          "url": "https://vcmsuite.com"
        }
      },
      {
        "@type": "ItemList",
        "name": "VCM Suite Tools Directory",
        "description": "Complete list of free creator tools and utilities",
        "numberOfItems": tools.length,
        "itemListElement": itemListElements
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Tools Directory",
        "url": "https://vcmsuite.com/tools",
        "description": "Browse all VCM Suite tools"
      }
    ]
  };

  return schema;
}

export default async function ToolsPage() {
  const tools = await getToolsForDirectory();
  const schema = generateSchemaMarkup(tools);
  const toolCount = tools.length;
  const pillars = await getAllIndexedPillars();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              VCM Tools Explorer
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A curated library of {toolCount}+ powerful utilities for creators, businesses, and everyday workflows.
            </p>
          </div>

          <section id="tool-banks" className="mb-8 scroll-mt-24">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Tool Banks</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">Image Size Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Predictable queries like "Instagram Story size" and "YouTube Thumbnail dimensions" from one indexed hub.
                </p>
                <Link
                  href="/tools/image-size-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Open Image Size Bank
                </Link>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">File Convert Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  High-intent conversion pages like "convert WEBP to JPG", "HEIC to JPG converter", and similar queries.
                </p>
                <Link
                  href="/tools/file-convert-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Open File Convert Bank
                </Link>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">Unit Convert Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Predictable unit conversion intents like "cm to inches", "kg to lbs", and "Celsius to Fahrenheit".
                </p>
                <Link
                  href="/tools/unit-convert-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Open Unit Convert Bank
                </Link>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">PDF Task Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Workflow intents like "merge PDF files", "split PDF pages", and "how to edit PDF online".
                </p>
                <Link
                  href="/tools/pdf-task-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Open PDF Task Bank
                </Link>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">Calculator Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Calculator-intent pages across health, finance, logistics, and business planning.
                </p>
                <Link
                  href="/tools/calculator-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Open Calculator Bank
                </Link>
              </div>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">Image Format Convert Phrase Bank</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Format-specific image queries like "PNG to WEBP", "JPG to PNG", and "how to convert HEIC to JPG".
                </p>
                <Link
                  href="/tools/image-format-convert-bank"
                  className="mt-3 inline-flex items-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Open Image Format Convert Bank
                </Link>
              </div>
            </div>
          </section>

          {pillars.length > 0 && (
            <PillarCollections pillars={pillars} />
          )}

          <ToolsDirectoryClient tools={tools} />
        </div>
      </div>
    </>
  );
}
