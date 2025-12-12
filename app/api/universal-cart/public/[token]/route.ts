import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 8) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const cartResult = await query(
      `SELECT id, title, is_public, public_token, created_at
       FROM saved_carts WHERE public_token = $1 AND is_public = TRUE`,
      [token]
    );

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cart not found or not public' }, { status: 404 });
    }

    const cart = cartResult.rows[0];

    const itemsResult = await query(
      `SELECT id, url, domain, title, description, image_url, price_cents, currency, note, tags, created_at
       FROM saved_items WHERE cart_id = $1
       ORDER BY created_at DESC`,
      [cart.id]
    );

    return NextResponse.json({
      cart: {
        title: cart.title,
        createdAt: cart.created_at,
      },
      items: itemsResult.rows.map((item: any) => ({
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
      })),
      isOwner: false,
    });
  } catch (error) {
    console.error('[universal-cart/public/token GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load shared cart' }, { status: 500 });
  }
}
