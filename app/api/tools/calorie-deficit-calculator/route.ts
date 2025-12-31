import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { gateToolForRequest } from '@/lib/entitlements/withToolGate';

const TOOL_SLUG = 'calorie-deficit-calculator';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
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

const FOOD_PROMPT = `You are a nutrition assistant. Look at this photo of a meal and estimate the total calories.
Return a strict JSON object with this shape and nothing else:
{
  "estimatedCalories": number,
  "confidence": number,
  "description": string,
  "items": [
    { "name": string, "estimatedCalories": number }
  ]
}

Rules:
- estimatedCalories must be an integer for the whole meal
- confidence is a number between 0 and 1 representing how confident you are
- description is 1 short sentence describing the meal
- items is a list of recognizable food components with individual calorie estimates
- Be realistic with portions - consider typical serving sizes
- If you can't identify the food clearly, set confidence low`;

const HEALTH_PROMPT = `You are reading an iPhone Health app, fitness tracker, or similar calorie tracking screenshot.
Extract the total calories burned today if visible (look for 'Active calories', 'Active Energy', 'Calories burned', 'Total calories', or similar metrics).

Return strict JSON only in this shape:
{
  "activeCalories": number | null,
  "totalCalories": number | null,
  "note": string
}

Rules:
- activeCalories: The "Active Calories" or "Active Energy" value if visible (exercise/movement calories)
- totalCalories: The "Total Calories" value if visible (includes BMR + active)
- If you cannot reliably find a value, set it to null
- note: Brief explanation of what you found or why values are null
- Numbers should be integers
- Look for kcal, cal, or calorie values`;

interface FoodItem {
  name: string;
  estimatedCalories: number;
}

interface FoodAnalysis {
  estimatedCalories: number;
  confidence: number;
  description: string;
  items: FoodItem[];
}

interface HealthAnalysis {
  activeCalories: number | null;
  totalCalories: number | null;
  note: string;
}

async function analyzeFood(openai: OpenAI, base64Image: string, mimeType: string): Promise<FoodAnalysis> {
  const dataUrl = `data:${mimeType};base64,${base64Image}`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
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
            text: FOOD_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from food analysis');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse food analysis response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  const estimatedCalories = typeof parsed.estimatedCalories === 'number' 
    ? Math.round(parsed.estimatedCalories)
    : parseInt(String(parsed.estimatedCalories), 10) || 0;
  
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : parseFloat(String(parsed.confidence)) || 0.5;
  
  const items = Array.isArray(parsed.items) 
    ? parsed.items.map((item: { name?: string; estimatedCalories?: number | string }) => ({
        name: String(item.name || 'Unknown item'),
        estimatedCalories: typeof item.estimatedCalories === 'number' 
          ? Math.round(item.estimatedCalories)
          : parseInt(String(item.estimatedCalories), 10) || 0
      }))
    : [];
  
  return {
    estimatedCalories,
    confidence,
    description: String(parsed.description || 'Meal analyzed'),
    items,
  };
}

async function analyzeHealth(openai: OpenAI, base64Image: string, mimeType: string): Promise<HealthAnalysis> {
  const dataUrl = `data:${mimeType};base64,${base64Image}`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
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
            text: HEALTH_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { activeCalories: null, totalCalories: null, note: 'Could not analyze screenshot' };
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { activeCalories: null, totalCalories: null, note: 'Could not parse screenshot data' };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    const parseCalories = (val: unknown): number | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number' && !isNaN(val)) return Math.round(val);
      const num = parseInt(String(val), 10);
      return isNaN(num) ? null : num;
    };
    
    return {
      activeCalories: parseCalories(parsed.activeCalories),
      totalCalories: parseCalories(parsed.totalCalories),
      note: String(parsed.note || 'Health data extracted'),
    };
  } catch {
    return { activeCalories: null, totalCalories: null, note: 'Failed to parse health data' };
  }
}

