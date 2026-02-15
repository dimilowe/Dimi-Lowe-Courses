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
    case "audio-pitch-shift":
    case "audio-reverb":
    case "audio-delay":
    case "audio-compressor":
    case "audio-limiter":
    case "audio-high-pass-filter":
    case "audio-low-pass-filter":
    case "audio-bitcrusher":
    case "audio-effect-chain-builder":
    case "vocal-effects-chain":
      return kind === "default";
    default:
      return false;
  }
}
