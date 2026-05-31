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
      WITH combined_articles AS (
        SELECT 
          id::text as id,
          slug,
          title,
          excerpt,
          meta_description,
          cluster_slug,
          is_indexed,
          is_published,
          view_count,
          created_at,
          updated_at,
          COALESCE(array_length(regexp_split_to_array(COALESCE(content, ''), '\\s+'), 1), 0) as word_count,
          'cluster_articles' as source
        FROM cluster_articles
        
        UNION ALL
        
        SELECT 
          id::text as id,
          slug,
          COALESCE(data->>'title', data->'seo'->>'title', slug) as title,
          data->>'excerpt' as excerpt,
          data->'seo'->>'description' as meta_description,
          data->>'cluster_slug' as cluster_slug,
          COALESCE((data->>'is_indexed')::boolean, false) as is_indexed,
          true as is_published,
          0 as view_count,
          created_at,
          updated_at,
          COALESCE((data->>'word_count')::integer, word_count, 0) as word_count,
          'cms_objects' as source
        FROM cms_objects
        WHERE type = 'article'
      )
      SELECT 
        id,
        slug,
        title,
        excerpt,
        meta_description,
        cluster_slug,
        is_indexed,
        is_published,
        view_count,
        created_at,
        updated_at,
        word_count,
        source,
        CASE 
          WHEN word_count >= 1200 THEN 'strong'
          WHEN word_count >= 600 THEN 'ok'
          ELSE 'thin'
        END as health
      FROM combined_articles
      ORDER BY created_at DESC
    `);

    const articles = result.rows.map(row => ({
      ...row,
      cluster_title: row.cluster_slug ? CLUSTER_REGISTRY[row.cluster_slug as string]?.pillarTitle || row.cluster_slug : null
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
