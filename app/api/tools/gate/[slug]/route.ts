import { NextResponse } from "next/server";
import { getServerGate } from "@/lib/entitlements/getServerGate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { gate, dbTool, isLoggedIn } = await getServerGate({ slug });

    return NextResponse.json(
      {
        gate,
        allowed: gate.allowed,
        isLoggedIn,
        tool: dbTool
          ? {
              slug: dbTool.slug,
              name: dbTool.name,
              description: dbTool.description,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[API] tools gate error:", error);
    return NextResponse.json(
      {
        allowed: true,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  }
}
