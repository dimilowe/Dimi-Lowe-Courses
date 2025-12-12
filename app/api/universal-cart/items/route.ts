import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { query } from '@/lib/db';
import { getOrCreateCartSession, getCartItemCount } from '@/lib/universal-cart/cartSession';
import { fetchOpenGraph } from '@/lib/universal-cart/fetchOpenGraph';
import { getCloudEntitlementsForUser } from '@/lib/cloudEntitlements';
import { getToolUsageLimits } from '@/lib/limits/toolUsageLimits';

const ANON_CART_COOKIE = 'vcm_cart_session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, note, tags, priceCents, currency } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    const cartSession = await getOrCreateCartSession(userId);
    const currentCount = await getCartItemCount(cartSession.cartId);

    let entitlements: any[] = [];
    if (userId) {
      entitlements = await getCloudEntitlementsForUser(userId);
    }

    const limits = getToolUsageLimits({
      toolSlug: 'universal-shopping-cart',
      cloudEntitlements: entitlements,
    });

    const maxSavedItems = limits.maxSavedItems;

    if (maxSavedItems !== null && maxSavedItems !== undefined && currentCount >= maxSavedItems) {
      return NextResponse.json({
        code: 'UPGRADE_REQUIRED',
        reason: 'SAVED_ITEM_LIMIT',
        limit: maxSavedItems,
        current: currentCount,
        upgradeTarget: 'shopping-cloud-starter',
      }, { status: 402 });
    }

    const ogData = await fetchOpenGraph(url);

    const result = await query(
      `INSERT INTO saved_items 
       (cart_id, url, domain, title, description, image_url, price_cents, currency, note, tags, og_raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, url, domain, title, description, image_url, price_cents, currency, note, tags, created_at, updated_at`,
      [
        cartSession.cartId,
        url,
        ogData.domain || null,
        ogData.title || null,
        ogData.description || null,
        ogData.image || null,
        priceCents || null,
        currency || 'USD',
        note || null,
        JSON.stringify(tags || []),
        JSON.stringify(ogData.raw || {}),
      ]
    );

    await query(
      `UPDATE saved_carts SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [cartSession.cartId]
    );

    const item = result.rows[0];

    const response = NextResponse.json({
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

    if (cartSession.anonSessionId) {
      response.cookies.set(ANON_CART_COOKIE, cartSession.anonSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('[universal-cart/items POST] Error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
