import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';

const VALID_CLOUD_IDS = [
  'creation', 'video', 'writing', 'files', 
  'monetize', 'intelligence', 'music', 'growth'
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileType(contentType: string): string {
  if (contentType.startsWith('image/')) return 'uploaded_image';
  if (contentType.startsWith('video/')) return 'uploaded_video';
  if (contentType.startsWith('audio/')) return 'uploaded_audio';
  if (contentType === 'application/pdf') return 'uploaded_document';
  return 'uploaded_file';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publicUrl, fileName, fileSize, contentType, cloudId } = body;

    if (!publicUrl || !fileName) {
      return NextResponse.json({ error: 'publicUrl and fileName are required' }, { status: 400 });
    }

    const validCloudId = cloudId && VALID_CLOUD_IDS.includes(cloudId) ? cloudId : 'files';
    const type = getFileType(contentType || 'application/octet-stream');
    const previewText = `${formatBytes(fileSize || 0)} - ${contentType || 'Unknown type'}`;

    const thumbnailUrl = contentType?.startsWith('image/') ? publicUrl : null;

    const result = await query(
      `INSERT INTO workspace_items 
       (user_id, title, type, cloud_id, preview_text, file_url, thumbnail_url, payload_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, type, cloud_id, is_starred, preview_text, 
                 thumbnail_url, file_url, created_at, updated_at`,
      [
        session.userId,
        fileName,
        type,
        validCloudId,
        previewText,
        publicUrl,
        thumbnailUrl,
        JSON.stringify({ originalName: fileName, fileSize, contentType })
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error confirming workspace upload:', error);
    return NextResponse.json({ error: 'Failed to save upload' }, { status: 500 });
  }
}
