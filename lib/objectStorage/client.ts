import { Client } from "@replit/object-storage";
import { Storage } from "@google-cloud/storage";

const client = new Client();

const gcsStorage = new Storage();
const bucketName = process.env.STORAGE_BUCKET || "";

export async function putObject(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await client.uploadFromBytes(key, buffer);
}

export async function getObjectBuffer(key: string): Promise<Uint8Array> {
  const result = await client.downloadAsBytes(key);
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Failed to download object: ${key}`);
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await client.delete(key);
  } catch (err) {
    console.error(`Failed to delete object ${key}:`, err);
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    const result = await client.downloadAsBytes(key);
    return result.ok;
  } catch {
    return false;
  }
}

export interface UploadUrlResult {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  key: string;
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresInMinutes: number = 15
): Promise<UploadUrlResult> {
  if (!bucketName) {
    throw new Error("STORAGE_BUCKET environment variable is not set");
  }

  const bucket = gcsStorage.bucket(bucketName);
  const file = bucket.file(key);

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType
  });

  return {
    url: signedUrl,
    method: "PUT",
    headers: {
      "Content-Type": contentType
    },
    key
  };
}
