import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to delete items.', loginRequired: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM shopping_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Shopping delete error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
