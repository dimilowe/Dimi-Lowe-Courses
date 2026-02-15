export type WorkstationMode = "image" | "pdf" | "audio";

export function getWorkstationModeForItemType(type: string | null | undefined): WorkstationMode | null {
  const value = (type || "").toLowerCase();
  if (!value) return null;
  if (value.includes("image")) return "image";
  if (value.includes("pdf") || value.includes("document")) return "pdf";
  if (value.includes("audio")) return "audio";
  return null;
}

export function getWorkstationHrefForItemType(type: string | null | undefined): string | null {
  const mode = getWorkstationModeForItemType(type);
  if (!mode) return null;
  return `/workstations?mode=${mode}`;
}

export function getWorkstationHrefForItem(params: {
  type: string | null | undefined;
  fileUrl?: string | null;
  title?: string | null;
  itemId?: string | null;
}): string | null {
  const mode = getWorkstationModeForItemType(params.type);
  if (!mode) return null;
  const qs = new URLSearchParams({ mode });
  if (params.fileUrl) qs.set("src", params.fileUrl);
  if (params.title) qs.set("title", params.title);
  if (params.itemId) qs.set("itemId", params.itemId);
  return `/workstations?${qs.toString()}`;
}

export function getWorkstationLabelForMode(mode: WorkstationMode): string {
  if (mode === "image") return "Open in Image Workstation";
  if (mode === "pdf") return "Open in PDF Workstation";
  return "Open in Audio Workstation";
}
