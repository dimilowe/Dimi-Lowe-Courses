import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';

const VALID_SORT_COLUMNS = {
  recent: 'COALESCE(last_opened_at, updated_at)',
  updated: 'updated_at',
  name: 'title'
} as const;

const VALID_CLOUD_IDS = [
  'creation', 'video', 'writing', 'files', 
  'monetize', 'intelligence', 'music', 'growth'
];

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cloudId = searchParams.get('cloud_id');
    const q = searchParams.get('q');
    const sort = searchParams.get('sort') || 'recent';
    const starred = searchParams.get('starred');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [session.userId];
    let paramIndex = 2;

    if (cloudId && VALID_CLOUD_IDS.includes(cloudId)) {
      conditions.push(`cloud_id = $${paramIndex}`);
      params.push(cloudId);
      paramIndex++;
    }

    if (q && q.trim()) {
      conditions.push(`(title ILIKE $${paramIndex} OR preview_text ILIKE $${paramIndex})`);
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (starred === 'true') {
      conditions.push('is_starred = true');
    }

    const sortColumn = VALID_SORT_COLUMNS[sort as keyof typeof VALID_SORT_COLUMNS] || VALID_SORT_COLUMNS.recent;
    const sortDirection = sort === 'name' ? 'ASC' : 'DESC';

    const sql = `
      SELECT id, title, type, cloud_id, tool_id, is_starred, preview_text, 
             thumbnail_url, file_url, created_at, updated_at, last_opened_at
      FROM workspace_items
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    const countParams = params.slice(0, -2);
    const countSql = `
      SELECT COUNT(*) as total
      FROM workspace_items
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await query(countSql, countParams);

    return NextResponse.json({
      items: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching workspace items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, cloud_id, tool_id, workflow_id, preview_text, payload_json, thumbnail_url } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    if (cloud_id && !VALID_CLOUD_IDS.includes(cloud_id)) {
      return NextResponse.json({ error: 'Invalid cloud_id' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO workspace_items 
       (user_id, title, type, cloud_id, tool_id, workflow_id, preview_text, payload_json, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, type, cloud_id, tool_id, is_starred, preview_text, 
                 thumbnail_url, created_at, updated_at, last_opened_at`,
      [
        session.userId,
        title,
        type,
        cloud_id || null,
        tool_id || null,
        workflow_id || null,
        preview_text || null,
        JSON.stringify(payload_json || {}),
        thumbnail_url || null
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating workspace item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
