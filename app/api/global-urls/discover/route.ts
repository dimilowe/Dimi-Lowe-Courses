import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import fs from "fs";
import path from "path";

async function verifyAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  return session.isAdmin || false;
}

interface DiscoveredUrl {
  url: string;
  type: string;
  title?: string;
}

function scanAppDirectory(dir: string, baseUrl: string = ""): DiscoveredUrl[] {
  const urls: DiscoveredUrl[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_") || entry.name === "api" || entry.name === "node_modules") {
          continue;
        }
        
        const isDynamic = entry.name.startsWith("[") && entry.name.endsWith("]");
        const newBaseUrl = isDynamic 
          ? `${baseUrl}/${entry.name}`
          : `${baseUrl}/${entry.name}`;
        
        const hasPage = fs.existsSync(path.join(fullPath, "page.tsx")) || 
                        fs.existsSync(path.join(fullPath, "page.ts"));
        
        if (hasPage && !isDynamic) {
          let type = "static";
          if (entry.name === "admin" || baseUrl.includes("/admin")) {
            type = "static";
          } else if (baseUrl.includes("/tools") || entry.name === "tools") {
            type = "tool";
          } else if (baseUrl.includes("/ideas") || entry.name === "ideas") {
            type = "idea";
          } else if (baseUrl.includes("/product") || entry.name === "product") {
            type = "product";
          } else if (baseUrl.includes("/articles") || entry.name === "articles") {
            type = "article";
          } else if (baseUrl.includes("/newsletter") || entry.name === "newsletter") {
            type = "blog";
          } else if (baseUrl.includes("/answers") || entry.name === "answers") {
            type = "answer";
          }
          
          urls.push({
            url: newBaseUrl,
            type,
            title: entry.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
          });
        }
        
        urls.push(...scanAppDirectory(fullPath, newBaseUrl));
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return urls;
}

export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appDir = path.join(process.cwd(), "app");
    const discoveredUrls = scanAppDirectory(appDir);
    
    discoveredUrls.unshift({
      url: "/",
      type: "static",
      title: "Homepage"
    });

    // Discover all database-stored content

    // Articles from cluster_articles
    const articlesResult = await query(`SELECT slug, title FROM cluster_articles`);
    for (const article of articlesResult.rows) {
      discoveredUrls.push({
        url: `/articles/${article.slug}`,
        type: "article",
        title: article.title
      });
    }

    // Blog posts from blog_posts
    const blogResult = await query(`SELECT slug, title FROM blog_posts`);
    for (const post of blogResult.rows) {
      discoveredUrls.push({
        url: `/newsletter/${post.slug}`,
        type: "blog",
        title: post.title
      });
    }

    // Tools from tools table
    const toolsResult = await query(`SELECT slug, name FROM tools WHERE slug IS NOT NULL`);
    for (const tool of toolsResult.rows) {
      discoveredUrls.push({
        url: `/tools/${tool.slug}`,
        type: "tool",
        title: tool.name
      });
    }

    // Products from products table
    const productsResult = await query(`SELECT slug, name FROM products`);
    for (const product of productsResult.rows) {
      discoveredUrls.push({
        url: `/products/${product.slug}`,
        type: "product",
        title: product.name
      });
    }

    // MBBs from cms_objects
    const mbbsResult = await query(`SELECT slug, data->>'title' as title FROM cms_objects WHERE type = 'mbb'`);
    for (const mbb of mbbsResult.rows) {
      discoveredUrls.push({
        url: `/mbb/${mbb.slug}`,
        type: "mbb",
        title: mbb.title
      });
    }

    // CMS Products from cms_objects (new CMS-driven products at /products/{slug})
    const cmsProductsResult = await query(`SELECT slug, data->>'title' as title FROM cms_objects WHERE type = 'product'`);
    for (const product of cmsProductsResult.rows) {
      discoveredUrls.push({
        url: `/products/${product.slug}`,
        type: "product",
        title: product.title
      });
    }

    let inserted = 0;
    let existing = 0;

    for (const urlData of discoveredUrls) {
      const existingUrl = await query(
        "SELECT id FROM global_urls WHERE url = $1",
        [urlData.url]
      );

      if (existingUrl.rows.length === 0) {
        await query(
          `INSERT INTO global_urls (url, title, type, is_indexed)
           VALUES ($1, $2, $3, false)`,
          [urlData.url, urlData.title, urlData.type]
        );
        inserted++;
      } else {
        existing++;
      }
    }

    const allUrls = await query(
      "SELECT * FROM global_urls ORDER BY url ASC"
    );

    return NextResponse.json({
      success: true,
      discovered: discoveredUrls.length,
      inserted,
      existing,
      urls: allUrls.rows
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appDir = path.join(process.cwd(), "app");
    const discoveredUrls = scanAppDirectory(appDir);
    
    discoveredUrls.unshift({
      url: "/",
      type: "static",
      title: "Homepage"
    });

    return NextResponse.json({
      urls: discoveredUrls,
      count: discoveredUrls.length
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
