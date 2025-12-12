import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaContent = (selectors: string[]): string => {
      for (const selector of selectors) {
        const content = $(selector).attr("content");
        if (content && content.trim()) {
          return content.trim();
        }
      }
      return "";
    };

    const title =
      getMetaContent([
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
        'meta[name="title"]',
      ]) ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "";

    const description =
      getMetaContent([
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
        'meta[name="description"]',
      ]) || "";

    let image =
      getMetaContent([
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[name="twitter:image:src"]',
      ]) || "";

    if (image && !image.startsWith("http")) {
      try {
        const baseUrl = new URL(url);
        image = new URL(image, baseUrl.origin).href;
      } catch {
        image = "";
      }
    }

    let price = "";

    const priceSelectors = [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      '[itemprop="price"]',
      ".price",
      ".product-price",
      '[data-price]',
      ".sale-price",
      ".current-price",
    ];

    for (const selector of priceSelectors) {
      if (selector.startsWith("meta")) {
        const content = $(selector).attr("content");
        if (content) {
          price = content;
          break;
        }
      } else {
        const el = $(selector).first();
        const content = el.attr("content") || el.text().trim();
        if (content) {
          const match = content.match(/[\$\€\£]?\s*[\d,]+\.?\d*/);
          if (match) {
            price = match[0];
            break;
          }
        }
      }
    }

    const currency =
      getMetaContent([
        'meta[property="product:price:currency"]',
        'meta[property="og:price:currency"]',
      ]) || "";

    if (price && currency && !price.includes("$") && !price.includes(currency)) {
      price = `${currency} ${price}`;
    }

    return NextResponse.json({
      title: title.substring(0, 200),
      description: description.substring(0, 500),
      image,
      price: price.substring(0, 50),
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
