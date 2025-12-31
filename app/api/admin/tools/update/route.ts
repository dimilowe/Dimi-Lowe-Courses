import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { canIndexTool } from "@/lib/toolInterlinking";
import { query } from "@/lib/db";
import { updateTool } from "@/lib/toolsRepo";

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, field, value } = body;

    if (!slug || !field) {
      return NextResponse.json({ error: "Missing slug or field" }, { status: 400 });
    }

    const allowedFields = ["isIndexed", "isFeatured", "inDirectory", "segment", "clusterSlug", "cloudTags", "requiredClouds", "requiredTier"];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    if (field === "isIndexed" && value === true) {
      const canIndex = canIndexTool(slug);
      if (!canIndex.allowed) {
        return NextResponse.json({ 
          error: canIndex.reason || "Cannot index this tool yet",
          blocked: true 
        }, { status: 400 });
      }
    }

    if (field === "isIndexed") {
      const toolUrl = `/tools/${slug}`;
      const result = await query(
        `INSERT INTO global_urls (url, type, is_indexed, indexed_at)
         VALUES ($1, 'tool', $2, CASE WHEN $2 = true THEN NOW() ELSE NULL END)
         ON CONFLICT (url) DO UPDATE SET 
           is_indexed = $2, 
           indexed_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END`,
        [toolUrl, value]
      );
      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Failed to update indexing status" }, { status: 500 });
      }
    } else if (field === "cloudTags") {
      const tags = Array.isArray(value) ? value : [];
      const defaultData = JSON.stringify({ title: slug });
      await query(
        `INSERT INTO cms_objects (slug, type, cloud_tags, data, created_at, updated_at)
         VALUES ($2, 'tool', $1, $3::jsonb, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET cloud_tags = $1, updated_at = NOW()`,
        [tags, slug, defaultData]
      );
    } else if (field === "clusterSlug") {
      // Update pillar_slug in both tables - pillar_slug is the canonical source of truth for pillar membership
      // updateTool returns null if tool doesn't exist in tools table (CMS-only tools)
      const toolResult = await updateTool(slug, { pillarSlug: value });
      const toolsTableUpdated = toolResult !== null;
      
      // Update pillar_slug in cms_objects (this is the primary source for CMS tools)
      const cmsResult = await query(
        `UPDATE cms_objects SET pillar_slug = $1, updated_at = NOW() WHERE slug = $2 AND type = 'tool'`,
        [value || null, slug]
      );
      const cmsUpdated = (cmsResult.rowCount ?? 0) > 0;
      
      // If neither table was updated, the tool doesn't exist anywhere
      if (!toolsTableUpdated && !cmsUpdated) {
        return NextResponse.json({ error: "Tool not found" }, { status: 404 });
      }
    } else if (field === "requiredClouds") {
      const clouds = Array.isArray(value) ? value : [];
      await updateTool(slug, { requiredClouds: clouds });
    } else if (field === "requiredTier") {
      const tier = value || "free";
      await updateTool(slug, { requiredTier: tier });
    } else {
      const fieldMap: Record<string, string> = {
        isFeatured: "featured",
        inDirectory: "inDirectory",
        segment: "segment",
      };
      const updateKey = fieldMap[field] || field;
      await updateTool(slug, { [updateKey]: value });
    }

    return NextResponse.json({ success: true, slug, field, value });
  } catch (error) {
    console.error("Failed to update tool config:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
