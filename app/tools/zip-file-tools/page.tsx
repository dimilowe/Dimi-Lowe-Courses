import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { FileArchive, CheckCircle, ArrowRight, Shield, Zap, Download, Wrench, FolderOpen } from "lucide-react";
import { query } from "@/lib/db";
import { getRelatedPillars } from "@/lib/cms/getPillarBySlug";
import { recordCacheMiss, recordCacheRequest } from "@/lib/ops/metrics";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free ZIP File Tools - Compress, Create & Protect Files Online",
  description: "Free online ZIP file tools to compress, create, and password-protect ZIP archives. No software download required. Works on all devices.",
  keywords: "zip file, compress files, create zip, password protect zip, file compression, zip archive, online zip tool",
  alternates: {
    canonical: "/tools/zip-file-tools",
  },
};

const PILLAR_SLUG = "zip-file-tools";

const fallbackTools = [
  { slug: "zip-file-compression", name: "ZIP File Compression", description: "Compress files into smaller ZIP archives" },
  { slug: "zip-file-folder", name: "ZIP Folder", description: "Archive entire folders into a single ZIP" },
  { slug: "zip-file-in-linux", name: "ZIP File in Linux", description: "Linux-compatible ZIP file creation" },
  { slug: "zip-file-linux", name: "ZIP File Linux", description: "Create ZIP files for Linux systems" },
  { slug: "zip-file-make", name: "Make ZIP File", description: "Create ZIP archives from any files" },
  { slug: "zip-file-on-linux", name: "ZIP File on Linux", description: "Online ZIP tool for Linux users" },
  { slug: "zip-file-password-protection", name: "Password Protect ZIP", description: "Add password protection to ZIP files" },
];

const proTips = [
  "Compress before emailing to avoid attachment limits",
  "Password-protect ZIPs containing sensitive documents",
  "Group related files into folders before zipping",
  "Use maximum compression for archives you'll store long-term",
  "Keep original files until you verify the ZIP works"
];

const faqs = [
  {
    question: "Is it safe to use online ZIP tools?",
    answer: "Yes! Our tools process files securely in your browser or on encrypted servers. We don't store your files after processing, and all transfers use HTTPS encryption."
  },
  {
    question: "Is there a file size limit?",
    answer: "Most of our ZIP tools support files up to 100MB for free. For larger files, you may need to split them into smaller archives or use desktop software."
  },
  {
    question: "Do you store my files?",
    answer: "No. Your files are processed temporarily and automatically deleted after you download your ZIP. We never store or access your personal files."
  },
  {
    question: "Are these tools really free?",
    answer: "Yes! All our ZIP file tools are 100% free with no watermarks, no signup required, and no hidden fees. We support ourselves through non-intrusive advertising."
  },
  {
    question: "What file types can I ZIP?",
    answer: "You can ZIP any file type: documents, images, videos, code, spreadsheets, and more. ZIP compression works on all common file formats."
  }
];

async function getLinkedTools() {
  try {
    recordCacheRequest("zip-pillar-linked-tools");
    return await getLinkedToolsCached(PILLAR_SLUG);
  } catch (error) {
    console.error("Error fetching pillar tools:", error);
    return fallbackTools;
  }
}

const getLinkedToolsCached = unstable_cache(
  async (pillarSlug: string) => {
    recordCacheMiss("zip-pillar-linked-tools");
    const [toolsResult, cmsResult] = await Promise.all([
      query(
        `SELECT slug, name, description 
         FROM tools 
         WHERE pillar_slug = $1
         ORDER BY priority ASC, name ASC`,
        [pillarSlug]
      ),
      query(
        `SELECT slug, data->>'title' as name, data->>'description' as description
         FROM cms_objects 
         WHERE type = 'tool' AND pillar_slug = $1
         ORDER BY slug ASC`,
        [pillarSlug]
      ),
    ]);

    const allTools = [
      ...toolsResult.rows.map((row: { slug: string; name: string; description: string | null }) => ({
        slug: row.slug,
        name: row.name,
        description: row.description || "",
      })),
      ...cmsResult.rows.map((row: { slug: string; name: string; description: string | null }) => ({
        slug: row.slug,
        name: row.name || row.slug,
        description: row.description || "",
      })),
    ];

    return allTools.length > 0 ? allTools : fallbackTools;
  },
  ["zip-pillar-linked-tools-v1"],
  { revalidate }
);

export default async function ZipFileToolsPage() {
  const [tools, relatedPillars] = await Promise.all([
    getLinkedTools(),
    getRelatedPillars(PILLAR_SLUG)
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 mb-6"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Tools Explorer
        </Link>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full uppercase tracking-wide mb-3">
            Tool Collection
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Free ZIP File Tools: Compress, Create & Protect
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Online tools to create, compress, and password-protect ZIP files without software.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Wrench className="w-4 h-4" />
            <span>Table of Contents</span>
          </div>
          <Link href="#tools" className="flex items-center gap-2 text-gray-700 hover:text-orange-500">
            <Wrench className="w-4 h-4 text-orange-500" />
            Tools in This Collection
          </Link>
        </div>

        <section id="tools" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" />
            Tools in This Collection ({tools.length})
          </h2>
          
          {tools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                    <FileArchive className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500">No tools have been assigned to this collection yet.</p>
            </div>
          )}
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Secure & Private</h3>
            <p className="text-sm text-gray-600">Files are processed securely and never stored</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Fast Processing</h3>
            <p className="text-sm text-gray-600">Create and compress ZIPs in seconds</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No Download Required</h3>
            <p className="text-sm text-gray-600">Works entirely in your browser</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pro Tips for ZIP Files</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {proTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Build Your Creator Business</h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Join VCM OS to access premium creator tools, resources, and a community of ambitious creators.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
          >
            Open VCM OS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {relatedPillars.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-500" />
              Related Collections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedPillars.map((pillar) => (
                <Link
                  key={pillar.slug}
                  href={`/tools/${pillar.slug}`}
                  className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {pillar.description}
                  </p>
                  <span className="text-sm text-orange-500 font-medium flex items-center gap-1">
                    View tools <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "ZIP File Tools",
              description: "Free online tools to compress, create, and protect ZIP files",
              numberOfItems: tools.length,
              itemListElement: tools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "WebApplication",
                  name: tool.name,
                  description: tool.description,
                  url: `https://vcmsuite.com/tools/${tool.slug}`,
                  applicationCategory: "UtilitiesApplication",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD"
                  }
                }
              }))
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer
                }
              }))
            })
          }}
        />
      </div>
    </main>
  );
}
