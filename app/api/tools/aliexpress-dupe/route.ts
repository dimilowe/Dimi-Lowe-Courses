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
  "search_variations": [
    {
      "keywords": "search phrase for aliexpress",
      "focus": "what this search emphasizes (e.g., 'exact style match', 'budget option', 'similar material')"
    }
  ],
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

interface SearchVariation {
  keywords: string;
  focus: string;
}

interface AnalyzeResponse {
  product: {
    label: string;
    description: string;
    category: string;
  };
  search_variations: SearchVariation[];
  shopping_tips: string[];
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

    if (!parsed.search_variations || !Array.isArray(parsed.search_variations)) {
      throw new Error('Invalid AI response structure');
    }

    let variations = parsed.search_variations
      .filter((v) => v.keywords && v.keywords.trim().length > 0)
      .map((v) => ({
        keywords: v.keywords.trim(),
        focus: v.focus?.trim() || 'General search',
      }));

    const seen = new Set<string>();
    variations = variations.filter((v) => {
      const key = v.keywords.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (variations.length < 3) {
      throw new Error('Not enough search variations generated. Please try again.');
    }

    variations = variations.slice(0, 8);

    const aliexpressBaseUrl = 'https://www.aliexpress.com/wholesale?SearchText=';
    
    const searchLinks = variations.map((variation) => ({
      keywords: variation.keywords,
      focus: variation.focus,
      url: `${aliexpressBaseUrl}${encodeURIComponent(variation.keywords)}`,
    }));

    return NextResponse.json({
      product: parsed.product,
      searchLinks,
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
