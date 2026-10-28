import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { query } from "@/lib/db";

function getOpenAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

  if (!apiKey || !baseURL) {
    throw new Error("AI Integrations not configured");
  }

  return new OpenAI({
    baseURL,
    apiKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages } = await request.json();

    const openai = getOpenAIClient();

    // Fetch all available products from the store
    const productsResult = await query(
      "SELECT id, slug, name, description, type, price_type, price FROM products WHERE visibility = 'public' ORDER BY created_at DESC"
    );
    const products = productsResult.rows;

    // Create a context about available products
    const productsContext = products
      .map(
        (p: any) =>
          `- ${p.name} (${p.type}): ${p.description || "No description"} | Price: ${
            p.price_type === "free" ? "Free" : `$${(p.price / 100).toFixed(2)}`
          }`
      )
      .join("\n");

    // Build conversation history
    const conversationHistory = messages.slice(-5).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create the AI prompt
    const systemPrompt = `You are a helpful AI assistant for VCM Suite, a product store. Your role is to help visitors discover the perfect subscriptions, courses, apps, downloads, freebies, and other products for their creative business.

AVAILABLE PRODUCTS IN THE STORE:
${productsContext}

GUIDELINES:
1. Be friendly, professional, and enthusiastic about helping creators succeed
2. Ask clarifying questions to understand their needs, goals, and challenges
3. Recommend specific products from the store that match their requirements
4. Explain WHY each recommendation would help them
5. Keep responses concise but helpful (2-4 paragraphs max)
6. If asked about products not in the store, acknowledge this honestly and recommend similar available items
7. Focus on value and outcomes, not just features
8. When recommending products, mention them by name so they can be highlighted

When recommending products, use this format in your response:
"I recommend checking out [Product Name] because..."

Be conversational and strategic - you're a business consultant, not just a product catalog.`;

    // Call OpenAI API (using Replit AI Integrations)
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      max_completion_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Extract product recommendations from the AI response
    const recommendedProducts: any[] = [];

    // Find product names mentioned in the response
    products.forEach((product: any) => {
      const regex = new RegExp(product.name, "gi");
      if (regex.test(aiResponse)) {
        recommendedProducts.push({
          id: product.id,
          name: product.name,
          type: product.type,
          price_type: product.price_type,
          price: product.price,
          slug: product.slug,
        });
      }
    });

    // Limit to top 3 recommendations
    const topRecommendations = recommendedProducts.slice(0, 3);

    return NextResponse.json({
      message: aiResponse,
      products: topRecommendations,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message", details: error.message },
      { status: 500 }
    );
  }
}
