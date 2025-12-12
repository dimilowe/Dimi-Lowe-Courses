import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

function clampScore(value: unknown, fallback: number = 50): number {
  if (typeof value === "number" && !isNaN(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return fallback;
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("thumbnail") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No thumbnail file provided" },
        { status: 400 }
      );
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const openai = new OpenAI();

    const systemPrompt = `You are an expert YouTube thumbnail performance analyst. The user will send you one thumbnail image. Return JSON ONLY, no extra text, no markdown code blocks. The JSON must have:
- scores: { clarity, intrigue, emotion, contrast, readability, composition } (all integers 0-100)
- overallVerdict: short human-readable summary (1-2 sentences)
- whatsWorking: array of 2-4 bullet points describing strengths
- whatToImprove: array of 2-4 bullet points describing weaknesses
- suggestions: array of 3-5 concrete, actionable improvement ideas

Assume the thumbnail will be viewed mostly on mobile YouTube. Focus on CTR potential.

Scoring guidelines:
- clarity: Is the main subject/message instantly clear? Can you understand it in 1 second?
- intrigue: Does it make viewers curious? Would they want to click to find out more?
- emotion: Does it convey emotion through facial expressions, colors, or energy?
- contrast: Is there good visual separation between elements? Does it pop?
- readability: If there's text, is it easily readable at small sizes?
- composition: Is the layout balanced? Are elements placed effectively?

Be honest but constructive. If something is truly bad, say so clearly while offering solutions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this YouTube thumbnail and return the JSON analysis.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    let cleanedText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let analysis: any;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        { error: "Failed to analyze thumbnail. The AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    if (!analysis || typeof analysis !== "object") {
      console.error("Invalid analysis object:", analysis);
      return NextResponse.json(
        { error: "Invalid analysis format. Please try again." },
        { status: 500 }
      );
    }

    if (!analysis.scores || typeof analysis.scores !== "object") {
      console.error("Missing scores in analysis:", analysis);
      return NextResponse.json(
        { error: "Analysis is missing score data. Please try again." },
        { status: 500 }
      );
    }

    if (!analysis.overallVerdict || typeof analysis.overallVerdict !== "string") {
      console.error("Missing overallVerdict in analysis:", analysis);
      return NextResponse.json(
        { error: "Analysis is missing verdict. Please try again." },
        { status: 500 }
      );
    }

    const validatedAnalysis = {
      scores: {
        clarity: clampScore(analysis.scores.clarity),
        intrigue: clampScore(analysis.scores.intrigue),
        emotion: clampScore(analysis.scores.emotion),
        contrast: clampScore(analysis.scores.contrast),
        readability: clampScore(analysis.scores.readability),
        composition: clampScore(analysis.scores.composition),
      },
      overallVerdict: String(analysis.overallVerdict),
      whatsWorking: ensureStringArray(analysis.whatsWorking),
      whatToImprove: ensureStringArray(analysis.whatToImprove),
      suggestions: ensureStringArray(analysis.suggestions),
    };

    return NextResponse.json({
      success: true,
      analysis: validatedAnalysis,
    });
  } catch (error: any) {
    console.error("Thumbnail analysis error:", error);
    return NextResponse.json(
      { error: "Something went wrong analyzing your thumbnail. Please try again." },
      { status: 500 }
    );
  }
}
