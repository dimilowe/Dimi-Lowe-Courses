import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const MAX_INPUT_LENGTH = 8000;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
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
        { error: 'Rate limit exceeded. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { inputText, simpleMode, bulletsOnly } = body;

    if (!inputText || typeof inputText !== 'string') {
      return NextResponse.json(
        { error: 'Please provide text to summarize.' },
        { status: 400 }
      );
    }

    const trimmedText = inputText.trim();

    if (trimmedText.length < 200) {
      return NextResponse.json(
        { error: 'Please provide at least 200 characters of text to summarize.' },
        { status: 400 }
      );
    }

    let textToSummarize = trimmedText;
    let truncated = false;

    if (trimmedText.length > MAX_INPUT_LENGTH) {
      textToSummarize = trimmedText.slice(0, MAX_INPUT_LENGTH);
      truncated = true;
    }

    const systemPrompt = `You are a world-class summarizer. You turn long texts into clear, concise summaries and extract the most important key takeaways. You always preserve meaning but remove fluff, and you write in simple, direct language.

You must output ONLY valid JSON with this exact structure:
{
  "summary": "string with the summary",
  "takeaways": ["takeaway 1", "takeaway 2", "..."]
}

Do not include any text before or after the JSON. Do not use markdown code blocks. Output only the raw JSON object.`;

    let userInstructions = '';
    
    if (simpleMode && bulletsOnly) {
      userInstructions = 'Use simpler vocabulary and shorter sentences suitable for a general audience. Make the summary primarily bullet points with very minimal paragraph text.';
    } else if (simpleMode) {
      userInstructions = 'Use simpler vocabulary and shorter sentences suitable for a general audience. Use 2-4 short paragraphs.';
    } else if (bulletsOnly) {
      userInstructions = 'Make the summary primarily bullet points with very minimal paragraph text.';
    } else {
      userInstructions = 'Use 2-4 short paragraphs for the summary.';
    }

    const userPrompt = `Here is the text to summarize:

---
${textToSummarize}
---

Instructions:
${userInstructions}

Create a concise summary that captures the main points.
Extract the 5-10 most important key takeaways as bullet points.

Output ONLY valid JSON in this exact format with double quotes:
{"summary": "your summary here", "takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();

    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to generate summary. Please try again.' },
        { status: 500 }
      );
    }

    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse summary. Please try again.' },
        { status: 500 }
      );
    }

    if (!result.summary || !Array.isArray(result.takeaways)) {
      return NextResponse.json(
        { error: 'Invalid response format. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: result.summary,
      takeaways: result.takeaways,
      truncated,
      originalLength: truncated ? MAX_INPUT_LENGTH : undefined,
    });

  } catch (error) {
    console.error('Summarizer API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while generating your summary. Please try again.' },
      { status: 500 }
    );
  }
}
