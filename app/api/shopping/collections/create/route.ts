import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';
import { getEntitlementsForTier } from '@/lib/pricing/cloudEntitlements';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to create collections.', loginRequired: true },
        { status: 401 }
      );
    }

    const entitlements = getEntitlementsForTier(user.subscription_tier);
    const { maxCollections } = entitlements.shopping;

    const countResult = await query(
      'SELECT COUNT(*) as count FROM shopping_collections WHERE user_id = $1',
      [user.id]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount >= maxCollections) {
      return NextResponse.json(
        {
          error: `You've reached your limit of ${maxCollections} collection${maxCollections === 1 ? '' : 's'}. Upgrade to create more.`,
          upgradeRequired: true,
          requiredTier: 'starter',
          feature: 'shoppingCollections',
          currentLimit: maxCollections,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO shopping_collections (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, name.trim(), description || null]
    );

    const collection = result.rows[0];

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        createdAt: collection.created_at,
        updatedAt: collection.updated_at,
      },
    });
  } catch (error) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
