export const WORKSPACE_DRAG_MIME = "application/x-vcm-workspace-item";

export type WorkspaceDragPayload = {
  itemId: string;
  title: string;
  type: string;
  fileUrl: string | null;
};

export function setWorkspaceDragPayload(dataTransfer: DataTransfer, payload: WorkspaceDragPayload) {
  const json = JSON.stringify(payload);
  dataTransfer.setData(WORKSPACE_DRAG_MIME, json);
  dataTransfer.setData("text/plain", json);
}

export function getWorkspaceDragPayload(dataTransfer: DataTransfer): WorkspaceDragPayload | null {
  const raw = dataTransfer.getData(WORKSPACE_DRAG_MIME) || dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.itemId !== "string" || typeof parsed.title !== "string" || typeof parsed.type !== "string") {
      return null;
    }
    const fileUrl = typeof parsed.fileUrl === "string" ? parsed.fileUrl : null;
    return { itemId: parsed.itemId, title: parsed.title, type: parsed.type, fileUrl };
  } catch {
    return null;
  }
}

function guessExtension(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("pdf")) return "pdf";
  return "bin";
}

export async function fileFromWorkspaceDrag(dataTransfer: DataTransfer): Promise<File | null> {
  const payload = getWorkspaceDragPayload(dataTransfer);
  if (!payload?.fileUrl) return null;

  const res = await fetch(payload.fileUrl);
  if (!res.ok) return null;
  const blob = await res.blob();
  const contentType = blob.type || "application/octet-stream";
  const ext = guessExtension(contentType);
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(payload.title);
  const safeName = hasExt ? payload.title : `${payload.title}.${ext}`;
  return new File([blob], safeName, { type: contentType });
}

