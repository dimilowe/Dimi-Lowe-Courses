import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { listTools, updateTool, ToolRecord } from "@/lib/toolsRepo";
import { getPreflightStatus } from "@/lib/toolInterlinking";
import { query } from "@/lib/db";

interface CmsToolData {
  title: string;
  description?: string;
  engine_config?: {
    engine?: string;
    preset?: string;
    mode?: string;
  };
  isIndexed?: boolean;
  interlink_parent?: string;
  seo?: {
    keywords?: string[];
  };
}

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbTools = await listTools();
    
    // Also fetch tools from cms_objects, joining with tools table for entitlement data
    // Use a try-catch to handle missing 'featured' column in production
    let cmsResult;
    let hasFeaturedColumn = true;
    try {
      cmsResult = await query(
        `SELECT co.slug, co.cluster_slug, co.pillar_slug, COALESCE(co.cloud_tags, '{}') AS cloud_tags, co.data, co.featured,
                COALESCE(t.required_clouds, '{}') AS required_clouds, COALESCE(t.required_tier, 'free') AS required_tier
         FROM cms_objects co
         LEFT JOIN tools t ON t.slug = co.slug
         WHERE co.type = 'tool'`
      );
    } catch (err) {
      // Fallback query without featured column if it doesn't exist
      hasFeaturedColumn = false;
      cmsResult = await query(
        `SELECT co.slug, co.cluster_slug, co.pillar_slug, COALESCE(co.cloud_tags, '{}') AS cloud_tags, co.data,
                COALESCE(t.required_clouds, '{}') AS required_clouds, COALESCE(t.required_tier, 'free') AS required_tier
         FROM cms_objects co
         LEFT JOIN tools t ON t.slug = co.slug
         WHERE co.type = 'tool'`
      );
    }
    const cmsToolSlugs = new Set(cmsResult.rows.map((r: { slug: string }) => r.slug));
    
    // Combine all tool slugs for index status lookup
    const allToolSlugs = [
      ...dbTools.map((t: ToolRecord) => `/tools/${t.slug}`),
      ...cmsResult.rows.map((r: { slug: string }) => `/tools/${r.slug}`)
    ];
    
    const indexStatusResult = await query(
      `SELECT url, is_indexed FROM global_urls WHERE url = ANY($1)`,
      [allToolSlugs]
    );
    const indexStatusMap = new Map<string, boolean>();
    for (const row of indexStatusResult.rows) {
      indexStatusMap.set(row.url, row.is_indexed);
    }
    
    // Map legacy tools (exclude any that exist in cms_objects)
    const legacyTools = dbTools
      .filter((tool: ToolRecord) => !cmsToolSlugs.has(tool.slug))
      .map((tool: ToolRecord) => {
        const categoryToSegment: Record<string, string> = {
          creator: "creator",
          social: "social",
          image: "utility",
          video: "utility",
          writing: "utility",
          business: "mbb",
          file: "utility",
          calculators: "mbb",
          utilities: "utility",
          ai: "creator",
        };
        
        const segment = tool.segment || (tool.category ? categoryToSegment[tool.category] : null) || "utility";
        const toolUrl = `/tools/${tool.slug}`;
        const isIndexed = indexStatusMap.get(toolUrl) ?? false;
        
        return {
          slug: tool.slug,
          name: tool.name,
          engineType: tool.engine || "legacy",
          segment,
          clusterSlug: tool.pillarSlug || tool.cluster || "",
          isIndexed,
          isFeatured: tool.featured,
          inDirectory: tool.inDirectory,
          priority: tool.priority?.toString() || "50",
          h1: tool.name,
          primaryKeyword: tool.primaryKeyword || "",
          linkStatus: getPreflightStatus(tool.slug),
          status: tool.status,
          source: tool.source,
          category: tool.category,
          requiredClouds: tool.requiredClouds || [],
          requiredTier: tool.requiredTier || "free",
        };
      });
    
    // Map CMS tools
    const cmsTools = cmsResult.rows.map((row: { slug: string; cluster_slug: string | null; pillar_slug: string | null; cloud_tags: string[]; data: CmsToolData; featured?: boolean; required_clouds: string[]; required_tier: string }) => {
      const data = row.data;
      const toolUrl = `/tools/${row.slug}`;
      const isIndexed = indexStatusMap.get(toolUrl) ?? data.isIndexed ?? false;
      
      return {
        slug: row.slug,
        name: data.title || row.slug,
        engineType: data.engine_config?.engine || "unknown",
        segment: "utility",
        clusterSlug: row.pillar_slug || row.cluster_slug || data.interlink_parent || "",
        cloudTags: row.cloud_tags || [],
        isIndexed,
        isFeatured: hasFeaturedColumn ? (row.featured || false) : false,
        inDirectory: true,
        priority: "50",
        h1: data.title || row.slug,
        primaryKeyword: data.seo?.keywords?.[0] || "",
        linkStatus: getPreflightStatus(row.slug),
        status: "active",
        source: "cms",
        category: "file",
        requiredClouds: row.required_clouds || [],
        requiredTier: row.required_tier || "free",
      };
    });
    
    const tools = [...legacyTools, ...cmsTools];

    tools.sort((a, b) => {
      const segmentOrder: Record<string, number> = {
        creator: 0,
        social: 1,
        utility: 2,
        finance: 3,
        health: 4,
        mbb: 5,
        secondary: 6,
      };
      const aOrder = segmentOrder[a.segment] ?? 7;
      const bOrder = segmentOrder[b.segment] ?? 7;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, isIndexed, isFeatured, inDirectory, status } = body;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (isIndexed !== undefined) {
      const toolUrl = `/tools/${slug}`;
      const result = await query(
        `INSERT INTO global_urls (url, type, is_indexed, indexed_at)
         VALUES ($1, 'tool', $2, CASE WHEN $2 = true THEN NOW() ELSE NULL END)
         ON CONFLICT (url) DO UPDATE SET 
           is_indexed = $2, 
           indexed_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END`,
        [toolUrl, isIndexed]
      );
      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Failed to update indexing status" }, { status: 500 });
      }
    }

    const updates: Record<string, any> = {};
    if (isFeatured !== undefined) updates.featured = isFeatured;
    if (inDirectory !== undefined) updates.inDirectory = inDirectory;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      // Try to update in legacy tools first
      const updated = await updateTool(slug, updates);
      
      // Also update cms_objects if featured is being changed
      if (isFeatured !== undefined) {
        try {
          await query(
            `UPDATE cms_objects SET featured = $1 WHERE slug = $2 AND type = 'tool'`,
            [isFeatured, slug]
          );
        } catch (err) {
          // Featured column doesn't exist - silently ignore
          console.log("Featured column not available in cms_objects");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tool:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tool" },
      { status: 500 }
    );
  }
}
