import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { query } from '@/lib/db';
import { getOrCreateCartSession } from '@/lib/universal-cart/cartSession';
import { getCloudEntitlementsForUser, hasAccess } from '@/lib/cloudEntitlements';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    if (!userId) {
      return NextResponse.json({
        code: 'UPGRADE_REQUIRED',
        reason: 'LOGIN_REQUIRED',
        message: 'Please log in to share your cart',
      }, { status: 401 });
    }

    const entitlements = await getCloudEntitlementsForUser(userId);
    const hasShoppingAccess = hasAccess(entitlements, 'shopping', 'basic');

    if (!hasShoppingAccess) {
      return NextResponse.json({
        code: 'UPGRADE_REQUIRED',
        reason: 'SHARING_REQUIRES_SUBSCRIPTION',
        upgradeTarget: 'shopping-cloud-starter',
        message: 'Upgrade to Shopping Cloud Starter to share your cart',
      }, { status: 402 });
    }

    const cartSession = await getOrCreateCartSession(userId);

    const publicToken = uuidv4().replace(/-/g, '').slice(0, 16);

    await query(
      `UPDATE saved_carts SET is_public = TRUE, public_token = $1, updated_at = NOW() WHERE id = $2`,
      [publicToken, cartSession.cartId]
    );

    return NextResponse.json({
      success: true,
      publicToken,
      shareUrl: `/shared/cart/${publicToken}`,
    });
  } catch (error) {
    console.error('[universal-cart/public POST] Error:', error);
    return NextResponse.json({ error: 'Failed to make cart public' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn && session.userId ? parseInt(session.userId, 10) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartSession = await getOrCreateCartSession(userId);

    await query(
      `UPDATE saved_carts SET is_public = FALSE, public_token = NULL, updated_at = NOW() WHERE id = $1`,
      [cartSession.cartId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[universal-cart/public DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to make cart private' }, { status: 500 });
  }
}
