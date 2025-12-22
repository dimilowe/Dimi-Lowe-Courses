import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getClientIP, checkRateLimit } from '@/lib/image-to-prompt/rate-limit';
import { validateImageFile, processAndDownscaleImage } from '@/lib/image-to-prompt/image-utils';
import { 
  ImageToPromptResponseSchema, 
  enforceSimplifiedCharLimit,
  PresetOptions,
  type GenerateRequest,
  type ImageToPromptResponse
} from '@/lib/image-to-prompt/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(options: GenerateRequest): string {
  const preset = PresetOptions.find(p => p.id === options.preset);
  const presetGuidance = preset?.guidance || '';

  return `You are an expert image analysis and prompt engineering AI. Your task is to analyze an image and generate multiple high-quality prompts that would allow someone to recreate a very similar image using any image generation AI.

CRITICAL RULES:
1. Always respond with valid JSON only. No markdown, no explanations, no extra text.
2. If you are uncertain about any detail, say "unknown" rather than guessing.
3. Do not guess a person's identity. Describe physical features only.
4. Do not add brand names unless clearly visible and necessary.
5. For abstract images, provide best-effort descriptions.

${options.preserveLayout ? `LAYOUT PRESERVATION MODE (preserveLayout=true):
- You MUST describe the exact spatial composition: foreground, midground, background.
- You MUST describe subject positioning (center, center-left, top-third, etc).
- Do NOT change camera angle, framing, crop, or subject placement in ANY variant.
- The layout_map field MUST be populated with detailed spatial information.
- All 5 variants must preserve identical composition - only wording, style, or story may change.` : `FLEXIBLE MODE (preserveLayout=false):
- You may describe composition loosely and focus on vibes/mood.
- The layout_map field MUST be null.
- Prompts can be more interpretive.`}

${options.keepTextExact ? `TEXT PRESERVATION MODE (keepTextExact=true):
- If the image contains text (signs, posters, UI), do NOT invent or modify the text.
- Describe visible text as "[exact text]" only if clearly legible.
- For unclear text, use placeholders like "[unreadable small text]" or "[blurred text]".
- Focus on typography style and layout rather than hallucinating content.` : ''}

${options.subjectLock ? `SUBJECT LOCK MODE (subjectLock=true):
- The main subject must remain identical across all 5 variants.
- Do not swap, replace, or significantly alter the primary subject.
- Only style, mood, and minor details may change.` : ''}

${options.styleShift !== 'None' ? `STYLE SHIFT: Apply "${options.styleShift}" style to the style_shift variant while maintaining the core subject and composition.` : ''}

${presetGuidance ? `IMAGE TYPE GUIDANCE: ${presetGuidance}` : ''}

VARIANT REQUIREMENTS:
1. "faithful" - Faithful Recreation: Closest match to the original. Comprehensive but not overwhelming.
2. "detailed" - Faithful + Super Detailed: Extremely verbose, layout-locked, generator-friendly with technical terms.
3. "simplified" - Simplified: Short and clean, MAXIMUM 240 characters. Essential elements only.
4. "style_shift" - Style Shift: ${options.styleShift !== 'None' ? `Apply ${options.styleShift} style` : 'Apply a creative artistic style'} while ${options.preserveLayout ? 'maintaining exact composition' : 'keeping the subject recognizable'}.
5. "remix" - Creative Remix: Recognizable subject with creative reinterpretation. ${options.preserveLayout ? 'Keep composition identical.' : 'More interpretive.'}

OUTPUT FORMAT (strict JSON):
{
  "variants": [
    { "id": "faithful", "title": "Faithful Recreation", "prompt": "..." },
    { "id": "detailed", "title": "Faithful + Super Detailed", "prompt": "..." },
    { "id": "simplified", "title": "Simplified", "prompt": "..." },
    { "id": "style_shift", "title": "Style Shift", "prompt": "..." },
    { "id": "remix", "title": "Creative Remix", "prompt": "..." }
  ],
  "negative_prompt": "...",
  "details": {
    "subject": "...",
    "setting": "...",
    "composition": "...",
    "lighting": "...",
    "camera_lens": "...",
    "color_palette": "...",
    "mood": "...",
    "style_notes": "..."
  },
  "layout_map": ${options.preserveLayout ? `{
    "aspect_ratio": "1:1|4:5|3:2|16:9|9:16|4:3|3:4|other",
    "foreground": "description of foreground elements",
    "midground": "description of midground elements",
    "background": "description of background",
    "subject_position": "center|center-left|center-right|top|bottom|top-left|etc",
    "notable_objects_positions": [{ "object": "...", "position": "..." }]
  }` : 'null'}
}`;
}

function validateAndFixResponse(rawResponse: string, preserveLayout: boolean): ImageToPromptResponse {
  let parsed: unknown;
  
  try {
    const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
  
  const result = ImageToPromptResponseSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Schema validation errors:', result.error.issues);
    throw new Error('AI response did not match expected schema');
  }
  
  const data = result.data;
  
  const simplifiedVariant = data.variants.find(v => v.id === 'simplified');
  if (simplifiedVariant) {
    simplifiedVariant.prompt = enforceSimplifiedCharLimit(simplifiedVariant.prompt, 240);
  }
  
  if (!preserveLayout && data.layout_map !== null) {
    data.layout_map = null;
  }
  
  return data;
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
    const preserveLayout = formData.get('preserveLayout') === 'true';
    const keepTextExact = formData.get('keepTextExact') === 'true';
    const subjectLock = formData.get('subjectLock') === 'true';
    const styleShift = (formData.get('styleShift') as string) || 'None';
    const preset = (formData.get('preset') as string) || 'none';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const base64Image = await processAndDownscaleImage(file);

    const options: GenerateRequest = {
      preserveLayout,
      keepTextExact,
      subjectLock,
      styleShift: styleShift as GenerateRequest['styleShift'],
      preset: preset as GenerateRequest['preset']
    };

    const systemPrompt = buildSystemPrompt(options);

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
              text: 'Analyze this image and generate the prompts as specified. Respond with valid JSON only.'
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const result = validateAndFixResponse(content, preserveLayout);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image to prompt error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