function calculateDeficit(foodCalories: number, health?: HealthAnalysis) {
  const burnedCalories = health?.activeCalories ?? health?.totalCalories ?? null;
  
  if (burnedCalories === null) {
    return {
      netCalories: -foodCalories,
      status: 'unknown' as const,
      dailyMessage: `This meal contains approximately ${foodCalories} calories. Upload a Health app screenshot to calculate your deficit or surplus.`,
      weeklyProjection: undefined,
    };
  }

  const net = burnedCalories - foodCalories;
  let status: 'deficit' | 'surplus' | 'even';
  
  if (net > 50) {
    status = 'deficit';
  } else if (net < -50) {
    status = 'surplus';
  } else {
    status = 'even';
  }

  const weeklyNet = net * 7;
  const changeKg = weeklyNet / 7700;
  const changeLbs = weeklyNet / 3500;

  let dailyMessage: string;
  if (status === 'deficit') {
    dailyMessage = `Based on this meal and your calories burned (${burnedCalories} kcal), you're in a ${Math.abs(net)} calorie deficit today.`;
  } else if (status === 'surplus') {
    dailyMessage = `Based on this meal and your calories burned (${burnedCalories} kcal), you're in a ${Math.abs(net)} calorie surplus today.`;
  } else {
    dailyMessage = `Based on this meal and your calories burned (${burnedCalories} kcal), you're roughly at caloric balance today.`;
  }

  let projectionMessage: string;
  if (status === 'deficit') {
    projectionMessage = `If you maintained this exact pattern daily, you'd lose about ${Math.abs(changeLbs).toFixed(2)} lbs per week.`;
  } else if (status === 'surplus') {
    projectionMessage = `If you repeated this exact pattern daily, you'd gain about ${Math.abs(changeLbs).toFixed(2)} lbs per week.`;
  } else {
    projectionMessage = `At this rate, your weight would remain stable.`;
  }

  return {
    netCalories: net,
    status,
    dailyMessage,
    weeklyProjection: {
      netCalories: weeklyNet,
      changeKg: parseFloat(changeKg.toFixed(2)),
      changeLbs: parseFloat(changeLbs.toFixed(2)),
      projectionMessage,
    },
  };
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
    const foodFile = formData.get('foodImage') as File | null;
    const healthFile = formData.get('healthScreenshot') as File | null;
    
    if (!foodFile) {
      return NextResponse.json({ error: 'Food image is required' }, { status: 400 });
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];
    if (!validTypes.includes(foodFile.type)) {
      return NextResponse.json({ error: 'Invalid food image type. Use JPG, PNG, or WebP.' }, { status: 400 });
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (foodFile.size > maxSize) {
      return NextResponse.json({ error: 'Food image must be less than 5MB' }, { status: 400 });
    }
    
    if (healthFile) {
      if (!validTypes.includes(healthFile.type)) {
        return NextResponse.json({ error: 'Invalid health screenshot type. Use JPG, PNG, or WebP.' }, { status: 400 });
      }
      if (healthFile.size > maxSize) {
        return NextResponse.json({ error: 'Health screenshot must be less than 5MB' }, { status: 400 });
      }
    }
    
    const openai = new OpenAI();
    
    const foodBytes = await foodFile.arrayBuffer();
    const foodBuffer = Buffer.from(foodBytes);
    const foodBase64 = foodBuffer.toString('base64');
    
    const foodAnalysis = await analyzeFood(openai, foodBase64, foodFile.type);
    
    let healthAnalysis: HealthAnalysis | undefined;
    if (healthFile) {
      const healthBytes = await healthFile.arrayBuffer();
      const healthBuffer = Buffer.from(healthBytes);
      const healthBase64 = healthBuffer.toString('base64');
      healthAnalysis = await analyzeHealth(openai, healthBase64, healthFile.type);
    }
    
    const summary = calculateDeficit(foodAnalysis.estimatedCalories, healthAnalysis);
    
    return NextResponse.json({
      food: foodAnalysis,
      health: healthAnalysis,
      summary,
    });
    
  } catch (error) {
    console.error('Calorie calculator error:', error);
    
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
      { error: 'Failed to analyze images. Please try again.' },
      { status: 502 }
    );
  }
}
