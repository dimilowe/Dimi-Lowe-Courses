import { query } from "@/lib/db";
import { randomUUID } from "crypto";

export type ToolJobStatus = "pending" | "processing" | "complete" | "failed";
export type ToolJobStage =
  | "upload"
  | "probe"
  | "cuts"
  | "frames"
  | "pack"
  | "cleanup";

export interface ToolJob {
  id: string;
  tool_slug: string;
  status: ToolJobStatus;
  stage: ToolJobStage;
  progress: number;
  error: string | null;
  input_key: string | null;
  output_key: string | null;
  meta_json: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export async function createJob(params: {
  toolSlug: string;
  inputKey: string;
  originalFilename: string;
  jobId?: string;
}): Promise<string> {
  const id = params.jobId || randomUUID();
  await query(
    `
    INSERT INTO tool_jobs
      (id, tool_slug, status, stage, progress, input_key, meta_json)
    VALUES
      ($1, $2, 'pending', 'upload', 0, $3, $4)
    `,
    [
      id,
      params.toolSlug,
      params.inputKey,
      JSON.stringify({ original_filename: params.originalFilename })
    ]
  );
  return id;
}

export async function getJob(jobId: string): Promise<ToolJob | null> {
  const { rows } = await query(
    `SELECT * FROM tool_jobs WHERE id = $1`,
    [jobId]
  );
  return rows[0] || null;
}

export async function updateJob(
  jobId: string,
  patch: Partial<{
    status: ToolJobStatus;
    stage: ToolJobStage;
    progress: number;
    error: string | null;
    output_key: string | null;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(patch)) {
    fields.push(`${key} = $${i++}`);
    values.push(value);
  }

  fields.push(`updated_at = NOW()`);

  await query(
    `
    UPDATE tool_jobs
    SET ${fields.join(", ")}
    WHERE id = $${i}
    `,
    [...values, jobId]
  );
}

export async function appendMeta(jobId: string, patch: Record<string, any>): Promise<void> {
  await query(
    `
    UPDATE tool_jobs
    SET meta_json = COALESCE(meta_json, '{}'::jsonb) || $1::jsonb,
        updated_at = NOW()
    WHERE id = $2
    `,
    [JSON.stringify(patch), jobId]
  );
}
