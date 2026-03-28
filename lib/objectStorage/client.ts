import { Readable } from "stream";
import { getReplitStorageClient } from "./replitClient";

function getClientInstance() {
  return getReplitStorageClient();
}

export async function putObject(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await getClientInstance().uploadFromBytes(key, buffer);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const result = await getClientInstance().downloadAsBytes(key);
  if (result.ok) {
    const value = result.value;
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(value as any);
    return buf;
  }
  throw new Error(`Failed to download object: ${key}`);
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await getClientInstance().delete(key);
  } catch (err) {
    console.error(`Failed to delete object ${key}:`, err);
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    const result = await getClientInstance().downloadAsBytes(key);
    return result.ok;
  } catch {
    return false;
  }
}

export async function uploadFromStream(
  key: string,
  stream: Readable
): Promise<void> {
  await getClientInstance().uploadFromStream(key, stream);
}

export function getClient() {
  return getClientInstance();
}

export async function downloadToFile(key: string, filePath: string): Promise<void> {
  const fs = await import("fs/promises");
  const result = await getClientInstance().downloadAsBytes(key);
  if (!result.ok) {
    throw new Error(`Failed to download object: ${key}`);
  }
  await fs.writeFile(filePath, result.value);
}
