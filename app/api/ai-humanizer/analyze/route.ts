import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
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

    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide text to analyze' },
        { status: 400 }
      );
    }

    if (text.length > 15000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 15,000 characters.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert AI content detector and writing analyst. Your job is to analyze text and determine how likely it was written by AI vs a human.

When analyzing text, look for these AI writing patterns:
- Overly uniform sentence structure and length
- Repetitive transitional phrases like "In today's fast-paced world", "It's important to note"
- Generic, vague statements lacking specific details
- Lack of personal voice, opinions, or unique perspective
- Overuse of hedging language ("may", "might", "could potentially")
- Perfect grammar with no colloquialisms or informal language
- Lists and bullet points used excessively
- Formulaic paragraph structure (topic sentence, supporting points, conclusion)

You must respond in valid JSON format with this exact structure:
{
  "aiProbability": <number 0-100>,
  "summary": "<2-3 sentence explanation of why the text appears AI-like or human-like>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "annotatedHtml": "<the original text with <span class='ai-flag'>AI-sounding segments</span> wrapped around suspicious parts>"
}

Rules:
- aiProbability should be your honest estimate from 0-100
- Provide 3-5 specific reasons
- Provide 3-5 actionable suggestions to make the text sound more human
- In annotatedHtml, wrap only the most obvious AI-sounding phrases/sentences with <span class='ai-flag'>...</span>
- Keep paragraph structure intact in annotatedHtml using <p> tags
- Respond ONLY with valid JSON, no markdown or explanation`;

    const userPrompt = `Analyze this text and determine how likely it was written by AI:

${text.trim()}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      aiProbability: parsed.aiProbability || 50,
      summary: parsed.summary || 'Unable to determine AI probability.',
      reasons: parsed.reasons || [],
      suggestions: parsed.suggestions || [],
      annotatedHtml: parsed.annotatedHtml || `<p>${text}</p>`,
      remaining
    });

  } catch (error) {
    console.error('AI Humanizer Analyze API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text. Please try again.' },
      { status: 500 }
    );
  }
}
