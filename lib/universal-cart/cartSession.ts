import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

const ANON_CART_COOKIE = 'vcm_cart_session';

export interface CartSession {
  cartId: number;
  userId: number | null;
  anonSessionId: string | null;
  isOwner: boolean;
}

export async function getOrCreateCartSession(userId: number | null): Promise<CartSession> {
  if (userId) {
    const existingCart = await query(
      `SELECT id FROM saved_carts WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (existingCart.rows.length > 0) {
      return {
        cartId: existingCart.rows[0].id,
        userId,
        anonSessionId: null,
        isOwner: true,
      };
    }

    const newCart = await query(
      `INSERT INTO saved_carts (user_id, title) VALUES ($1, $2) RETURNING id`,
      [userId, 'My Shopping Cart']
    );

    return {
      cartId: newCart.rows[0].id,
      userId,
      anonSessionId: null,
      isOwner: true,
    };
  }

  const cookieStore = await cookies();
  let anonSessionId = cookieStore.get(ANON_CART_COOKIE)?.value;

  if (anonSessionId) {
    const existingCart = await query(
      `SELECT id FROM saved_carts WHERE anon_session_id = $1 AND user_id IS NULL LIMIT 1`,
      [anonSessionId]
    );

    if (existingCart.rows.length > 0) {
      return {
        cartId: existingCart.rows[0].id,
        userId: null,
        anonSessionId,
        isOwner: true,
      };
    }
  }

  anonSessionId = uuidv4();

  const newCart = await query(
    `INSERT INTO saved_carts (anon_session_id, title) VALUES ($1, $2) RETURNING id`,
    [anonSessionId, 'My Shopping Cart']
  );

  return {
    cartId: newCart.rows[0].id,
    userId: null,
    anonSessionId,
    isOwner: true,
  };
}

export async function mergeAnonCartToUser(anonSessionId: string, userId: number): Promise<void> {
  const anonCart = await query(
    `SELECT id FROM saved_carts WHERE anon_session_id = $1 AND user_id IS NULL LIMIT 1`,
    [anonSessionId]
  );

  if (anonCart.rows.length === 0) {
    return;
  }

  const anonCartId = anonCart.rows[0].id;

  const userCart = await query(
    `SELECT id FROM saved_carts WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (userCart.rows.length > 0) {
    const userCartId = userCart.rows[0].id;

    await query(
      `UPDATE saved_items SET cart_id = $1, updated_at = NOW() WHERE cart_id = $2`,
      [userCartId, anonCartId]
    );

    await query(`DELETE FROM saved_carts WHERE id = $1`, [anonCartId]);
  } else {
    await query(
      `UPDATE saved_carts SET user_id = $1, anon_session_id = NULL, updated_at = NOW() WHERE id = $2`,
      [userId, anonCartId]
    );
  }
}

export async function getCartItemCount(cartId: number): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int as count FROM saved_items WHERE cart_id = $1`,
    [cartId]
  );
  return result.rows[0]?.count || 0;
}
