import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { getOrCreateTagVoice } from '@/lib/audio-processor';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { phrase, voiceId } = (await request.json()) as {
      phrase?: string;
      voiceId?: string;
    };

    if (!phrase || !phrase.trim()) {
      return NextResponse.json(
        { error: 'Phrase is required for preview.' },
        { status: 400 }
      );
    }

    if (phrase.length > 100) {
      return NextResponse.json(
        { error: 'Phrase is too long. Maximum 100 characters.' },
        { status: 400 }
      );
    }

    const tagPath = await getOrCreateTagVoice(phrase, voiceId || 'female_soft');
    const audio = await readFile(tagPath);

    return new NextResponse(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Producer tag preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview tag.' },
      { status: 500 }
    );
  }
}
