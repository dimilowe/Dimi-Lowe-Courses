import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to view your items.', loginRequired: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collection_id');
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');

    let sql = `
      SELECT 
        id, collection_id, title, image_url, canonical_url, affiliate_url, 
        store, price_current, price_last, currency, tags, created_at, updated_at
      FROM shopping_items
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [user.id];
    let paramIndex = 2;

    if (collectionId) {
      sql += ` AND collection_id = $${paramIndex}`;
      params.push(collectionId);
      paramIndex++;
    }

    if (q) {
      sql += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (tag) {
      sql += ` AND $${paramIndex} = ANY(tags)`;
      params.push(tag);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    const items = result.rows.map(row => ({
      id: row.id,
      collectionId: row.collection_id,
      title: row.title,
      imageUrl: row.image_url,
      canonicalUrl: row.canonical_url,
      affiliateUrl: row.affiliate_url,
      store: row.store,
      priceCurrent: row.price_current ? parseFloat(row.price_current) : null,
      priceLast: row.price_last ? parseFloat(row.price_last) : null,
      currency: row.currency,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const storeSubtotals: Record<string, { count: number; total: number; currency: string }> = {};
    let globalTotal = 0;

    for (const item of items) {
      if (item.priceCurrent !== null) {
        globalTotal += item.priceCurrent;
        if (!storeSubtotals[item.store]) {
          storeSubtotals[item.store] = { count: 0, total: 0, currency: item.currency };
        }
        storeSubtotals[item.store].count++;
        storeSubtotals[item.store].total += item.priceCurrent;
      }
    }

    return NextResponse.json({
      items,
      summary: {
        itemCount: items.length,
        globalTotal,
        storeSubtotals,
      },
    });
  } catch (error) {
    console.error('Shopping list error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
