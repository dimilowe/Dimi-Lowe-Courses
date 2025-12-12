import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to view price history.', loginRequired: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    const itemCheck = await query(
      'SELECT id FROM shopping_items WHERE id = $1 AND user_id = $2',
      [itemId, user.id]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const result = await query(
      `SELECT price, currency, snapshot_at
       FROM shopping_price_snapshots
       WHERE item_id = $1
       ORDER BY snapshot_at ASC`,
      [itemId]
    );

    const snapshots = result.rows.map(row => ({
      price: parseFloat(row.price),
      currency: row.currency,
      snapshotAt: row.snapshot_at,
    }));

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('Price history error:', error);
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
  }
}
