import { Client } from "@replit/object-storage";
import { JobManifest, STORAGE_PREFIX } from "./types";

const client = new Client();

export function getJobPath(jobId: string): string {
  return `${STORAGE_PREFIX}/${jobId}`;
}

export async function loadManifest(jobId: string): Promise<JobManifest | null> {
  try {
    const path = `${getJobPath(jobId)}/manifest.json`;
    const result = await client.downloadAsText(path);
    if (!result.ok) return null;
    return JSON.parse(result.value) as JobManifest;
  } catch {
    return null;
  }
}

export async function saveManifest(jobId: string, manifest: JobManifest): Promise<void> {
  const path = `${getJobPath(jobId)}/manifest.json`;
  manifest.updated_at = new Date().toISOString();
  await client.uploadFromText(path, JSON.stringify(manifest, null, 2));
}

export async function createManifest(
  jobId: string,
  mode: "concept" | "lock",
  identitySpec: JobManifest["identity_spec"],
  conceptImageKey?: string
): Promise<JobManifest> {
  const manifest: JobManifest = {
    job_id: jobId,
    mode,
    status: "pending",
    identity_spec: identitySpec,
    concept_image_key: conceptImageKey,
    concept_attempts: 0,
    anchor_attempts: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await saveManifest(jobId, manifest);
  return manifest;
}

export async function updateManifestStatus(
  jobId: string,
  status: JobManifest["status"],
  updates?: Partial<JobManifest>
): Promise<JobManifest | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return null;
  
  manifest.status = status;
  if (updates) {
    Object.assign(manifest, updates);
  }
  await saveManifest(jobId, manifest);
  return manifest;
}
