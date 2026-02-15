import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CATEGORY_INFO } from "@/data/toolsRegistry";
import { getToolsForDirectory as getToolsFromDB } from "@/lib/tools/getToolsForDirectory";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "All Tools A-Z — VCM Suite Tools Directory",
  description: "Browse the complete list of 100+ free online tools. Alphabetically sorted for easy discovery. Find any tool by name.",
  robots: "index, follow",
  alternates: {
    canonical: "/tools/all",
  },
};

interface ToolForDirectory {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryLabel: string;
}

async function getToolsForDirectory(): Promise<ToolForDirectory[]> {
  const dbTools = await getToolsFromDB();
  
  const toolsFormatted: ToolForDirectory[] = dbTools.map(tool => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    categoryLabel: CATEGORY_INFO[tool.category]?.label || 'Tools',
  }));
  
  toolsFormatted.sort((a, b) => a.name.localeCompare(b.name));
  
  return toolsFormatted;
}

function generateSchemaMarkup(tools: ToolForDirectory[]) {
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

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Complete VCM Suite Tools List (A-Z)",
    "description": "Alphabetically sorted list of all free creator tools",
    "numberOfItems": tools.length,
    "itemListElement": itemListElements
  };
}

export default async function AllToolsPage() {
  const tools = await getToolsForDirectory();
  const schema = generateSchemaMarkup(tools);
  
  const groupedByLetter: Record<string, ToolForDirectory[]> = {};
  tools.forEach(tool => {
    const letter = tool.name[0].toUpperCase();
    if (!groupedByLetter[letter]) {
      groupedByLetter[letter] = [];
    }
    groupedByLetter[letter].push(tool);
  });
  
  const letters = Object.keys(groupedByLetter).sort();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tools Explorer
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              All Tools A-Z
            </h1>
            <p className="text-gray-600">
              Complete alphabetical list of {tools.length} free tools
            </p>
          </div>
          
          <div className="mb-8 flex flex-wrap gap-2">
            {letters.map(letter => (
              <a
                key={letter}
                href={`#${letter}`}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600 font-medium text-sm transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
          
          <div className="space-y-10">
            {letters.map(letter => (
              <section key={letter} id={letter}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center">
                    {letter}
                  </span>
                  <span className="text-sm text-gray-400 font-normal">
                    {groupedByLetter[letter].length} {groupedByLetter[letter].length === 1 ? 'tool' : 'tools'}
                  </span>
                </h2>
                <div className="space-y-2">
                  {groupedByLetter[letter].map(tool => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all group"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded">
                          {tool.categoryLabel}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
          
          <div className="mt-16 text-center border-t pt-12">
            <Link 
              href="/tools"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tools Explorer
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
