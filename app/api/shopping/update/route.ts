import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to update items.', loginRequired: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, tags, collectionId, priceCurrent, currency } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const existing = await query(
      'SELECT * FROM shopping_items WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const currentItem = existing.rows[0];
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(tags);
    }

    if (collectionId !== undefined) {
      updates.push(`collection_id = $${paramIndex++}`);
      values.push(collectionId || null);
    }

    if (priceCurrent !== undefined) {
      const oldPrice = currentItem.price_current ? parseFloat(currentItem.price_current) : null;
      if (oldPrice !== priceCurrent) {
        updates.push(`price_last = $${paramIndex++}`);
        values.push(oldPrice);
        updates.push(`price_current = $${paramIndex++}`);
        values.push(priceCurrent);

        if (priceCurrent !== null) {
          await query(
            `INSERT INTO shopping_price_snapshots (item_id, price, currency) VALUES ($1, $2, $3)`,
            [id, priceCurrent, currency || currentItem.currency]
          );
        }
      }
    }

    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(currency);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);
    values.push(user.id);

    const result = await query(
      `UPDATE shopping_items SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      values
    );

    const item = result.rows[0];

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        imageUrl: item.image_url,
        canonicalUrl: item.canonical_url,
        affiliateUrl: item.affiliate_url,
        store: item.store,
        priceCurrent: item.price_current ? parseFloat(item.price_current) : null,
        priceLast: item.price_last ? parseFloat(item.price_last) : null,
        currency: item.currency,
        tags: item.tags,
        collectionId: item.collection_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    console.error('Shopping update error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
