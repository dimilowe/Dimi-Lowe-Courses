import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a shopping assistant that helps users find cheaper alternatives on AliExpress. Given a product description or URL, analyze the product and generate optimized search keywords for AliExpress.

Your job:
1. Identify the product type (clothing, accessory, gadget, home item, etc.)
2. Extract key attributes (color, material, style, size descriptors)
3. Generate 5-8 different search keyword combinations optimized for AliExpress

Return JSON only in this exact shape:
{
  "product": {
    "label": "Short product name (2-4 words)",
    "description": "1-2 sentence description of what you're looking for",
    "category": "clothing|accessories|electronics|home|beauty|other"
  },
  "search_keywords": ["keyword phrase 1", "keyword phrase 2", ...],
  "shopping_tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Guidelines:
- Use generic terms, not brand names (brands won't work on AliExpress)
- Include material keywords (cotton, leather, faux leather, stainless steel, etc.)
- Include style keywords (minimalist, vintage, boho, streetwear, etc.)
- Include color if mentioned
- Generate diverse search variations (some broad, some specific)
- Focus on terms that work well on Chinese marketplaces

Do not include any text outside the JSON.`;

interface ProductResult {
  title: string;
  price?: string;
  imageUrl?: string;
  source: string;
  productUrl: string;
  externalSearchLink?: boolean;
  retailerGradient?: string;
}

interface AnalyzeResponse {
  product: {
    label: string;
    description: string;
    category: string;
  };
  search_keywords: string[];
  shopping_tips: string[];
}

async function searchAliExpressProducts(keywords: string[], label: string): Promise<ProductResult[]> {
  const query = keywords.slice(0, 3).join(' ');
  const serpApiKey = process.env.SERPAPI_API_KEY;
  
  if (serpApiKey) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'aliexpress');
      url.searchParams.set('q', query);
      url.searchParams.set('api_key', serpApiKey);
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.organic_results && data.organic_results.length > 0) {
          return data.organic_results.slice(0, 8).map((item: {
            title?: string;
            price?: string;
            price_snippet?: string;
            thumbnail?: string;
            link?: string;
          }) => ({
            title: item.title || 'Product',
            price: item.price || item.price_snippet,
            imageUrl: item.thumbnail,
            source: 'AliExpress',
            productUrl: item.link || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
            externalSearchLink: false,
          }));
        }
      }
    } catch (error) {
      console.error('SerpAPI AliExpress error:', error);
    }
  }
  
  const searchVariations = keywords.slice(0, 4).map((keyword) => ({
    title: `Search "${keyword}" on AliExpress`,
    source: 'AliExpress',
    productUrl: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`,
    externalSearchLink: true,
    retailerGradient: 'FF6600,E35100',
  }));

  const googleShopping = {
    title: `Shop ${label} on Google Shopping`,
    source: 'Google Shopping',
    productUrl: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query + ' cheap')}`,
    externalSearchLink: true,
    retailerGradient: '4285F4,34A853',
  };

  return [...searchVariations, googleShopping];
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { input } = await request.json();

    if (!input || typeof input !== 'string' || input.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a product link or description' },
        { status: 400 }
      );
    }

    const openai = new OpenAI();

    const isUrl = input.startsWith('http://') || input.startsWith('https://') || input.includes('.com');
    
    const userMessage = isUrl 
      ? `Analyze this product URL and generate AliExpress search keywords: ${input}`
      : `Analyze this product description and generate AliExpress search keywords: ${input}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    let parsed: AnalyzeResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse AI response');
    }

    if (!parsed.search_keywords || !Array.isArray(parsed.search_keywords)) {
      throw new Error('Invalid AI response structure');
    }

    const keywords = parsed.search_keywords
      .filter((k) => k && typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim());

    if (keywords.length < 2) {
      throw new Error('Not enough search keywords generated. Please try again.');
    }

    const products = await searchAliExpressProducts(keywords, parsed.product.label);

    return NextResponse.json({
      detectedItem: {
        label: parsed.product.label,
        description: parsed.product.description,
        category: parsed.product.category,
        searchKeywords: keywords.slice(0, 5),
      },
      products,
      shoppingTips: parsed.shopping_tips || [
        'Filter by 4+ star ratings',
        'Look for listings with photo reviews',
        'Check seller rating (95%+ is ideal)',
      ],
    });

  } catch (error) {
    console.error('AliExpress Dupe API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
