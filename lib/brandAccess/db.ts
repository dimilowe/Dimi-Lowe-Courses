import { query } from '@/lib/db';
import type { 
  BrandAccessEntry, 
  BrandAccessEntryPreview, 
  BrandAccessRequest,
  ListEntriesParams,
  CreateRequestParams,
  ContactType
} from './types';

export async function listEntries(
  params: ListEntriesParams,
  isPro: boolean
): Promise<BrandAccessEntry[] | BrandAccessEntryPreview[]> {
  const { q, type, tag, limit = 50 } = params;
  const safeLimit = Math.min(Math.max(1, limit), 200);
  
  const conditions: string[] = ['is_active = true'];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (q && q.trim()) {
    conditions.push(`lower(brand_name) LIKE $${paramIndex}`);
    values.push(`%${q.trim().toLowerCase()}%`);
    paramIndex++;
  }

  if (type) {
    conditions.push(`contact_type = $${paramIndex}`);
    values.push(type);
    paramIndex++;
  }

  if (tag) {
    conditions.push(`$${paramIndex} = ANY(tags)`);
    values.push(tag);
    paramIndex++;
  }

  values.push(safeLimit);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (isPro) {
    const { rows } = await query(
      `SELECT id, brand_name, website_url, contact_url, contact_type, tags, notes, 
              country, city, source, last_verified, is_active, created_at, updated_at
       FROM brand_access_entries
       ${whereClause}
       ORDER BY brand_name ASC
       LIMIT $${paramIndex}`,
      values
    );
    return rows as unknown as BrandAccessEntry[];
  } else {
    const previewLimit = Math.min(safeLimit, 10);
    values[values.length - 1] = previewLimit;
    
    const { rows } = await query(
      `SELECT id, brand_name, website_url, contact_type, tags, notes, 
              country, city, last_verified
       FROM brand_access_entries
       ${whereClause}
       ORDER BY brand_name ASC
       LIMIT $${paramIndex}`,
      values
    );
    
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      locked: true as const
    })) as BrandAccessEntryPreview[];
  }
}

export async function getTotalCount(): Promise<number> {
  const { rows } = await query(
    `SELECT COUNT(*) as count FROM brand_access_entries WHERE is_active = true`,
    []
  );
  return parseInt((rows[0]?.count as string) || '0', 10);
}

export async function createRequest(params: CreateRequestParams): Promise<BrandAccessRequest> {
  const { 
    requested_brand_name, 
    requested_website_url, 
    request_reason, 
    user_email,
    user_id,
    resolved_website_url,
    resolved_contact_url,
    resolve_confidence,
    resolver_method
  } = params;

  const { rows } = await query(
    `INSERT INTO brand_access_requests 
       (requested_brand_name, requested_website_url, request_reason, user_email, user_id,
        resolved_website_url, resolved_contact_url, resolve_confidence, resolver_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      requested_brand_name.trim().slice(0, 200),
      requested_website_url?.trim().slice(0, 500) || null,
      request_reason?.trim().slice(0, 1000) || null,
      user_email?.trim().slice(0, 255) || null,
      user_id || null,
      resolved_website_url?.trim().slice(0, 500) || null,
      resolved_contact_url?.trim().slice(0, 500) || null,
      resolve_confidence || 'low',
      resolver_method || null
    ]
  );

  return rows[0] as unknown as BrandAccessRequest;
}

export async function listRequests(status?: string): Promise<BrandAccessRequest[]> {
  let sql = `SELECT * FROM brand_access_requests`;
  const values: string[] = [];
  
  if (status) {
    sql += ` WHERE status = $1`;
    values.push(status);
  }
  
  sql += ` ORDER BY created_at DESC LIMIT 100`;
  
  const { rows } = await query(sql, values);
  return rows as unknown as BrandAccessRequest[];
}

export async function getRequestById(id: string): Promise<BrandAccessRequest | null> {
  const { rows } = await query(
    `SELECT * FROM brand_access_requests WHERE id = $1`,
    [id]
  );
  return (rows[0] as unknown as BrandAccessRequest) || null;
}

export async function updateRequestStatus(
  id: string, 
  status: string, 
  adminId: string,
  adminNotes?: string,
  publishedEntryId?: string
): Promise<void> {
  await query(
    `UPDATE brand_access_requests 
     SET status = $2, reviewed_by = $3, reviewed_at = NOW(), admin_notes = $4, published_entry_id = $5
     WHERE id = $1`,
    [id, status, adminId, adminNotes || null, publishedEntryId || null]
  );
}

export async function publishEntry(
  brandName: string,
  websiteUrl: string | null,
  contactUrl: string,
  notes: string | null
): Promise<string> {
  const { rows } = await query(
    `INSERT INTO brand_access_entries 
       (brand_name, website_url, contact_url, contact_type, tags, notes, is_active, source)
     VALUES ($1, $2, $3, 'brand', ARRAY['user-requested'], $4, true, 'user_request')
     RETURNING id`,
    [brandName, websiteUrl, contactUrl, notes]
  );
  return rows[0].id as string;
}
