import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const pillarResult = await query(
      `SELECT id, slug, data FROM cms_objects WHERE type = 'pillar' AND slug = $1`,
      [slug]
    );

    if (pillarResult.rows.length === 0) {
      return NextResponse.json({ error: "Pillar not found" }, { status: 404 });
    }

    const pillarRow = pillarResult.rows[0] as { id: unknown; slug: unknown; data: Record<string, string> | null };
    const pillarData = pillarRow.data || {};

    const toolsResult = await query(
      `WITH merged AS (
        SELECT
          slug,
          COALESCE(data->>'title', data->'seo'->>'title', slug) as name,
          COALESCE(data->>'description', data->'seo'->>'description', '') as description,
          pillar_slug,
          1 AS source_priority,
          0 AS display_priority
        FROM cms_objects
        WHERE type = 'tool' AND pillar_slug = $1

        UNION ALL

        SELECT
          slug,
          name,
          description,
          pillar_slug,
          2 AS source_priority,
          COALESCE(priority, 999) AS display_priority
        FROM tools
        WHERE pillar_slug = $1
      )
      SELECT DISTINCT ON (slug) slug, name, description, pillar_slug, source_priority, display_priority
      FROM merged
      ORDER BY slug, source_priority, display_priority, name`,
      [slug]
    );

    const tools = (toolsResult.rows as { slug: string; name: string; description: string | null; display_priority: number }[])
      .sort((a, b) => {
        if (a.display_priority !== b.display_priority) return a.display_priority - b.display_priority;
        return a.name.localeCompare(b.name);
      })
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description || "",
      }));

    return NextResponse.json({
      pillar: {
        id: pillarRow.id,
        slug: pillarRow.slug,
        title: pillarData.title || slug,
        description: pillarData.description || "",
        content: pillarData.content || "",
      },
      tools,
    });
  } catch (error) {
    console.error("Error fetching pillar:", error);
    return NextResponse.json({ error: "Failed to fetch pillar" }, { status: 500 });
  }
}
