import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { query } from "@/lib/db";
import { ArrowLeft, Check, Copy, Link2, Code, Plus } from "lucide-react";
import { ResourceBoxCard } from "../ResourceBoxCard";
import { CopyButton } from "./CopyButton";

export const metadata: Metadata = {
  title: "Resource Box Created! | VCM",
  description: "Your resource box is ready. Copy the link or embed code.",
};

interface BoxData {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  accent_color: string;
}

interface BoxItem {
  id: number;
  label: string;
  description: string | null;
  item_type: string;
  external_url: string | null;
  internal_resource_id: number | null;
  position: number;
  resource_name: string | null;
  resource_url: string | null;
  resource_short_tag: string | null;
}

async function getBox(slug: string): Promise<{ box: BoxData; items: BoxItem[] } | null> {
  try {
    const boxResult = await query(
      `SELECT id, slug, title, subtitle, accent_color FROM resource_boxes WHERE slug = $1`,
      [slug]
    );

    if (boxResult.rows.length === 0) return null;

    const box = boxResult.rows[0] as unknown as BoxData;

    const itemsResult = await query(
      `SELECT 
        bi.id, bi.label, bi.description, bi.item_type, bi.external_url, 
        bi.internal_resource_id, bi.position,
        ir.name as resource_name, ir.url as resource_url, ir.short_tag as resource_short_tag
       FROM box_items bi
       LEFT JOIN internal_resources ir ON bi.internal_resource_id = ir.id
       WHERE bi.box_id = $1
       ORDER BY bi.position`,
      [box.id]
    );

    return { box, items: itemsResult.rows as unknown as BoxItem[] };
  } catch {
    return null;
  }
}

export default async function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBox(slug);

  if (!data) {
    notFound();
  }

  const baseUrl = process.env.SITE_URL || "https://vcmsuite.com";
  const boxUrl = `${baseUrl}/tools/resource-box/${data.box.slug}`;
  const embedUrl = `${baseUrl}/tools/resource-box/${data.box.slug}/embed`;
  const embedCode = `<iframe src="${embedUrl}" style="border:0;width:100%;max-width:420px;height:320px;overflow:hidden;border-radius:16px;" loading="lazy"></iframe>`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/tools/resource-box" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Generator
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Resource Box is Ready!
          </h1>
          <p className="text-lg text-gray-600">
            Copy the link or embed code below to share your box.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-orange-600" />
              Preview
            </h2>
            <div className="flex justify-center">
              <ResourceBoxCard box={data.box} items={data.items} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-orange-600" />
                Share Link
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Copy this URL to share your resource box anywhere.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={boxUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
                />
                <CopyButton text={boxUrl} label="Copy Link" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-600" />
                Embed Code
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Paste this code into any website to embed your resource box.
              </p>
              <div className="relative">
                <textarea
                  value={embedCode}
                  readOnly
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 resize-none"
                />
                <div className="mt-2">
                  <CopyButton text={embedCode} label="Copy Embed Code" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link 
                href={boxUrl}
                target="_blank"
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-center py-3 rounded-lg font-medium transition-colors"
              >
                View Live Box
              </Link>
              <Link 
                href="/tools/resource-box"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Another
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
