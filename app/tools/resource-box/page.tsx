import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Link2, Sparkles, Code, ExternalLink } from "lucide-react";
import { query } from "@/lib/db";
import { ResourceBoxForm } from "./ResourceBoxForm";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Creator Resource Box - Free Link Card Generator | VCM",
  description: "Create a beautiful resource box with up to 4 links. Get a unique URL and embed code to share anywhere. No signup required.",
  openGraph: {
    title: "Creator Resource Box - Free Link Card Generator",
    description: "Create a beautiful resource box with up to 4 links. Get a unique URL and embed code to share anywhere.",
  },
};

interface InternalResource {
  id: number;
  name: string;
  slug: string;
  url: string;
  category: string;
  short_tag: string | null;
  description: string | null;
}

async function getInternalResources(): Promise<InternalResource[]> {
  try {
    const result = await query(
      `SELECT id, name, slug, url, category, short_tag, description 
       FROM internal_resources 
       ORDER BY category, name`
    );
    return result.rows as unknown as InternalResource[];
  } catch {
    return [];
  }
}

export default async function ResourceBoxPage() {
  const resources = await getInternalResources();
  const tools = resources.filter(r => r.category === 'tool');
  const freebies = resources.filter(r => r.category === 'freebie');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Link2 className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Creator Resource Box
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a beautiful link card with up to 4 resources. Share it anywhere with a unique URL or embed it on your website.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No Signup</h3>
            <p className="text-sm text-gray-600">Create instantly without creating an account</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Embed Anywhere</h3>
            <p className="text-sm text-gray-600">Get an iframe code for any website</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Share Link</h3>
            <p className="text-sm text-gray-600">Get a unique URL to share anywhere</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create Your Resource Box</h2>
          <ResourceBoxForm tools={tools} freebies={freebies} />
        </div>

        <ExploreMoreTools currentTool="/tools/resource-box" />
      </div>
    </div>
  );
}
