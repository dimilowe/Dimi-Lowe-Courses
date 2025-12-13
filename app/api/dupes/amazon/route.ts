import { NextRequest, NextResponse } from 'next/server';
import { parseAmazonProduct, extractAsinFromUrl } from '@/lib/dupes/parseAmazonProduct';
import { findDupes } from '@/lib/dupes/findDupes';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Please provide an Amazon product URL' },
        { status: 400 }
      );
    }

    const asin = extractAsinFromUrl(url);
    if (!asin) {
      return NextResponse.json(
        { error: 'Could not find a valid product ID (ASIN) in this URL. Please make sure you\'re linking to a specific Amazon product page.' },
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

    const product = await parseAmazonProduct(url);

    if (!product) {
      return NextResponse.json(
        { error: 'Could not parse product information. Please try a different Amazon link.' },
        { status: 422 }
      );
    }

    const dupes = await findDupes(product, 'amazon', {
      maxResults: 5,
      minSavingsPercent: 15,
    });

    return NextResponse.json({
      original: {
        title: product.title,
        price: product.price,
        image: product.image,
        asin: product.asin,
        category: product.category,
        url: product.url,
      },
      dupes,
    });

  } catch (error) {
    console.error('Error finding dupes:', error);
    return NextResponse.json(
      { error: 'Something went wrong while finding dupes. Please try again.' },
      { status: 500 }
    );
  }
}
