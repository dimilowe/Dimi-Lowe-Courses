import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { gateToolForRequest } from '@/lib/entitlements/withToolGate';

const TOOL_SLUG = 'outfit-ideas';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
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

const SYSTEM_PROMPT = `You are a product-matching assistant. Given an image, you identify distinct visually-sellable items (clothes, accessories, furniture, gadgets, decor, etc.) and output CLEAN JSON.

For each item, infer:
- a concise label (2–4 words)
- a natural language description (1–2 sentences)
- a list of keyword phrases suitable for shopping searches (5–10, specific but not brand-dependent)

Return JSON only in this shape:
{
  "detected_items": [
    {
      "label": "string",
      "description": "string",
      "search_keywords": ["string", ...]
    }
  ]
}

Do not include any extra text outside JSON. Focus on clothing, accessories, shoes, bags, and fashion items primarily. Be specific with colors, patterns, materials, and styles.`;

interface DetectedItem {
  label: string;
  description: string;
  search_keywords: string[];
}

interface VisionResponse {
  detected_items: DetectedItem[];
}

interface ProductResult {
  title: string;
  price?: string;
  imageUrl?: string;
  source?: string;
  productUrl: string;
  externalSearchLink?: boolean;
}

interface AnalyzeResponseItem {
  detectedItem: {
    label: string;
    description: string;
    searchKeywords: string[];
  };
  products: ProductResult[];
}

async function searchProducts(keywords: string[], label: string): Promise<ProductResult[]> {
  const query = keywords.slice(0, 4).join(' ');
  const serpApiKey = process.env.SERPAPI_API_KEY;
  
  if (serpApiKey) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_shopping');
      url.searchParams.set('q', query);
      url.searchParams.set('api_key', serpApiKey);
      url.searchParams.set('num', '6');
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.shopping_results && data.shopping_results.length > 0) {
          return data.shopping_results.slice(0, 6).map((item: {
            title?: string;
            price?: string;
            extracted_price?: number;
            thumbnail?: string;
            source?: string;
            link?: string;
            product_link?: string;
          }) => ({
            title: item.title || 'Product',
            price: item.price || (item.extracted_price ? `$${item.extracted_price}` : undefined),
            imageUrl: item.thumbnail,
            source: item.source,
            productUrl: item.link || item.product_link || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`,
            externalSearchLink: false,
          }));
        }
      }
    } catch (error) {
      console.error('SerpAPI error:', error);
    }
  }
  
  const retailers = [
    { name: 'Amazon', baseUrl: 'https://www.amazon.com/s?k=', gradient: 'FF9900,FFB84D' },
    { name: 'Nordstrom', baseUrl: 'https://www.nordstrom.com/sr?keyword=', gradient: '1a1a2e,16213e' },
    { name: 'ASOS', baseUrl: 'https://www.asos.com/us/search/?q=', gradient: '2D2D2D,4a4a4a' },
    { name: 'Google Shopping', baseUrl: 'https://www.google.com/search?tbm=shop&q=', gradient: '4285F4,34A853' },
  ];
  
  return retailers.map((retailer) => ({
    title: `Shop ${label} on ${retailer.name}`,
    source: retailer.name,
    productUrl: `${retailer.baseUrl}${encodeURIComponent(query)}`,
    externalSearchLink: false,
    retailerGradient: retailer.gradient,
  }));
}

export async function POST(request: NextRequest) {
  try {
    // Gate check first
    const gateResult = await gateToolForRequest(TOOL_SLUG);
    if (!gateResult.allowed) {
      return gateResult.response;
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, { status: 400 });
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }
    
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    const openai = new OpenAI();
    
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Analyze this image and identify all shoppable fashion/style items. Return JSON with detected items and search keywords.',
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });
    
    const content = visionResponse.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'Vision analysis failed - no response' }, { status: 502 });
    }
    
    let parsed: VisionResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ items: [] });
      }
      parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.detected_items || !Array.isArray(parsed.detected_items)) {
        return NextResponse.json({ items: [] });
      }
      
      if (parsed.detected_items.length === 0) {
        return NextResponse.json({ items: [] });
      }
    } catch {
      console.error('Vision parsing issue, returning empty:', content);
      return NextResponse.json({ items: [] });
    }
    
    const results: AnalyzeResponseItem[] = await Promise.all(
      parsed.detected_items.map(async (item) => {
        const products = await searchProducts(item.search_keywords, item.label);
        return {
          detectedItem: {
            label: item.label,
            description: item.description,
            searchKeywords: item.search_keywords,
          },
          products,
        };
      })
    );
    
    return NextResponse.json({ items: results });
    
  } catch (error) {
    console.error('Outfit analyzer error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { error: 'AI service is temporarily busy. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('authentication')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please try again later.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 502 }
    );
  }
}
