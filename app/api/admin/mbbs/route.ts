import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { query } from "@/lib/db";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { CLUSTER_REGISTRY } from "@/data/clusterRegistry";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSessionData>(cookieStore, sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(`
      SELECT 
        id::text as id,
        slug,
        COALESCE(data->>'title', data->'seo'->>'title', slug) as title,
        data->>'type' as mbb_type,
        cluster_slug,
        COALESCE((data->>'is_indexed')::boolean, false) as is_indexed,
        COALESCE(word_count, (data->>'word_count')::integer, 0) as word_count,
        created_at,
        updated_at,
        health
      FROM cms_objects
      WHERE type = 'mbb'
      ORDER BY created_at DESC
    `);

    const mbbs = result.rows.map(row => ({
      ...row,
      cluster_title: row.cluster_slug ? CLUSTER_REGISTRY[row.cluster_slug as string]?.pillarTitle || row.cluster_slug : null,
      health: row.health || (row.word_count >= 1200 ? 'strong' : row.word_count >= 600 ? 'ok' : 'thin')
    }));

    return NextResponse.json({ mbbs });
  } catch (error) {
    console.error("Failed to fetch MBBs:", error);
    return NextResponse.json({ error: "Failed to fetch MBBs" }, { status: 500 });
  }
}
