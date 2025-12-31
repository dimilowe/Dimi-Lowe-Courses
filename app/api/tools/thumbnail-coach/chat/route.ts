import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { gateToolForRequest } from '@/lib/entitlements/withToolGate';

const TOOL_SLUG = 'ai-thumbnail-coach';

export const maxDuration = 30;

interface AnalysisResult {
  scores: {
    clarity: number;
    intrigue: number;
    emotion: number;
    contrast: number;
    readability: number;
    composition: number;
  };
  overallVerdict: string;
  whatsWorking: string[];
  whatToImprove: string[];
  suggestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Gate check first
    const gateResult = await gateToolForRequest(TOOL_SLUG);
    if (!gateResult.allowed) {
      return gateResult.response;
    }

    const { messages, analysis } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const openai = new OpenAI();

    const analysisContext = analysis
      ? `
PREVIOUS THUMBNAIL ANALYSIS:
Scores: Clarity ${analysis.scores.clarity}/100, Intrigue ${analysis.scores.intrigue}/100, Emotion ${analysis.scores.emotion}/100, Contrast ${analysis.scores.contrast}/100, Readability ${analysis.scores.readability}/100, Composition ${analysis.scores.composition}/100

Overall: ${analysis.overallVerdict}

Strengths: ${analysis.whatsWorking.join("; ")}

Weaknesses: ${analysis.whatToImprove.join("; ")}

Previous suggestions: ${analysis.suggestions.join("; ")}
`
      : "";

    const systemPrompt = `You are VCM AI Thumbnail Coach, a brutally honest but constructive YouTube thumbnail consultant. You help creators improve CTR by critiquing their thumbnails, titles, and hooks.

${analysisContext}

GUIDELINES:
- Be specific, concrete, and actionable
- Reference the previous analysis when relevant
- Keep answers concise but detailed enough to be useful (2-3 paragraphs max)
- Focus on what will actually improve click-through rate
- Don't repeat general advice - tailor everything to their specific thumbnail
- If they ask about fonts, colors, or design, give specific recommendations
- Be encouraging but honest - sugar-coating doesn't help creators improve
- You can reference YouTube best practices and what top creators do`;

    const chatMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
