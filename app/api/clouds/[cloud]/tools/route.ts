import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ENGINE_REGISTRY, type HeavyMode } from "@/engines";
import type { CloudId, ToolAccessTier } from "@/lib/types/cloudEntitlements";

function getEngineMetaByEngineType(engine: string | null): { heavyMode: HeavyMode; hasAi: boolean } {
  if (!engine) return { heavyMode: 'none', hasAi: false };
  
  const engineConfig = ENGINE_REGISTRY[engine as keyof typeof ENGINE_REGISTRY];
  if (engineConfig) {
    return {
      heavyMode: engineConfig.heavyMode ?? 'none',
      hasAi: engineConfig.hasAi ?? false,
    };
  }
  
  return { heavyMode: 'none', hasAi: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cloud: string }> }
) {
  const { cloud } = await params;
  
  const cloudSlug = cloud.replace(/-cloud$/, "").replace(/-/g, "_");
  
  try {
    const result = await query(
      `SELECT 
        co.slug, 
        co.type,
        co.cloud_tags,
        COALESCE(co.data->>'title', co.slug) as title,
        COALESCE(co.data->>'description', '') as description,
        t.featured,
        t.segment,
        t.engine,
        t.required_cloud,
        t.required_tier
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
        const engineMeta = getEngineMetaByEngineType(row.engine);
        return {
          slug: row.slug,
          title: row.title || row.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: row.description,
          featured: row.featured || false,
          segment: row.segment,
          heavyMode: engineMeta.heavyMode,
          hasAi: engineMeta.hasAi,
          requiredCloud: row.required_cloud as CloudId | null,
          requiredTier: row.required_tier as ToolAccessTier | null,
        };
      })
    });
  } catch (error) {
    console.error("Failed to fetch cloud tools:", error);
    return NextResponse.json({ tools: [], error: "Failed to fetch tools" }, { status: 500 });
  }
}
