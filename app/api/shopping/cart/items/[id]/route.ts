import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { userSessionOptions, UserSessionData } from '@/lib/user-session';

const ANON_SESSION_COOKIE = 'vcm_anon_session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const cookieStore = await cookies();
    const anonSessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value;
    
    let userId: number | null = null;
    
    if (session.isLoggedIn && session.userId) {
      const userResult = await query(
        'SELECT id FROM users WHERE id = $1',
        [session.userId]
      );
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }
    
    let result;
    if (userId) {
      result = await query(
        `DELETE FROM saved_items si
         USING saved_carts sc
         WHERE si.cart_id = sc.id 
         AND si.id = $1 
         AND sc.user_id = $2
         RETURNING si.id`,
        [id, userId]
      );
    } else if (anonSessionId) {
      result = await query(
        `DELETE FROM saved_items si
         USING saved_carts sc
         WHERE si.cart_id = sc.id 
         AND si.id = $1 
         AND sc.anon_session_id = $2
         RETURNING si.id`,
        [id, anonSessionId]
      );
    } else {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const cookieStore = await cookies();
    const anonSessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value;
    
    let userId: number | null = null;
    
    if (session.isLoggedIn && session.userId) {
      const userResult = await query(
        'SELECT id FROM users WHERE id = $1',
        [session.userId]
      );
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }
    
    const body = await request.json();
    const { title, notes, tags, price, image } = body;
    
    let priceCents = null;
    if (price !== undefined) {
      if (price) {
        const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericPrice)) {
          priceCents = Math.round(numericPrice * 100);
        }
      }
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (notes !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(notes);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(tags));
    }
    if (price !== undefined) {
      updates.push(`price_cents = $${paramIndex++}`);
      values.push(priceCents);
    }
    if (image !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }
    
    values.push(id);
    const idParam = paramIndex++;
    
    let result;
    if (userId) {
      values.push(userId);
      result = await query(
        `UPDATE saved_items si
         SET ${updates.join(', ')}
         FROM saved_carts sc
         WHERE si.cart_id = sc.id 
         AND si.id = $${idParam}
         AND sc.user_id = $${paramIndex}
         RETURNING si.*`,
        values
      );
    } else if (anonSessionId) {
      values.push(anonSessionId);
      result = await query(
        `UPDATE saved_items si
         SET ${updates.join(', ')}
         FROM saved_carts sc
         WHERE si.cart_id = sc.id 
         AND si.id = $${idParam}
         AND sc.anon_session_id = $${paramIndex}
         RETURNING si.*`,
        values
      );
    } else {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    const item = result.rows[0];
    
    return NextResponse.json({
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
      }
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
