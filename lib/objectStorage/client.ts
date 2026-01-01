import { Client } from "@replit/object-storage";

const client = new Client();

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
