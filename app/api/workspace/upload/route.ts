import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { ObjectStorageService } from '@/lib/object-storage';
import { randomUUID } from 'crypto';

const objectStorage = new ObjectStorageService();

const VALID_CLOUD_IDS = [
  'creation', 'video', 'writing', 'files', 
  'monetize', 'intelligence', 'music', 'growth'
];

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, cloud_id } = body;
    const contentType = body.contentType || 'application/octet-stream';

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const validCloudId = cloud_id && VALID_CLOUD_IDS.includes(cloud_id) ? cloud_id : 'files';
    
    const objectId = randomUUID();
    const ext = fileName.split('.').pop() || '';
    const objectName = `workspace/${session.userId}/${objectId}${ext ? `.${ext}` : ''}`;
    const bucketName = objectStorage.getBucketName();

    const uploadUrlResponse = await fetch('http://127.0.0.1:1106/object-storage/signed-object-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method: 'PUT',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
    });

    if (!uploadUrlResponse.ok) {
      const errorText = await uploadUrlResponse.text();
      console.error('Failed to get signed URL:', errorText);
      return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 });
    }

    const { signed_url: uploadUrl } = await uploadUrlResponse.json();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      objectName,
      cloudId: validCloudId,
      fileName,
      fileSize,
      contentType,
    });
  } catch (error) {
    console.error('Error preparing workspace upload:', error);
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 });
  }
}
