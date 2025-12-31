import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';
import { getCloudEntitlementsForUser, hasAccess } from '@/lib/cloudEntitlements';
import { listEntries, getTotalCount } from '@/lib/brandAccess/db';
import type { ContactType } from '@/lib/brandAccess/types';

const VALID_CONTACT_TYPES: ContactType[] = [
  'brand', 'agency', 'casting', 'partnerships', 
  'press', 'support', 'affiliate', 'influencer'
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;
    const type = searchParams.get('type') as ContactType | null;
    const tag = searchParams.get('tag') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (type && !VALID_CONTACT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contact type' },
        { status: 400 }
      );
    }

    const user = await getCurrentUserWithTier();
    let isPro = false;

    if (user) {
      const entitlements = await getCloudEntitlementsForUser(parseInt(user.id, 10));
      isPro = hasAccess(entitlements, 'intelligence', 'pro');
    }

    const entries = await listEntries(
      { q, type: type || undefined, tag, limit },
      isPro
    );

    const totalCount = await getTotalCount();

    return NextResponse.json({
      entries,
      totalCount,
      isPro,
      previewMode: !isPro
    });
  } catch (error) {
    console.error('Brand Access list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}
