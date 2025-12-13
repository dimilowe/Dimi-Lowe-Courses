import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limiter';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface KeywordIdea {
  keyword: string;
  difficulty: number;
  searchVolume: number;
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational';
  contentAngle: string;
  notes: string;
}

interface KeywordRequest {
  seed: string;
  maxResults?: number;
  maxDifficulty?: number;
  language?: string;
}

function validateKeyword(k: any): KeywordIdea | null {
  if (
    typeof k.keyword === 'string' &&
    typeof k.difficulty === 'number' &&
    typeof k.searchVolume === 'number' &&
    ['informational', 'transactional', 'commercial', 'navigational'].includes(k.intent)
  ) {
    return {
      keyword: k.keyword,
      difficulty: Math.max(0, Math.min(100, k.difficulty)),
      searchVolume: Math.max(0, k.searchVolume),
      intent: k.intent,
      contentAngle: typeof k.contentAngle === 'string' ? k.contentAngle : '',
      notes: typeof k.notes === 'string' ? k.notes : ''
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimit = checkRateLimit(ip, 'keyword-finder');
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetIn / 60000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${minutes} minutes.` },
        { status: 429 }
      );
    }

    const body: KeywordRequest = await request.json();
    const { seed, maxResults = 50, maxDifficulty = 30, language = 'English' } = body;

    if (!seed || typeof seed !== 'string' || seed.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide a seed keyword or topic' },
        { status: 400 }
      );
    }

    if (seed.length > 200) {
      return NextResponse.json(
        { error: 'Seed keyword must be 200 characters or less' },
        { status: 400 }
      );
    }

    const sanitizedSeed = seed.trim().slice(0, 200);
    const clampedMaxResults = Math.min(Math.max(10, maxResults), 100);
    const clampedMaxDifficulty = Math.min(Math.max(10, maxDifficulty), 60);

    const systemPrompt = `You are an SEO strategist. Given a seed keyword or topic, you generate ONLY **long-tail, low-competition keyword ideas** with real searcher intent, focusing on opportunities smaller websites can rank for.

Rules:
- Focus on very specific, long-tail phrases (3+ words).
- Avoid super general head terms like "marketing", "SEO", "shoes".
- Assume ${language} search unless otherwise specified.
- Estimate difficulty from 0–100 where:
  - 0–20 = very easy (rarely targeted, niche)
  - 21–35 = easy (some competition but achievable)
  - 36–55 = medium (requires quality content)
  - 56+ = hard (established sites dominate)
- Return mostly keywords with difficulty <= ${clampedMaxDifficulty}, only a few slightly above to show range.
- Estimate monthly search volume as a rough bucket: 10, 30, 70, 150, 300, 700, 1200, 2400, etc.
- Classify intent as: informational, transactional, commercial, or navigational.
- Generate diverse keyword angles covering different aspects of the topic.

Respond in **pure JSON** only, no markdown, no commentary, with this exact shape:

{
  "seed": "${sanitizedSeed}",
  "keywords": [
    {
      "keyword": "string",
      "difficulty": number,
      "searchVolume": number,
      "intent": "informational" | "transactional" | "commercial" | "navigational",
      "contentAngle": "string - suggested article or page angle",
      "notes": "short note on why this is a good low-competition opportunity"
    }
  ]
}

Generate exactly ${clampedMaxResults} keyword ideas.`;

    const userPrompt = `Find low-competition keyword ideas for: "${sanitizedSeed}"`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullContent = '';
    let sentKeywordCount = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', seed: sanitizedSeed, remaining: rateLimit.remaining })}\n\n`));

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            fullContent += delta;

            const keywordsMatch = fullContent.match(/"keywords"\s*:\s*\[/);
            if (keywordsMatch) {
              const keywordsStart = fullContent.indexOf('"keywords"');
              const arrayStart = fullContent.indexOf('[', keywordsStart);
              if (arrayStart !== -1) {
                let bracketCount = 0;
                let inString = false;
                let escape = false;
                let lastCompleteObjectEnd = -1;
                
                for (let i = arrayStart; i < fullContent.length; i++) {
                  const char = fullContent[i];
                  
                  if (escape) {
                    escape = false;
                    continue;
                  }
                  
                  if (char === '\\') {
                    escape = true;
                    continue;
                  }
                  
                  if (char === '"' && !escape) {
                    inString = !inString;
                    continue;
                  }
                  
                  if (inString) continue;
                  
                  if (char === '{') bracketCount++;
                  if (char === '}') {
                    bracketCount--;
                    if (bracketCount === 0) {
                      lastCompleteObjectEnd = i;
                    }
                  }
                }

                if (lastCompleteObjectEnd > arrayStart) {
                  const partialArray = fullContent.slice(arrayStart, lastCompleteObjectEnd + 1) + ']';
                  try {
                    const parsed = JSON.parse(partialArray);
                    if (Array.isArray(parsed)) {
                      for (let i = sentKeywordCount; i < parsed.length; i++) {
                        const validated = validateKeyword(parsed[i]);
                        if (validated) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'keyword', keyword: validated })}\n\n`));
                          sentKeywordCount++;
                        }
                      }
                    }
                  } catch {
                  }
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', total: sentKeywordCount })}\n\n`));
          controller.close();
          
          console.log(`[Keyword Finder] Streamed ${sentKeywordCount} keywords for: "${sanitizedSeed}"`);
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Keyword finder error:', error);
    return NextResponse.json(
      { error: 'Failed to generate keywords. Please try again.' },
      { status: 500 }
    );
  }
}
