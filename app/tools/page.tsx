import { Metadata } from "next";
import ToolsDirectoryClient from "./ToolsDirectoryClient";
import { getAllIndexedPillars } from "@/lib/cms/getPillarBySlug";
import { PillarCollections } from "@/components/tools/PillarCollections";
import { getToolsForDirectory, type DirectoryTool } from "@/lib/tools/getToolsForDirectory";

export const dynamic = "force-dynamic";

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
              A curated library of powerful utilities for creators, businesses, and everyday workflows.
            </p>
          </div>

          {pillars.length > 0 && (
            <PillarCollections pillars={pillars} />
          )}

          <ToolsDirectoryClient tools={tools} />
        </div>
      </div>
    </>
  );
}
