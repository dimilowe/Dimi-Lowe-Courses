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

export const imageFormatConvertTemplates: ImageFormatConvertTemplate[] = [
  {
    slug: "image-format-convert-main",
    phrase: "convert {source} to {target}",
    phraseSlug: "convert",
    titlePattern: "Convert {source} to {target} Image Online Free | Fast Format Workflow",
    descriptionPattern:
      "Convert {source} to {target} images online with practical compatibility notes and the best VCM conversion path.",
    introPattern:
      "To convert {source} to {target}, use a browser-first workflow that balances quality, transparency handling, and file size for your destination platform.",
  },
  {
    slug: "image-format-convert-converter",
    phrase: "{source} to {target} image converter",
    phraseSlug: "converter",
    titlePattern: "{source} to {target} Image Converter (Free, No Install)",
    descriptionPattern:
      "Need a {source} to {target} image converter? Follow this conversion guide for reliable uploads and clean output.",
    introPattern:
      "A strong {source} to {target} image converter workflow starts with format goals, then applies the right settings to avoid avoidable quality loss.",
  },
  {
    slug: "image-format-convert-how-to",
    phrase: "how to convert {source} to {target}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {source} to {target} Image (Step-by-Step)",
    descriptionPattern:
      "Learn how to convert {source} to {target} with step-by-step settings and direct links to the right tool flow.",
    introPattern:
      "If you need to convert {source} to {target}, this page gives you the practical method plus output tips for publishing, sharing, and compatibility.",
  },
];

export const imageFormatConvertEntities: ImageFormatConvertEntity[] = [
  {
    key: "webp-to-jpg-image",
    name: "WEBP to JPG",
    sourceFormat: "WEBP",
    targetFormat: "JPG",
    category: "web compatibility",
    toolSlug: "webp-to-jpg",
    bestFor: "Uploading modern web images to legacy-friendly platforms.",
    notes: "JPG is universally supported with adjustable compression.",
    priority: 1,
  },
  {
    key: "webp-to-png-image",
    name: "WEBP to PNG",
    sourceFormat: "WEBP",
    targetFormat: "PNG",
    category: "lossless output",
    toolSlug: "webp-to-jpg",
    bestFor: "Preserving detail and sharper edges during export.",
    notes: "PNG files are larger but visually stable.",
    priority: 2,
  },
  {
    key: "png-to-jpg-image",
    name: "PNG to JPG",
    sourceFormat: "PNG",
    targetFormat: "JPG",
    category: "file size reduction",
    toolSlug: "webp-to-jpg",
    bestFor: "Cutting upload size for web pages and email.",
    notes: "Transparency is flattened during JPG export.",
    priority: 3,
  },
  {
    key: "jpg-to-png-image",
    name: "JPG to PNG",
    sourceFormat: "JPG",
    targetFormat: "PNG",
    category: "editing workflow",
    toolSlug: "webp-to-jpg",
    bestFor: "Re-exporting to a format favored in design tools.",
    notes: "PNG will not restore compression lost in the source JPG.",
    priority: 4,
  },
  {
    key: "jpg-to-webp-image",
    name: "JPG to WEBP",
    sourceFormat: "JPG",
    targetFormat: "WEBP",
    category: "web optimization",
    toolSlug: "webp-to-jpg",
    bestFor: "Reducing image weight while keeping visual quality.",
    notes: "Great for faster page loads on modern browsers.",
    priority: 5,
  },
  {
    key: "png-to-webp-image",
    name: "PNG to WEBP",
    sourceFormat: "PNG",
    targetFormat: "WEBP",
    category: "web optimization",
    toolSlug: "webp-to-jpg",
    bestFor: "Publishing lighter assets for web and social.",
    notes: "Compare quality settings before batch exporting.",
    priority: 6,
  },
  {
    key: "heic-to-jpg-image",
    name: "HEIC to JPG",
    sourceFormat: "HEIC",
    targetFormat: "JPG",
    category: "iphone compatibility",
    toolSlug: "heic-to-jpg",
    bestFor: "Sharing iPhone photos across apps and browsers.",
    notes: "JPG remains the safest universal destination format.",
    priority: 7,
  },
  {
    key: "heic-to-png-image",
    name: "HEIC to PNG",
    sourceFormat: "HEIC",
    targetFormat: "PNG",
    category: "lossless output",
    toolSlug: "heic-to-jpg",
    bestFor: "Maintaining detail for graphic workflows.",
    notes: "Use only when larger file sizes are acceptable.",
    priority: 8,
  },
  {
    key: "heic-to-webp-image",
    name: "HEIC to WEBP",
    sourceFormat: "HEIC",
    targetFormat: "WEBP",
    category: "web optimization",
    toolSlug: "heic-to-jpg",
    bestFor: "Turning mobile photos into lightweight web assets.",
    notes: "Test final result on your target CMS or editor.",
    priority: 9,
  },
  {
    key: "gif-to-png-image",
    name: "GIF to PNG",
    sourceFormat: "GIF",
    targetFormat: "PNG",
    category: "static extraction",
    toolSlug: "webp-to-jpg",
    bestFor: "Using single-frame art in static designs.",
    notes: "Animated GIFs require frame-level extraction first.",
    priority: 10,
  },
  {
    key: "bmp-to-jpg-image",
    name: "BMP to JPG",
    sourceFormat: "BMP",
    targetFormat: "JPG",
    category: "legacy format conversion",
    toolSlug: "webp-to-jpg",
    bestFor: "Shrinking old bitmap files for modern use.",
    notes: "BMP sources can be very large before conversion.",
    priority: 11,
  },
  {
    key: "tiff-to-jpg-image",
    name: "TIFF to JPG",
    sourceFormat: "TIFF",
    targetFormat: "JPG",
    category: "delivery format conversion",
    toolSlug: "webp-to-jpg",
    bestFor: "Preparing large print-oriented images for web sharing.",
    notes: "Preserve an archival TIFF copy before down-converting.",
    priority: 12,
  },
];
