import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
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

function ensureStyleSuffix(artistInspo: string): string {
  if (!artistInspo || artistInspo.trim() === '') return '';
  const trimmed = artistInspo.trim();
  if (trimmed.toLowerCase().endsWith('-style')) {
    return trimmed;
  }
  return `${trimmed}-style`;
}

function detectLyrics(input: string): boolean {
  const lines = input.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 2) return false;
  const avgLineLength = lines.reduce((sum, line) => sum + line.trim().length, 0) / lines.length;
  return avgLineLength < 40;
}

function clamp500(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^["']|["']$/g, '')
    .replace(/\*\*/g, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length <= 500) return cleaned;

  const optionalAdjectivePatterns = [
    /\blush\b/gi,
    /\bsubtle\b/gi,
    /\bgentle\b/gi,
    /\bdreamy\b/gi,
    /\bethereal\b/gi,
    /\batmospheric\b/gi,
    /\bdelicate\b/gi,
    /\bwarm\b/gi,
    /\brich\b/gi,
    /\bvibrant\b/gi,
    /\bimmersive\b/gi,
  ];

  const mixDescriptorPatterns = [
    /,?\s*reverb-soaked\s*/gi,
    /,?\s*tape-saturated\s*/gi,
    /,?\s*lo-fi warmth\s*/gi,
    /,?\s*analog warmth\s*/gi,
    /,?\s*spacious mix\s*/gi,
    /,?\s*wide stereo\s*/gi,
    /,?\s*crystal[- ]clear\s*/gi,
  ];

  const structurePatterns = [
    /,?\s*intro builds? to\s*/gi,
    /,?\s*ending fades? out\s*/gi,
    /,?\s*gradual fade out\s*/gi,
    /,?\s*slow build\s*/gi,
    /,?\s*dynamic transitions?\s*/gi,
  ];

  for (const pattern of optionalAdjectivePatterns) {
    if (cleaned.length <= 500) break;
    cleaned = cleaned.replace(pattern, '').replace(/\s+/g, ' ').trim();
  }

  for (const pattern of mixDescriptorPatterns) {
    if (cleaned.length <= 500) break;
    cleaned = cleaned.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
  }

  for (const pattern of structurePatterns) {
    if (cleaned.length <= 500) break;
    cleaned = cleaned.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
  }

  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

  if (cleaned.length > 500) {
    cleaned = cleaned.slice(0, 497);
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > 400) {
      cleaned = cleaned.slice(0, lastSpace);
    }
    cleaned = cleaned.replace(/[,.\s]+$/, '') + '...';
  }

  return cleaned;
}

const SYSTEM_PROMPT = `You are generating concise, production-ready Suno music prompts. Do not be verbose. Do not explain. Output only structured descriptions using music industry terminology.

RULES:
- Each prompt must be ≤500 characters
- Output dense, comma-separated descriptors in sentence form
- No bullet points, no markdown, no sections
- No lyrics or song words
- Include: genre, mood, energy, tempo, vocal type, instrumentation, mix notes, structure cues
- Use professional music production language

OUTPUT FORMAT (strict JSON only):
{
  "prompts": [
    { "label": "Clean + Direct", "text": "..." },
    { "label": "More Cinematic", "text": "..." },
    { "label": "More Minimal / Modern", "text": "..." }
  ]
}

VARIANT GUIDELINES:
- Clean + Direct: Straightforward, genre-focused, clear instrumentation
- More Cinematic: Orchestral elements, dynamic builds, emotional swells, film score vibes
- More Minimal / Modern: Sparse, electronic textures, negative space, contemporary production

Do not include any text before or after the JSON.`;

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
    const { input, genre, mood, energy, vocalType, artistInspo, tempo } = body;

    if (!input || typeof input !== 'string' || input.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe the song or vibe you want (at least 10 characters).' },
        { status: 400 }
      );
    }

    if (input.length > 2000) {
      return NextResponse.json(
        { error: 'Input is too long. Please keep it under 2000 characters.' },
        { status: 400 }
      );
    }

    if (detectLyrics(input)) {
      return NextResponse.json(
        { error: 'Please describe the song/vibe instead of pasting lyrics.' },
        { status: 400 }
      );
    }

    const artistStyled = ensureStyleSuffix(artistInspo || '');

    const userPrompt = `Generate 3 Suno music prompts based on:

Song/Vibe: ${input.trim()}
${genre ? `Genre: ${genre}` : ''}
${mood ? `Mood: ${mood}` : ''}
${energy ? `Energy: ${energy}` : ''}
${vocalType ? `Vocals: ${vocalType}` : ''}
${artistStyled ? `Artist Reference: ${artistStyled}` : ''}
${tempo ? `Tempo: ${tempo}` : ''}

Remember: Dense, comma-separated descriptors. No bullets. ≤500 chars each. Include instrumentation, mix notes, and structure cues.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate prompts. Please try again.' },
        { status: 500 }
      );
    }

    if (!parsed.prompts || !Array.isArray(parsed.prompts) || parsed.prompts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid response format. Please try again.' },
        { status: 500 }
      );
    }

    const clampedPrompts = parsed.prompts.map((p: { label: string; text: string }) => ({
      label: p.label,
      text: clamp500(p.text)
    }));

    return NextResponse.json({ prompts: clampedPrompts });

  } catch (error) {
    console.error('Suno prompt API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
