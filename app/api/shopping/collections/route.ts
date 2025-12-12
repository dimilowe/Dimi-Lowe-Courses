import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';

export async function GET() {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to view collections.', loginRequired: true },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM shopping_items WHERE collection_id = c.id) as item_count
       FROM shopping_collections c
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    const collections = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      itemCount: parseInt(row.item_count, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Collections list error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
