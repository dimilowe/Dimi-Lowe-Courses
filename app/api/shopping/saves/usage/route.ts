import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { userSessionOptions, UserSessionData } from '@/lib/user-session';
import { resolveUserTier } from '@/lib/pricing/getUserTier';
import { getShoppingCartLimit } from '@/lib/limits/shopping-limits';

const ANON_SESSION_COOKIE = 'vcm_anon_session';

export async function GET() {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const cookieStore = await cookies();
    const anonSessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value;
    
    let userId: number | null = null;
    let user = null;
    
    if (session.isLoggedIn && session.userId) {
      const userResult = await query(
        'SELECT id, subscription_tier FROM users WHERE id = $1',
        [session.userId]
      );
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        user = userResult.rows[0];
      }
    }
    
    let countResult;
    if (userId) {
      countResult = await query(
        `SELECT COUNT(*) as count FROM saved_items si 
         JOIN saved_carts sc ON si.cart_id = sc.id 
         WHERE sc.user_id = $1`,
        [userId]
      );
    } else if (anonSessionId) {
      countResult = await query(
        `SELECT COUNT(*) as count FROM saved_items si 
         JOIN saved_carts sc ON si.cart_id = sc.id 
         WHERE sc.anon_session_id = $1`,
        [anonSessionId]
      );
    } else {
      countResult = { rows: [{ count: '0' }] };
    }
    
    const tier = resolveUserTier(user);
    const limit = getShoppingCartLimit(tier);
    const used = parseInt(countResult.rows[0].count, 10);
    
    return NextResponse.json({
      used,
      limit: limit === Infinity ? null : limit,
      tier,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
