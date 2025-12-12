import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { query } from '@/lib/db';
import { getOrCreateCartSession } from '@/lib/universal-cart/cartSession';

const ANON_CART_COOKIE = 'vcm_cart_session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const body = await request.json();
    const { note, tags, priceCents, currency, title } = body;

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    const cartSession = await getOrCreateCartSession(userId);

    const checkItem = await query(
      `SELECT id FROM saved_items WHERE id = $1 AND cart_id = $2`,
      [itemId, cartSession.cartId]
    );

    if (checkItem.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(note);
      paramIndex++;
    }

    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(JSON.stringify(tags));
      paramIndex++;
    }

    if (priceCents !== undefined) {
      updates.push(`price_cents = $${paramIndex}`);
      values.push(priceCents);
      paramIndex++;
    }

    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      values.push(currency);
      paramIndex++;
    }

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');

    values.push(itemId);

    const result = await query(
      `UPDATE saved_items SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, url, domain, title, description, image_url, price_cents, currency, note, tags, created_at, updated_at`,
      values
    );

    const item = result.rows[0];

    return NextResponse.json({
      item: {
        id: item.id,
        url: item.url,
        domain: item.domain,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        priceCents: item.price_cents,
        currency: item.currency,
        note: item.note,
        tags: item.tags || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    console.error('[universal-cart/items PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    const cartSession = await getOrCreateCartSession(userId);

    const result = await query(
      `DELETE FROM saved_items WHERE id = $1 AND cart_id = $2 RETURNING id`,
      [itemId, cartSession.cartId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: itemId });
  } catch (error) {
    console.error('[universal-cart/items DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
