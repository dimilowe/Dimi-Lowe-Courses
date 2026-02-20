import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { query } from "@/lib/db";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";

interface CMSObject {
  type: string;
  slug: string;
  title?: string;
  cluster_slug?: string;
  interlink_parent?: string;
  engine_config?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  body?: Array<{ type: string; content?: string }>;
  faq?: Array<{ question: string; answer: string }>;
  content_guide?: Record<string, unknown>;
  pro_tips?: string[];
  [key: string]: unknown;
}

interface ImportResult {
  slug: string;
  type: string;
  status: "created" | "updated" | "error";
  health: "thin" | "ok" | "strong";
  word_count: number;
  error?: string;
}

function calculateWordCount(obj: CMSObject): number {
  let text = "";

  // Title
  if (obj.title) text += obj.title + " ";

  // SEO fields
  if (obj.seo) {
    if (typeof obj.seo.title === "string") text += obj.seo.title + " ";
    if (typeof obj.seo.description === "string") text += obj.seo.description + " ";
  }

  // Body sections
  if (Array.isArray(obj.body)) {
    for (const block of obj.body) {
      if (typeof block.content === "string") text += block.content + " ";
      if (typeof block === "string") text += block + " ";
    }
  }

  // FAQ
  if (Array.isArray(obj.faq)) {
    for (const item of obj.faq) {
      if (item.question) text += item.question + " ";
      if (item.answer) text += item.answer + " ";
    }
  }

  // Content guide
  if (obj.content_guide) {
    const guide = obj.content_guide;
    if (typeof guide.intro === "string") text += guide.intro + " ";
    if (typeof guide.main === "string") text += guide.main + " ";
    if (Array.isArray(guide.sections)) {
      for (const section of guide.sections) {
        if (typeof section === "string") text += section + " ";
        if (typeof section?.content === "string") text += section.content + " ";
      }
    }
  }

  // Pro tips
  if (Array.isArray(obj.pro_tips)) {
    for (const tip of obj.pro_tips) {
      if (typeof tip === "string") text += tip + " ";
    }
  }

  // Count words
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateHealth(obj: CMSObject, wordCount: number): "thin" | "ok" | "strong" {
  const hasEngine = obj.type === "tool" ? !!obj.engine_config : true;
  const hasFaq = Array.isArray(obj.faq) && obj.faq.length > 0;
  const hasProTips = Array.isArray(obj.pro_tips) && obj.pro_tips.length > 0;
  const hasContentGuide = !!obj.content_guide;

  if (wordCount < 600 || !hasEngine) {
    return "thin";
  }

  if (wordCount >= 1200 && hasFaq && (hasProTips || hasContentGuide)) {
    return "strong";
  }

  return "ok";
}

function validateCMSObject(obj: unknown): { valid: boolean; error?: string; object?: CMSObject } {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, error: "Not a valid object" };
  }

  const cmsObj = obj as CMSObject;

  if (!cmsObj.type || typeof cmsObj.type !== "string") {
    return { valid: false, error: "Missing or invalid 'type' field" };
  }

  if (!cmsObj.slug || typeof cmsObj.slug !== "string") {
    return { valid: false, error: "Missing or invalid 'slug' field" };
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(cmsObj.slug)) {
    return { valid: false, error: "Slug must be lowercase alphanumeric with hyphens only" };
  }

  // Tools must have engine_config
  if (cmsObj.type === "tool" && !cmsObj.engine_config) {
    return { valid: false, error: "Tools require 'engine_config' field" };
  }

  return { valid: true, object: cmsObj };
}

function getPathForType(type: string, slug: string): string {
  switch (type) {
    case "tool":
      return `/tools/${slug}`;
    case "article":
      return `/articles/${slug}`;
    case "mbb":
      return `/mbb/${slug}`;
    case "product":
      return `/products/${slug}`;
    case "pillar":
    case "cluster":
      return `/tools/clusters/${slug}`;
    default:
      return `/${type}/${slug}`;
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSessionData>(cookieStore, sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Normalize to array
    const objects: unknown[] = Array.isArray(body) ? body : [body];

    if (objects.length === 0) {
      return NextResponse.json({ error: "No objects provided" }, { status: 400 });
    }

    if (objects.length > 100) {
      return NextResponse.json({ error: "Maximum 100 objects per import" }, { status: 400 });
    }

    const results: ImportResult[] = [];

    for (const rawObj of objects) {
      const validation = validateCMSObject(rawObj);

      if (!validation.valid || !validation.object) {
        results.push({
          slug: (rawObj as { slug?: string })?.slug || "unknown",
          type: (rawObj as { type?: string })?.type || "unknown",
          status: "error",
          health: "thin",
          word_count: 0,
          error: validation.error,
        });
        continue;
      }

      const obj = validation.object;
      const wordCount = calculateWordCount(obj);
      const health = calculateHealth(obj, wordCount);
      const clusterSlug = obj.cluster_slug || obj.interlink_parent || null;
      const path = getPathForType(obj.type, obj.slug);

      try {
        // Upsert into cms_objects
        const existingResult = await query(
          "SELECT id FROM cms_objects WHERE slug = $1",
          [obj.slug]
        );

        let status: "created" | "updated";

        if (existingResult.rows.length > 0) {
          // Update existing
          await query(
            `UPDATE cms_objects 
             SET type = $1, cluster_slug = $2, data = $3, word_count = $4, health = $5, updated_at = now()
             WHERE slug = $6`,
            [obj.type, clusterSlug, JSON.stringify(obj), wordCount, health, obj.slug]
          );
          status = "updated";
        } else {
          // Insert new
          await query(
            `INSERT INTO cms_objects (slug, type, cluster_slug, data, word_count, health)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [obj.slug, obj.type, clusterSlug, JSON.stringify(obj), wordCount, health]
          );
          status = "created";
        }

        // Upsert into global_urls (preserves is_indexed on update)
        const title = obj.seo?.metaTitle || obj.title || obj.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        await query(
          `INSERT INTO global_urls (url, type, cms_slug, title, is_indexed)
           VALUES ($1, $2, $3, $4, false)
           ON CONFLICT (url) DO UPDATE
           SET type = EXCLUDED.type,
               cms_slug = EXCLUDED.cms_slug,
               title = COALESCE(EXCLUDED.title, global_urls.title),
               updated_at = now()`,
          [path, obj.type, obj.slug, title]
        );

        results.push({
          slug: obj.slug,
          type: obj.type,
          status,
          health,
          word_count: wordCount,
        });
      } catch (dbError) {
        console.error(`Database error for slug ${obj.slug}:`, dbError);
        results.push({
          slug: obj.slug,
          type: obj.type,
          status: "error",
          health: "thin",
          word_count: wordCount,
          error: "Database error",
        });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      ok: errors === 0,
      count: objects.length,
      created,
      updated,
      errors,
      results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
