import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { toolsRegistry } from "@/data/toolsRegistry";
import type { CloudId, EntitlementTier } from "@/lib/types/cloudEntitlements";

const CLOUD_SLUG_TO_ID: Record<string, CloudId> = {
  creation: 'creation',
  video: 'video',
  writing_seo: 'writing',
  writing: 'writing',
  file_data: 'file',
  file: 'file',
  monetization: 'monetization',
  intelligence: 'intelligence',
  music_performance: 'music',
  music: 'music',
  growth_distribution: 'growth',
  growth: 'growth',
  shopping: 'shopping',
  advertising: 'advertising',
  gaming: 'gaming',
  ecommerce: 'ecommerce',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cloud: string }> }
) {
  const { cloud } = await params;
  
  const cloudSlug = cloud.replace(/-cloud$/, "").replace(/-/g, "_");
  const targetCloudId = CLOUD_SLUG_TO_ID[cloudSlug] || cloudSlug as CloudId;
  
  try {
    const result = await query(
      `SELECT 
        co.slug, 
        co.type,
        co.cloud_tags,
        COALESCE(co.data->>'title', co.slug) as title,
        COALESCE(co.data->>'description', '') as description,
        t.featured,
        t.segment
      FROM cms_objects co
      LEFT JOIN tools t ON t.slug = co.slug
      WHERE $1 = ANY(co.cloud_tags)
        AND co.type = 'tool'
      ORDER BY t.featured DESC NULLS LAST, co.slug ASC
      LIMIT 50`,
      [cloudSlug]
    );
    
    return NextResponse.json({ 
      tools: result.rows.map(row => {
        const registryTool = toolsRegistry.find(t => t.slug === row.slug);
        
        return {
          slug: row.slug,
          title: row.title || row.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: row.description,
          featured: row.featured || false,
          segment: row.segment,
          cloud_ids: registryTool?.cloud_ids || [targetCloudId],
          required_tier: registryTool?.required_tier || 'free' as EntitlementTier,
        };
      })
    });
  } catch (error) {
    console.error("Failed to fetch cloud tools:", error);
    return NextResponse.json({ tools: [], error: "Failed to fetch tools" }, { status: 500 });
  }
}
