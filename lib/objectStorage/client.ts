import { Client } from "@replit/object-storage";
import { Readable } from "stream";

const client = new Client();

export { client as objectStorage };

export async function putObject(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await client.uploadFromBytes(key, buffer);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const result = await client.downloadAsBytes(key);
  if (result.ok) {
    const value = result.value;
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(value as any);
    return buf;
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

export async function uploadFromStream(
  key: string,
  stream: Readable
): Promise<void> {
  await client.uploadFromStream(key, stream);
}

export function getClient(): Client {
  return client;
}

export async function downloadToFile(key: string, filePath: string): Promise<void> {
  const fs = await import("fs/promises");
  const result = await client.downloadAsBytes(key);
  if (!result.ok) {
    throw new Error(`Failed to download object: ${key}`);
  }
  await fs.writeFile(filePath, result.value);
}
