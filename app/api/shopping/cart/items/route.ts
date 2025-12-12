import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { userSessionOptions, UserSessionData } from '@/lib/user-session';
import { resolveUserTier } from '@/lib/pricing/getUserTier';
import { getShoppingCartLimit, getNextUpgradeTier } from '@/lib/limits/shopping-limits';

const ANON_SESSION_COOKIE = 'vcm_anon_session';

async function getOrCreateAnonSession(): Promise<string> {
  const cookieStore = await cookies();
  let anonSessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value;
  
  if (!anonSessionId) {
    anonSessionId = crypto.randomUUID();
  }
  
  return anonSessionId;
}

async function getOrCreateCart(userId: number | null, anonSessionId: string | null): Promise<number> {
  let cartResult;
  
  if (userId) {
    cartResult = await query(
      'SELECT id FROM saved_carts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (cartResult.rows.length === 0) {
      cartResult = await query(
        'INSERT INTO saved_carts (user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, 'My Shopping Cart']
      );
    }
  } else if (anonSessionId) {
    cartResult = await query(
      'SELECT id FROM saved_carts WHERE anon_session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [anonSessionId]
    );
    
    if (cartResult.rows.length === 0) {
      cartResult = await query(
        'INSERT INTO saved_carts (anon_session_id, title) VALUES ($1, $2) RETURNING id',
        [anonSessionId, 'My Shopping Cart']
      );
    }
  } else {
    throw new Error('No user or anon session');
  }
  
  return cartResult.rows[0].id;
}

async function countUserSaves(userId: number | null, anonSessionId: string | null): Promise<number> {
  let result;
  
  if (userId) {
    result = await query(
      `SELECT COUNT(*) as count FROM saved_items si 
       JOIN saved_carts sc ON si.cart_id = sc.id 
       WHERE sc.user_id = $1`,
      [userId]
    );
  } else if (anonSessionId) {
    result = await query(
      `SELECT COUNT(*) as count FROM saved_items si 
       JOIN saved_carts sc ON si.cart_id = sc.id 
       WHERE sc.anon_session_id = $1`,
      [anonSessionId]
    );
  } else {
    return 0;
  }
  
  return parseInt(result.rows[0].count, 10);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const anonSessionId = await getOrCreateAnonSession();
    
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
    
    let items;
    if (userId) {
      items = await query(
        `SELECT si.* FROM saved_items si 
         JOIN saved_carts sc ON si.cart_id = sc.id 
         WHERE sc.user_id = $1 
         ORDER BY si.created_at DESC`,
        [userId]
      );
    } else {
      items = await query(
        `SELECT si.* FROM saved_items si 
         JOIN saved_carts sc ON si.cart_id = sc.id 
         WHERE sc.anon_session_id = $1 
         ORDER BY si.created_at DESC`,
        [anonSessionId]
      );
    }
    
    const tier = resolveUserTier(user);
    const limit = getShoppingCartLimit(tier);
    
    const response = NextResponse.json({
      items: items.rows.map(item => ({
        id: item.id.toString(),
        url: item.url,
        title: item.title || 'Untitled Product',
        image: item.image_url || '',
        description: item.description || '',
        price: item.price_cents ? `$${(item.price_cents / 100).toFixed(2)}` : '',
        notes: item.note || '',
        tags: item.tags || [],
        savedAt: item.created_at?.toISOString() || new Date().toISOString(),
        domain: item.domain || '',
      })),
      usage: {
        used: items.rows.length,
        limit: limit === Infinity ? null : limit,
        tier,
      }
    });
    
    if (!session.isLoggedIn) {
      response.cookies.set(ANON_SESSION_COOKIE, anonSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const anonSessionId = await getOrCreateAnonSession();
    
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
    
    const tier = resolveUserTier(user);
    const limit = getShoppingCartLimit(tier);
    const currentCount = await countUserSaves(userId, anonSessionId);
    
    if (currentCount >= limit) {
      const requiredTier = getNextUpgradeTier(tier);
      return NextResponse.json({
        locked: true,
        reason: 'save_limit_reached',
        requiredTier,
        message: `You've reached your save limit of ${limit} items. Upgrade to save more.`,
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { url, title, image, description, price, notes, tags, domain } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    const cartId = await getOrCreateCart(userId, anonSessionId);
    
    let priceCents = null;
    if (price) {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericPrice)) {
        priceCents = Math.round(numericPrice * 100);
      }
    }
    
    const result = await query(
      `INSERT INTO saved_items (cart_id, url, domain, title, description, image_url, price_cents, note, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [cartId, url, domain || null, title || null, description || null, image || null, priceCents, notes || null, JSON.stringify(tags || [])]
    );
    
    const item = result.rows[0];
    
    const response = NextResponse.json({
      item: {
        id: item.id.toString(),
        url: item.url,
        title: item.title || 'Untitled Product',
        image: item.image_url || '',
        description: item.description || '',
        price: item.price_cents ? `$${(item.price_cents / 100).toFixed(2)}` : '',
        notes: item.note || '',
        tags: item.tags || [],
        savedAt: item.created_at?.toISOString() || new Date().toISOString(),
        domain: item.domain || '',
      },
      usage: {
        used: currentCount + 1,
        limit: limit === Infinity ? null : limit,
        tier,
      }
    });
    
    if (!session.isLoggedIn) {
      response.cookies.set(ANON_SESSION_COOKIE, anonSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error saving cart item:', error);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }
}
