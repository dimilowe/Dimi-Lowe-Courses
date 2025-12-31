import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';
import { createRequest } from '@/lib/brandAccess/db';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function getRateLimitInfo(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = getRateLimitInfo(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      requested_brand_name, 
      requested_website_url, 
      request_reason, 
      user_email 
    } = body;

    if (!requested_brand_name || typeof requested_brand_name !== 'string') {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    if (requested_brand_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Brand name cannot be empty' },
        { status: 400 }
      );
    }

    if (requested_brand_name.length > 200) {
      return NextResponse.json(
        { error: 'Brand name is too long (max 200 characters)' },
        { status: 400 }
      );
    }

    if (requested_website_url && requested_website_url.length > 500) {
      return NextResponse.json(
        { error: 'Website URL is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    if (request_reason && request_reason.length > 1000) {
      return NextResponse.json(
        { error: 'Reason is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    if (user_email && user_email.length > 255) {
      return NextResponse.json(
        { error: 'Email is too long (max 255 characters)' },
        { status: 400 }
      );
    }

    const user = await getCurrentUserWithTier();
    const userId = user ? parseInt(user.id, 10) : undefined;

    await createRequest({
      requested_brand_name,
      requested_website_url,
      request_reason,
      user_email,
      user_id: userId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Brand Access request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
