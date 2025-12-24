import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT slug, name, icon, priority
       FROM tools
       WHERE in_directory = true
       ORDER BY priority DESC NULLS LAST, name ASC`
    );

    const tools = result.rows.map((row: { slug: string; name: string; icon: string | null; priority: number | null }) => ({
      slug: row.slug,
      name: row.name || row.slug,
      icon: row.icon || "Wrench",
    }));

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error fetching tools for search:", error);
    return NextResponse.json({ tools: [] });
  }
}
