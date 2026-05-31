import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sourceResult = await query(
      `SELECT id, payload_json
       FROM workspace_items
       WHERE id = $1 AND user_id = $2`,
      [id, session.userId]
    );

    if (sourceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const source = sourceResult.rows[0] as Record<string, unknown>;
    const versionGroupId = (source.payload_json as Record<string, unknown>)?.version_group_id || source.id;

    const versionsResult = await query(
      `SELECT id, title, type, updated_at, created_at, last_opened_at,
              COALESCE(NULLIF(payload_json->>'version_group_id', ''), id::text) AS version_group_id,
              COALESCE(NULLIF(payload_json->>'version_number', '')::int, 1) AS version_number,
              COALESCE(payload_json->>'version_note', NULL) AS version_note
       FROM workspace_items
       WHERE user_id = $1
         AND COALESCE(NULLIF(payload_json->>'version_group_id', ''), id::text) = $2
       ORDER BY COALESCE(NULLIF(payload_json->>'version_number', '')::int, 1) DESC, updated_at DESC`,
      [session.userId, versionGroupId]
    );

    return NextResponse.json({
      version_group_id: versionGroupId,
      versions: versionsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching workspace item versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}
