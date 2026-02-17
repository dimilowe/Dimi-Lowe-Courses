import { NextRequest, NextResponse } from 'next/server';
import { recordApiInvocation, recordOrganicVisit } from '@/lib/ops/metrics';

const ORGANIC_REFERRER_RE =
  /(google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|baidu\.|yandex\.)/i;

function isOrganicPageView(event: string, properties: Record<string, unknown>): boolean {
  if (event !== 'page_view') return false;

  const explicitOrganic = properties.isOrganic;
  if (typeof explicitOrganic === 'boolean') return explicitOrganic;

  const utmMedium = properties.utm_medium;
  if (typeof utmMedium === 'string' && utmMedium.toLowerCase() === 'organic') {
    return true;
  }

  const referrer = properties.referrer;
  if (typeof referrer === 'string' && ORGANIC_REFERRER_RE.test(referrer)) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    recordApiInvocation('/api/analytics/track');
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event name required' }, { status: 400 });
    }

    const props = (properties || {}) as Record<string, unknown>;
    if (isOrganicPageView(event, props)) {
      recordOrganicVisit();
    }

    console.log(`[Analytics] ${event}:`, JSON.stringify(props));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
