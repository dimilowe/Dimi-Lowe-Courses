import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, AdminSessionData } from "@/lib/admin-session";
import { 
  getCmsToolSlugs, 
  getCmsArticleSlugs, 
  getAllExpectedLinksFromRegistry 
} from "@/lib/seo/urlClassifier";
import { query } from "@/lib/db";

interface ExpectedLinksResult {
  url: string;
  expectedLinks: number | null;
  cluster: string | null;
  type: string;
  isLegacy: boolean;
}

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cmsToolSlugs = await getCmsToolSlugs();
    const registryExpected = getAllExpectedLinksFromRegistry();
    
    const toolUrlsResult = await query(
      `SELECT url FROM global_urls 
       WHERE url LIKE '/tools/%' 
       AND url NOT LIKE '/tools/all' 
       AND url NOT LIKE '/tools/clusters/%' 
       AND url NOT LIKE '%/embed' 
       AND url NOT LIKE '%/success'
       AND url NOT LIKE '%[slug]%'`
    );

    const legacyTools: string[] = [];
    for (const row of toolUrlsResult.rows) {
      const slug = (row.url as string).replace('/tools/', '');
      if (!cmsToolSlugs.has(slug) && !registryExpected[row.url as string]) {
        legacyTools.push(row.url as string);
      }
    }

    const expectedLinks: Record<string, number> = {};
    const urlDetails: ExpectedLinksResult[] = [];

    for (const [url, data] of Object.entries(registryExpected)) {
      if (data.expected !== null) {
        expectedLinks[url] = data.expected;
      }
      urlDetails.push({
        url,
        expectedLinks: data.expected,
        cluster: data.cluster,
        type: data.type,
        isLegacy: false,
      });
    }

    for (const legacyUrl of legacyTools) {
      urlDetails.push({
        url: legacyUrl,
        expectedLinks: null,
        cluster: null,
        type: 'legacy-tool',
        isLegacy: true,
      });
    }

    return NextResponse.json({ 
      expectedLinks, 
      legacyTools,
      urlDetails,
    });
  } catch (error) {
    console.error("Failed to calculate expected links:", error);
    return NextResponse.json({ error: "Failed to calculate expected links" }, { status: 500 });
  }
}
