export const TOOL_QUICK_IMPORT_EVENT = "vcm:tool-quick-import";

export type QuickImportKind = "image" | "video" | "pdf" | "default";

export type ToolQuickImportDetail = {
  file: File;
  kind: QuickImportKind;
  itemId: string;
  source: "workspace";
};

export function isToolQuickImportCompatible(toolSlug: string, kind: QuickImportKind) {
  switch (toolSlug) {
    case "webp-to-jpg":
    case "image-compressor":
    case "watermark-creator-free":
      return kind === "image";
    case "gif-maker":
      return kind === "image" || kind === "video";
    default:
      return false;
  }
}

