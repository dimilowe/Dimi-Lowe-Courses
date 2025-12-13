import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limiter';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const ALLOWED_DOMAINS = [
  'amazon.com', 'www.amazon.com',
  'walmart.com', 'www.walmart.com',
  'target.com', 'www.target.com',
  'bestbuy.com', 'www.bestbuy.com',
  'costco.com', 'www.costco.com',
  'lowes.com', 'www.lowes.com',
  'homedepot.com', 'www.homedepot.com',
  'ebay.com', 'www.ebay.com',
  'newegg.com', 'www.newegg.com',
  'bhphotovideo.com', 'www.bhphotovideo.com',
  'adorama.com', 'www.adorama.com',
  'etsy.com', 'www.etsy.com',
  'wayfair.com', 'www.wayfair.com',
  'overstock.com', 'www.overstock.com',
  'zappos.com', 'www.zappos.com',
  'kohls.com', 'www.kohls.com',
  'macys.com', 'www.macys.com',
  'nordstrom.com', 'www.nordstrom.com',
  'sephora.com', 'www.sephora.com',
  'ulta.com', 'www.ulta.com',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return false;
    }
    const hostname = url.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

interface PriceResult {
  title: string;
  price: number;
  currency: string;
  url: string;
  retailer: string;
  matchType: 'exact' | 'variant';
  confidence: number;
}

interface ProductInfo {
  title: string;
  brand: string;
  price: number | null;
  currency: string;
  model: string | null;
  url: string;
}

async function extractProductInfo(url: string): Promise<ProductInfo | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="title"]').attr('content') ||
                $('title').text() ||
                $('h1').first().text();

    title = title?.trim().slice(0, 200) || '';

    const priceSelectors = [
      '[data-price]',
      '.price',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '[itemprop="price"]',
      '.product-price',
      '.current-price',
    ];

    let priceText = '';
    for (const selector of priceSelectors) {
      const el = $(selector).first();
      if (el.length) {
        priceText = el.attr('content') || el.attr('data-price') || el.text();
        if (priceText) break;
      }
    }

    let price: number | null = null;
    let currency = 'USD';

    if (priceText) {
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(/,/g, ''));
      }
      if (priceText.includes('£')) currency = 'GBP';
      else if (priceText.includes('€')) currency = 'EUR';
      else if (priceText.includes('$')) currency = 'USD';
    }

    const brand = $('meta[property="product:brand"]').attr('content') ||
                  $('[itemprop="brand"]').text() ||
                  $('a#bylineInfo').text() ||
                  '';

    const model = $('[itemprop="model"]').text() ||
                  $('[itemprop="mpn"]').text() ||
                  $('[itemprop="sku"]').text() ||
                  '';

    return {
      title,
      brand: brand.trim(),
      price,
      currency,
      model: model.trim() || null,
      url,
    };
  } catch (error) {
    console.error('Error extracting product info:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const rateLimit = checkRateLimit(ip, 'price-matcher');
    if (!rateLimit.allowed) {
      const hours = Math.ceil(rateLimit.resetIn / 3600000);
      return NextResponse.json(
        { error: `Rate limit exceeded. You've used all 15 daily searches. Try again in ${hours} hour(s) or upgrade to Shopping Cloud for more.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid product URL' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Please provide a valid URL' },
        { status: 400 }
      );
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        { error: 'Please use a product link from a supported retailer (Amazon, Walmart, Target, Best Buy, etc.). For security reasons, only major retailer URLs are supported.' },
        { status: 400 }
      );
    }

    const productInfo = await extractProductInfo(url);

    if (!productInfo || !productInfo.title) {
      return NextResponse.json(
        { error: 'Could not extract product information from this URL. Please try a different product page.' },
        { status: 400 }
      );
    }

    const searchQuery = [
      productInfo.brand,
      productInfo.model,
      productInfo.title.slice(0, 100),
    ].filter(Boolean).join(' ');

    const systemPrompt = `You are a price comparison assistant. Given a product, search for the same or very similar products at other retailers and return pricing information.

Return a JSON object with this exact structure:
{
  "results": [
    {
      "title": "Product title as listed",
      "price": 99.99,
      "currency": "USD",
      "url": "https://retailer.com/product-page",
      "retailer": "Retailer Name",
      "matchType": "exact" or "variant",
      "confidence": 0.95
    }
  ]
}

Rules:
- Only include results that are the same or very similar product
- Mark as "exact" only if it appears to be the exact same model/SKU
- Mark as "variant" if it's similar but might be a different size, color, or version
- Include 3-6 results from different retailers if possible
- Sort by price ascending
- Use real retailer URLs (Amazon, Walmart, Target, Best Buy, etc.)
- Confidence should be 0.0-1.0 based on how certain you are it's the same product
- If you cannot find good matches, return an empty results array`;

    const userPrompt = `Find the best prices for this product:

Title: ${productInfo.title}
Brand: ${productInfo.brand || 'Unknown'}
Model/SKU: ${productInfo.model || 'Not specified'}
Current Price: ${productInfo.price ? `$${productInfo.price}` : 'Unknown'}
Original URL: ${productInfo.url}

Search query to use: "${searchQuery}"

Find this product or close alternatives at other retailers with their current prices.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let parsed: { results: PriceResult[] };
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', content.slice(0, 500));
      parsed = { results: [] };
    }

    const validResults: PriceResult[] = (parsed.results || [])
      .filter((r: any) =>
        typeof r.title === 'string' &&
        typeof r.price === 'number' &&
        typeof r.url === 'string' &&
        r.price > 0
      )
      .map((r: any): PriceResult => ({
        title: r.title.slice(0, 200),
        price: r.price,
        currency: r.currency || 'USD',
        url: r.url,
        retailer: r.retailer || 'Unknown Retailer',
        matchType: r.matchType === 'exact' ? 'exact' : 'variant',
        confidence: typeof r.confidence === 'number' ? Math.min(1, Math.max(0, r.confidence)) : 0.5,
      }))
      .sort((a: PriceResult, b: PriceResult) => a.price - b.price);

    const bestDeal = validResults.length > 0 ? validResults[0] : null;

    let verdict: 'overpaying' | 'fair' | 'best-price' | 'unknown' = 'unknown';
    let savings: number | null = null;

    if (productInfo.price && bestDeal) {
      const priceDiff = productInfo.price - bestDeal.price;
      const percentDiff = (priceDiff / productInfo.price) * 100;

      if (percentDiff > 10) {
        verdict = 'overpaying';
        savings = priceDiff;
      } else if (percentDiff < -5) {
        verdict = 'best-price';
      } else {
        verdict = 'fair';
      }
    }

    console.log(`[Price Matcher] Found ${validResults.length} results for: "${productInfo.title.slice(0, 50)}..."`);

    return NextResponse.json({
      product: productInfo,
      results: validResults,
      bestDeal,
      verdict,
      savings,
      remaining: rateLimit.remaining,
    });

  } catch (error) {
    console.error('Price matcher error:', error);
    return NextResponse.json(
      { error: 'Failed to search for prices. Please try again.' },
      { status: 500 }
    );
  }
}
