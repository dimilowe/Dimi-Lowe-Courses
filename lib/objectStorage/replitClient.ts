import { Client } from "@replit/object-storage";

let client: Client | null = null;

export function getReplitStorageClient(): Client {
  if (!client) {
    client = new Client();
  }

  return client;
}
