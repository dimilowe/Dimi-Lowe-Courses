import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI();

const VARIATION_HINTS = [
  "Variation A: dramatic close-up shot, single focal subject filling most of the frame",
  "Variation B: split-screen or side-by-side comparison layout",
  "Variation C: bold large text overlay as the main focus",
  "Variation D: clean minimalist design with lots of negative space",
];

interface GenerateRequest {
  videoTitle: string;
  topic?: string;
  hookAngle?: string;
  textOverlay?: string;
  styleRef?: string;
  count?: number;
  variantHint?: string;
}

async function generateSingleImage(
  prompt: string,
  retries: number = 1
): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        response_format: "b64_json",
        quality: "standard",
      });

      const imageData = response.data?.[0];
      if (imageData?.b64_json) {
        return imageData.b64_json;
      }
      return null;
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      if ((status === 429 || status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      console.error(`Image generation failed (attempt ${attempt + 1}):`, error);
      if (attempt === retries) {
        return null;
      }
    }
  }
  return null;
}

async function resizeTo1280x720(base64Input: string): Promise<string> {
  const inputBuffer = Buffer.from(base64Input, "base64");

  const outputBuffer = await sharp(inputBuffer)
    .resize(1280, 720, {
      fit: "cover",
      position: "centre",
    })
    .png({
      compressionLevel: 6,
    })
    .toBuffer();

  return outputBuffer.toString("base64");
}

function buildPrompt(
  videoTitle: string,
  topic: string | undefined,
  hookAngle: string | undefined,
  textOverlay: string | undefined,
  styleRef: string | undefined,
  variationHint: string
): string {
  const hookDescriptions: Record<string, string> = {
    curiosity: "intriguing and mysterious atmosphere that makes viewers wonder what happens",
    shock: "surprising, dramatic, unexpected visual that grabs attention",
    authority: "professional, expert, educational feel with clean presentation",
    comparison: "clear side-by-side or before/after comparison layout",
    tutorial: "step-by-step instructional look with clear visual hierarchy",
  };

  const hookDesc = hookDescriptions[hookAngle || "curiosity"] || hookDescriptions.curiosity;

  let prompt = `16:9 YouTube thumbnail design for a video titled "${videoTitle}". `;
  prompt += `${hookDesc}. `;
  prompt += `${variationHint}. `;

  if (topic) {
    prompt += `Topic: ${topic}. `;
  }

  if (textOverlay) {
    prompt += `Include bold, large, readable text overlay saying exactly: "${textOverlay}". `;
  }

  if (styleRef) {
    prompt += `Visual style: ${styleRef}. `;
  }

  prompt += `Requirements: high contrast colors, single clear focal subject, clean uncluttered background, readable at small sizes, mobile-optimized. `;
  prompt += `Absolutely no watermarks, no logos, no garbled text artifacts, no extra text besides the overlay.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { videoTitle, topic, hookAngle, textOverlay, styleRef, count = 4, variantHint } = body;

    if (!videoTitle || typeof videoTitle !== "string" || !videoTitle.trim()) {
      return NextResponse.json(
        { error: "Video title is required" },
        { status: 400 }
      );
    }

    if (textOverlay) {
      const wordCount = textOverlay.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 5) {
        return NextResponse.json(
          { error: "Text overlay must be 5 words or less for readable thumbnails" },
          { status: 400 }
        );
      }
    }

    const validCount = [1, 2, 4].includes(count) ? count : 4;

    let hintsToUse: string[];
    if (variantHint) {
      hintsToUse = [variantHint];
    } else {
      hintsToUse = VARIATION_HINTS.slice(0, validCount);
    }

    const prompts = hintsToUse.map((hint) =>
      buildPrompt(videoTitle.trim(), topic, hookAngle, textOverlay, styleRef, hint)
    );

    const generatePromises = prompts.map((prompt, index) =>
      generateSingleImage(prompt).then((base64) => ({
        index,
        base64,
        hint: hintsToUse[index],
      }))
    );

    const results = await Promise.all(generatePromises);

    const successfulImages: { id: string; pngBase64: string; variationHint: string }[] = [];
    let warning: string | undefined;

    for (const result of results) {
      if (result.base64) {
        try {
          const resizedBase64 = await resizeTo1280x720(result.base64);
          successfulImages.push({
            id: `img_${result.index + 1}_${Date.now()}`,
            pngBase64: resizedBase64,
            variationHint: result.hint,
          });
        } catch (resizeErr) {
          console.error("Resize error:", resizeErr);
        }
      }
    }

    if (successfulImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images. Please try again." },
        { status: 500 }
      );
    }

    if (successfulImages.length < validCount) {
      warning = `Generated ${successfulImages.length} of ${validCount} requested images. Some failed - you can regenerate missing variations.`;
    }

    return NextResponse.json({
      promptUsed: prompts[0],
      images: successfulImages,
      warning,
    });
  } catch (error: any) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnails. Please try again." },
      { status: 500 }
    );
  }
}
