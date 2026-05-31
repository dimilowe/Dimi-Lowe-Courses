import { notFound } from "next/navigation";
import { Metadata } from "next";
import { query } from "@/lib/db";
import { ResourceBoxCard } from "../ResourceBoxCard";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBox(slug);

  if (!data) {
    return { title: "Resource Box" };
  }

  return {
    title: data.box.title,
    description: data.box.subtitle || `A curated collection of ${data.items.length} resources.`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBox(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex justify-center">
      <ResourceBoxCard box={data.box} items={data.items} compact />
    </div>
  );
}
