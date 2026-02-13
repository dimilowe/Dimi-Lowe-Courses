import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining } = getRateLimitInfo(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const { keyword, content } = await request.json();

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Target keyword phrase is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content is too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert SEO editor with years of experience optimizing content for search engines while maintaining readability and user engagement.

Your task is to optimize the user's article so it can rank for their target keyword phrase.

Rules:
1. Keep the core meaning, tone, and structure of the original content
2. Improve clarity, flow, and readability
3. Naturally incorporate the target keyword in:
   - The title/headline (if present)
   - The introduction/first paragraph
   - Relevant subheadings (H2s, H3s)
   - The conclusion
   - Sprinkled naturally throughout the body
4. Avoid keyword stuffing - aim for 1-2% keyword density maximum
5. Ensure the content reads naturally and provides value to readers
6. Use semantic variations and related terms where appropriate
7. Maintain proper heading hierarchy
8. Return ONLY the optimized article text
9. Do NOT include any commentary, explanations, or markdown formatting
10. Output plain text with clear paragraph breaks and headings`;

    const userPrompt = `Target keyword phrase: "${keyword.trim()}"

Original content to optimize:

${content.trim()}

Please optimize this content for the target keyword phrase while following all the SEO best practices.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const optimizedText = response.choices[0]?.message?.content || '';

    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Failed to generate optimized content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      optimizedText: optimizedText.trim(),
      remaining
    });

  } catch (error) {
    console.error('Reach Grabber API error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize content. Please try again.' },
      { status: 500 }
    );
  }
}
