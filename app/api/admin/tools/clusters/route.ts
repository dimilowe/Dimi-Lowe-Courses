import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { CLUSTER_REGISTRY } from "@/data/clusterRegistry";
import { getAllToolSkinsForEngine, ENGINE_KEYWORD_MATRICES } from "@/data/engineKeywordMatrix";
import type { EngineType } from "@/engines";
import { toolsRegistry } from "@/data/toolsRegistry";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const indexStatusResult = await query(
    `SELECT url, is_indexed FROM global_urls WHERE url LIKE '/tools/%'`
  );
  const indexStatusMap = new Map<string, boolean>();
  for (const row of indexStatusResult.rows) {
    const slug = (row.url as string).replace('/tools/', '');
    indexStatusMap.set(slug, row.is_indexed as boolean);
  }

  const legacyBySlug = new Map<string, typeof toolsRegistry[0]>();
  for (const tool of toolsRegistry) {
    legacyBySlug.set(tool.slug, tool);
  }

  const allMatrixSkins = new Map<string, boolean>();
  const engineTypes = Object.keys(ENGINE_KEYWORD_MATRICES) as EngineType[];
  for (const engineType of engineTypes) {
    const skins = getAllToolSkinsForEngine(engineType);
    for (const skin of skins) {
      allMatrixSkins.set(skin.slug, indexStatusMap.get(skin.slug) ?? false);
    }
  }

  const clusters = Object.values(CLUSTER_REGISTRY).map((cluster) => {
    let toolCount = 0;
    let indexedCount = 0;

    for (const slug of cluster.toolSlugs) {
      const legacy = legacyBySlug.get(slug);
      const matrix = allMatrixSkins.has(slug);

      if (legacy || matrix) {
        toolCount++;
        const isIndexed = indexStatusMap.get(slug) ?? false;
        if (isIndexed) indexedCount++;
      }
    }

    return {
      id: cluster.id,
      pillarSlug: cluster.pillarSlug,
      pillarTitle: cluster.pillarTitle,
      engineId: cluster.engineId,
      toolCount,
      indexedCount,
      articleCount: cluster.articleSlugs.length,
    };
  });

  clusters.sort((a, b) => b.toolCount - a.toolCount);

  return NextResponse.json({ clusters });
}
