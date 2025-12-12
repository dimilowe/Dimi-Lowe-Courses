import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { query } from '@/lib/db';
import { getOrCreateCartSession, mergeAnonCartToUser } from '@/lib/universal-cart/cartSession';
import { getCloudEntitlementsForUser } from '@/lib/cloudEntitlements';
import { getToolUsageLimits } from '@/lib/limits/toolUsageLimits';

const ANON_CART_COOKIE = 'vcm_cart_session';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    const cookieStore = await cookies();
    const anonSessionId = cookieStore.get(ANON_CART_COOKIE)?.value;

    if (userId && anonSessionId) {
      await mergeAnonCartToUser(anonSessionId, userId);
    }

    const cartSession = await getOrCreateCartSession(userId);

    const cartResult = await query(
      `SELECT id, user_id, title, is_public, public_token, created_at, updated_at
       FROM saved_carts WHERE id = $1`,
      [cartSession.cartId]
    );

    const itemsResult = await query(
      `SELECT id, url, domain, title, description, image_url, price_cents, currency, note, tags, created_at, updated_at
       FROM saved_items WHERE cart_id = $1
       ORDER BY created_at DESC`,
      [cartSession.cartId]
    );

    let maxSavedItems: number | null = null;
    if (userId) {
      const entitlements = await getCloudEntitlementsForUser(userId);
      const limits = getToolUsageLimits({
        toolSlug: 'universal-shopping-cart',
        cloudEntitlements: entitlements,
      });
      maxSavedItems = limits.maxSavedItems ?? null;
    } else {
      const limits = getToolUsageLimits({
        toolSlug: 'universal-shopping-cart',
        cloudEntitlements: [],
      });
      maxSavedItems = limits.maxSavedItems ?? null;
    }

    const cart = cartResult.rows[0];
    const items = itemsResult.rows;

    const response = NextResponse.json({
      cart: {
        id: cart.id,
        title: cart.title,
        isPublic: cart.is_public,
        publicToken: cart.public_token,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at,
      },
      items: items.map((item: any) => ({
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
      })),
      limits: {
        maxSavedItems,
        currentCount: items.length,
      },
      isOwner: true,
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
    console.error('[universal-cart GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
  }
}
