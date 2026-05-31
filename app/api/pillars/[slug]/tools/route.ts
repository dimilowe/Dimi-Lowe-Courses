import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const result = await query(
      `SELECT slug, name, description 
       FROM tools 
       WHERE pillar_slug = $1 AND is_indexed = true
       ORDER BY priority ASC, name ASC`,
      [slug]
    );

    const tools = (result.rows as { slug: string; name: string; description: string | null }[]).map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description || "",
    }));

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error fetching pillar tools:", error);
    return NextResponse.json({ tools: [] });
  }
}
