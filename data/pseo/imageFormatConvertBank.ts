export const IMAGE_FORMAT_CONVERT_BANK_SLUG = "image-format-convert";
export const IMAGE_FORMAT_CONVERT_BANK_HUB_PATH = "/tools/image-format-convert-bank";

export type ImageFormatConvertTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type ImageFormatConvertEntity = {
  key: string;
  name: string;
  sourceFormat: string;
  targetFormat: string;
  category: string;
  toolSlug: string;
  bestFor: string;
  notes: string;
  priority: number;
};

type ImageFormatDefinition = {
  label: string;
  slug: string;
};

const imageFormats: ImageFormatDefinition[] = [
  { label: "JPG", slug: "jpg" },
  { label: "PNG", slug: "png" },
  { label: "WEBP", slug: "webp" },
  { label: "HEIC", slug: "heic" },
  { label: "GIF", slug: "gif" },
  { label: "BMP", slug: "bmp" },
  { label: "TIFF", slug: "tiff" },
  { label: "AVIF", slug: "avif" },
  { label: "ICO", slug: "ico" },
  { label: "JP2", slug: "jp2" },
  { label: "PSD", slug: "psd" },
  { label: "SVG", slug: "svg" },
];

function resolveCategory(sourceFormat: string, targetFormat: string): string {
  if (sourceFormat === "HEIC" || targetFormat === "HEIC") return "iphone format compatibility";
  if (sourceFormat === "SVG" || targetFormat === "SVG") return "vector and raster conversion";
  if (sourceFormat === "GIF" || targetFormat === "GIF") return "animation and static workflow";
  if (targetFormat === "WEBP" || targetFormat === "AVIF" || targetFormat === "JPG") {
    return "web and delivery optimization";
  }
  if (targetFormat === "PNG" || targetFormat === "TIFF" || targetFormat === "BMP") {
    return "quality-first export";
  }
  return "format compatibility";
}

function resolveToolSlug(sourceFormat: string, targetFormat: string): string {
  if (sourceFormat === "HEIC" || targetFormat === "HEIC") return "heic-to-jpg";
  return "webp-to-jpg";
}

function buildImageFormatEntities(): ImageFormatConvertEntity[] {
  const entities: ImageFormatConvertEntity[] = [];
  let priority = 1;

  for (const source of imageFormats) {
    for (const target of imageFormats) {
      if (source.slug === target.slug) continue;

      const category = resolveCategory(source.label, target.label);
      entities.push({
        key: `${source.slug}-to-${target.slug}-image`,
        name: `${source.label} to ${target.label}`,
        sourceFormat: source.label,
        targetFormat: target.label,
        category,
        toolSlug: resolveToolSlug(source.label, target.label),
        bestFor: `Converting ${source.label} assets to ${target.label} for ${category.toLowerCase()} workflows.`,
        notes:
          "Convert from the highest-quality source, then verify results in your target platform before publishing.",
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

export const imageFormatConvertTemplates: ImageFormatConvertTemplate[] = [
  {
    slug: "image-format-convert-main",
    phrase: "convert {source} to {target}",
    phraseSlug: "convert",
    titlePattern: "Convert {source} to {target} Image Online Free | Fast Format Workflow",
    descriptionPattern:
      "Convert {source} to {target} images online with practical compatibility notes and a direct VCM workflow.",
    introPattern:
      "To convert {source} to {target}, use a browser-first workflow that balances quality, compatibility, and file size for your destination platform.",
  },
  {
    slug: "image-format-convert-converter",
    phrase: "{source} to {target} image converter",
    phraseSlug: "converter",
    titlePattern: "{source} to {target} Image Converter (Free, No Install)",
    descriptionPattern:
      "Need a {source} to {target} image converter? Follow this conversion path for reliable uploads and cleaner outputs.",
    introPattern:
      "A strong {source} to {target} image converter workflow starts with output goals, then applies settings that prevent avoidable quality loss.",
  },
  {
    slug: "image-format-convert-how-to",
    phrase: "how to convert {source} to {target}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {source} to {target} Image (Step-by-Step)",
    descriptionPattern:
      "Learn how to convert {source} to {target} with practical steps, setting guidance, and direct tool access.",
    introPattern:
      "If you need to convert {source} to {target}, this guide explains the practical method and the output checks that reduce compatibility issues.",
  },
  {
    slug: "image-format-convert-best",
    phrase: "best {source} to {target} converter",
    phraseSlug: "best",
    titlePattern: "Best {source} to {target} Converter Workflow (Free Guide)",
    descriptionPattern:
      "Compare the best {source} to {target} converter workflow for speed, compatibility, and output quality.",
    introPattern:
      "This best {source} to {target} converter guide focuses on practical tradeoffs so you can choose settings that match quality and file-size goals.",
  },
];

export const imageFormatConvertEntities: ImageFormatConvertEntity[] = buildImageFormatEntities();
