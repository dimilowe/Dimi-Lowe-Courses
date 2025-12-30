/**
 * Workspace Items API
 * 
 * NEW RULES (Global Workspace):
 * - Workspace is global. Items are not "owned" by a cloud.
 * - origin_cloud_id = where the item was created/saved from (optional metadata)
 * - Cloud dashboards default to ALL workspace items
 * - Cloud dashboards optionally filter to "This cloud" via origin_cloud_id
 * - No more storing "where it belongs." Only "where it came from."
 * 
 * GET params:
 * - scope=all (default) - returns all workspace items for user
 * - origin_cloud_id=<id> - filter by origin cloud (optional)
 * - q - search query
 * - sort - recent|updated|name
 * - starred - true to filter starred items
 * - limit/offset - pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { normalizeCloudId, CANONICAL_CLOUD_IDS } from '@/lib/cloud/normalizeCloudId';

const VALID_SORT_COLUMNS = {
  recent: 'COALESCE(last_opened_at, updated_at)',
  updated: 'updated_at',
  name: 'title'
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const originCloudId = searchParams.get('origin_cloud_id');
    const cloudId = searchParams.get('cloud_id'); // Legacy param, treat as origin filter
    const q = searchParams.get('q');
    const sort = searchParams.get('sort') || 'recent';
    const starred = searchParams.get('starred');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [session.userId];
    let paramIndex = 2;

    // Origin cloud filter (optional) - use origin_cloud_id or legacy cloud_id param
    const originParam = originCloudId || cloudId;
    if (originParam) {
      const normalized = normalizeCloudId(originParam);
      if (normalized) {
        conditions.push(`origin_cloud_id = $${paramIndex}`);
        params.push(normalized);
        paramIndex++;
      } else {
        // Log warning but don't break - allow unknown clouds
        console.warn(`Unknown origin_cloud_id: ${originParam}, filtering anyway`);
        conditions.push(`origin_cloud_id = $${paramIndex}`);
        params.push(originParam);
        paramIndex++;
      }
    }
    // If no origin filter, return ALL items (global workspace behavior)

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
      SELECT id, title, type, origin_cloud_id, cloud_id, tool_id, is_starred, preview_text, 
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
    const { title, type, origin_cloud_id, cloud_id, tool_id, workflow_id, preview_text, payload_json, thumbnail_url } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    // Normalize origin_cloud_id if provided, but don't require it
    // Accept cloud_id for backward compatibility, treat as origin
    // origin_cloud_id stores any value (graceful), cloud_id only stores canonical (for constraints)
    const originParam = origin_cloud_id || cloud_id;
    let originForStorage: string | null = null;
    let legacyCloudId: string | null = null;
    
    if (originParam) {
      const normalized = normalizeCloudId(originParam);
      originForStorage = normalized || originParam; // Store any value in origin_cloud_id
      legacyCloudId = CANONICAL_CLOUD_IDS.has(normalized || '') ? normalized : null; // Only canonical to cloud_id
      
      if (!normalized || !CANONICAL_CLOUD_IDS.has(normalized)) {
        console.warn(`[workspace/items POST] Non-canonical origin: "${originParam}"`);
      }
    }

    const result = await query(
      `INSERT INTO workspace_items 
       (user_id, title, type, origin_cloud_id, cloud_id, tool_id, workflow_id, preview_text, payload_json, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, type, origin_cloud_id, cloud_id, tool_id, is_starred, preview_text, 
                 thumbnail_url, created_at, updated_at, last_opened_at`,
      [
        session.userId,
        title,
        type,
        originForStorage,
        legacyCloudId, // Only canonical IDs to preserve constraint compatibility
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
