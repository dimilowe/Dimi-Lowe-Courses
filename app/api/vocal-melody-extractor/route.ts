import { NextResponse } from "next/server";

export const runtime = "nodejs";

function goneJson() {
  return NextResponse.json(
    { error: "This tool has been discontinued." },
    {
      status: 410,
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    }
  );
}

function goneHead() {
  return new NextResponse(null, {
    status: 410,
    headers: {
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function GET() {
  return goneJson();
}

export async function POST() {
  return goneJson();
}

export async function PUT() {
  return goneJson();
}

export async function PATCH() {
  return goneJson();
}

export async function DELETE() {
  return goneJson();
}

export async function OPTIONS() {
  return goneHead();
}

export async function HEAD() {
  return goneHead();
}
