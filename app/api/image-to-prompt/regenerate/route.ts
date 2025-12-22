import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getClientIP, checkRateLimit } from '@/lib/image-to-prompt/rate-limit';
import { validateImageFile, processAndDownscaleImage } from '@/lib/image-to-prompt/image-utils';
import { 
  enforceSimplifiedCharLimit,
  PresetOptions,
  type RegenerateRequest,
  type Variant
} from '@/lib/image-to-prompt/types';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VariantResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string()
});

function buildRegeneratePrompt(options: RegenerateRequest): string {
  const preset = PresetOptions.find(p => p.id === options.preset);
  const presetGuidance = preset?.guidance || '';

  const variantDescriptions: Record<string, string> = {
    faithful: 'Faithful Recreation: Closest match to the original. Comprehensive but not overwhelming.',
    detailed: 'Faithful + Super Detailed: Extremely verbose, layout-locked, generator-friendly with technical terms.',
    simplified: 'Simplified: Short and clean, MAXIMUM 240 characters. Essential elements only.',
    style_shift: `Style Shift: ${options.styleShift !== 'None' ? `Apply ${options.styleShift} style` : 'Apply a creative artistic style'} while ${options.preserveLayout ? 'maintaining exact composition' : 'keeping the subject recognizable'}.`,
    remix: `Creative Remix: Recognizable subject with creative reinterpretation. ${options.preserveLayout ? 'Keep composition identical.' : 'More interpretive.'}`
  };

  const variantTitles: Record<string, string> = {
    faithful: 'Faithful Recreation',
    detailed: 'Faithful + Super Detailed',
    simplified: 'Simplified',
    style_shift: options.styleShift !== 'None' ? `Style Shift: ${options.styleShift}` : 'Style Shift',
    remix: 'Creative Remix'
  };

  return `You are an expert image analysis and prompt engineering AI. Generate a SINGLE prompt variant for this image.

CRITICAL RULES:
1. Respond with valid JSON only. No markdown, no explanations.
2. If uncertain about any detail, say "unknown" rather than guessing.
3. Do not guess a person's identity.

${options.preserveLayout ? 'LAYOUT PRESERVATION: Keep exact spatial composition.' : ''}
${options.keepTextExact ? 'TEXT PRESERVATION: Do not invent text. Use "[exact text]" or "[unclear text]".' : ''}
${options.subjectLock ? `SUBJECT LOCK: Keep the main subject: "${options.subjectDescription}"` : ''}
${presetGuidance ? `IMAGE TYPE: ${presetGuidance}` : ''}

VARIANT TO GENERATE: ${variantDescriptions[options.variantId]}

OUTPUT FORMAT (strict JSON):
{
  "id": "${options.variantId}",
  "title": "${variantTitles[options.variantId]}",
  "prompt": "your generated prompt here"
}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIP();
    const rateCheck = checkRateLimit(ip);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 60000)} minutes.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const variantId = formData.get('variantId') as string;
    const preserveLayout = formData.get('preserveLayout') === 'true';
    const keepTextExact = formData.get('keepTextExact') === 'true';
    const subjectLock = formData.get('subjectLock') === 'true';
    const styleShift = (formData.get('styleShift') as string) || 'None';
    const preset = (formData.get('preset') as string) || 'none';
    const subjectDescription = (formData.get('subjectDescription') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!variantId || !['faithful', 'detailed', 'simplified', 'style_shift', 'remix'].includes(variantId)) {
      return NextResponse.json({ error: 'Invalid variant ID' }, { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const base64Image = await processAndDownscaleImage(file);

    const options: RegenerateRequest = {
      preserveLayout,
      keepTextExact,
      subjectLock,
      styleShift: styleShift as RegenerateRequest['styleShift'],
      preset: preset as RegenerateRequest['preset'],
      variantId: variantId as RegenerateRequest['variantId'],
      subjectDescription
    };

    const systemPrompt = buildRegeneratePrompt(options);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: base64Image, detail: 'high' }
            },
            {
              type: 'text',
              text: 'Generate the single prompt variant as specified. Respond with valid JSON only.'
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.8
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let parsed: Variant;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const rawParsed = JSON.parse(cleaned);
      const result = VariantResponseSchema.safeParse(rawParsed);
      
      if (!result.success) {
        throw new Error('Invalid response schema');
      }
      
      parsed = result.data as Variant;
      
      if (parsed.id === 'simplified') {
        parsed.prompt = enforceSimplifiedCharLimit(parsed.prompt, 240);
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Regenerate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
