import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { getReplitStorageClient } from '@/lib/objectStorage/replitClient';

const LOCAL_WORKSPACE_UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'workspace-uploads');
const ALLOW_LOCAL_FILE_FALLBACK = process.env.NODE_ENV !== 'production';

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
    const userIdNum = parseInt(String(session.userId), 10);
    if (!Number.isFinite(userIdNum)) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }


    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || '';
    const fileName = `workspace-${userIdNum}-${timestamp}-${randomString}${extension ? `.${extension}` : ''}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let storedInObjectStorage = false;
    let storageError: unknown = null;
    try {
      const uploadResult = await getReplitStorageClient().uploadFromBytes(fileName, buffer);
      if (uploadResult.ok) {
        storedInObjectStorage = true;
      } else {
        storageError = uploadResult.error;
      }
    } catch (err) {
      storageError = err;
    }

    if (!storedInObjectStorage) {
      if (!ALLOW_LOCAL_FILE_FALLBACK) {
        console.error('Storage upload error:', storageError);
        return NextResponse.json(
          { error: 'Failed to store file' },
          { status: 500 }
        );
      }

      // Local dev fallback: persist file on disk when object storage is unavailable.
      try {
        await mkdir(LOCAL_WORKSPACE_UPLOAD_DIR, { recursive: true });
        await writeFile(path.join(LOCAL_WORKSPACE_UPLOAD_DIR, fileName), buffer);
      } catch (localErr) {
        console.error('Storage upload error:', storageError);
        console.error('Local fallback write error:', localErr);
        return NextResponse.json(
          { error: 'Failed to store file' },
          { status: 500 }
        );
      }
    }

    const publicUrl = `/api/files/${fileName}`;
    const contentType = file.type || 'application/octet-stream';
    const type = getFileType(contentType);
    const previewText = `${formatBytes(file.size)} - ${contentType}`;
    const thumbnailUrl = contentType.startsWith('image/') ? publicUrl : null;

    const result = await query(
      `INSERT INTO workspace_items
       (user_id, title, type, preview_text, file_url, thumbnail_url, payload_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, type, is_starred, preview_text,
                 thumbnail_url, file_url, created_at, updated_at`,
      [
        userIdNum,
        file.name,
        type,
        previewText,
        publicUrl,
        thumbnailUrl,
        JSON.stringify({
          originalName: file.name,
          fileSize: file.size,
          contentType,
          storageBackend: storedInObjectStorage ? 'object-storage' : 'local-fallback',
        })
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading to workspace:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development'
        ? { error: 'Failed to upload file', detail }
        : { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
