import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await query(
      `UPDATE workspace_items 
       SET last_opened_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, type, cloud_id, tool_id, workflow_id, is_starred, 
                 preview_text, payload_json, thumbnail_url, created_at, updated_at, last_opened_at`,
      [id, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching workspace item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (typeof body.is_starred === 'boolean') {
      updates.push(`is_starred = $${paramIndex}`);
      values.push(body.is_starred);
      paramIndex++;
    }

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.push(`title = $${paramIndex}`);
      values.push(body.title.trim());
      paramIndex++;
    }

    if (updates.length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id, session.userId);

    const result = await query(
      `UPDATE workspace_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING id, title, type, cloud_id, tool_id, is_starred, preview_text, 
                 thumbnail_url, created_at, updated_at, last_opened_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating workspace item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await query(
      `DELETE FROM workspace_items WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
