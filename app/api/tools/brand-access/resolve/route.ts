import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { resolveContactPage } from '@/lib/brandAccess/resolver';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(ip, 'brand-access-resolve');
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Try again later.',
          resetIn: Math.ceil(rateLimit.resetIn / 1000 / 60) 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + rateLimit.resetIn / 1000))
          }
        }
      );
    }

    const body = await request.json();
    const { brand_name, website_url, email } = body;

    if (!website_url && !email) {
      return NextResponse.json(
        { error: 'Either website_url or email is required' },
        { status: 400 }
      );
    }

    if (website_url) {
      if (typeof website_url !== 'string' || website_url.length > 500) {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        );
      }
      if (!website_url.match(/^https?:\/\/.+/i) && !website_url.match(/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        return NextResponse.json(
          { error: 'Invalid website URL format' },
          { status: 400 }
        );
      }
    }

    if (email) {
      if (typeof email !== 'string' || email.length > 255) {
        return NextResponse.json(
          { error: 'Invalid email' },
          { status: 400 }
        );
      }
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const result = await resolveContactPage({
      website_url: website_url || undefined,
      email: email || undefined
    });

    return NextResponse.json({
      website_url: result.website_url,
      contact_url: result.contact_url,
      confidence: result.confidence,
      method: result.method
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      }
    });
  } catch (error) {
    console.error('Brand Access resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve contact page' },
      { status: 500 }
    );
  }
}
