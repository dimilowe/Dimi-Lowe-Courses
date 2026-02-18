export const FILE_CONVERT_BANK_SLUG = "file-convert";
export const FILE_CONVERT_BANK_HUB_PATH = "/tools/file-convert-bank";

export type FileConvertTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type FileConvertEntity = {
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

type FormatDefinition = {
  label: string;
  slug: string;
};

const imageFormats: FormatDefinition[] = [
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
  { label: "RAW", slug: "raw" },
  { label: "DNG", slug: "dng" },
];

const audioFormats: FormatDefinition[] = [
  { label: "MP3", slug: "mp3" },
  { label: "WAV", slug: "wav" },
  { label: "M4A", slug: "m4a" },
  { label: "AAC", slug: "aac" },
  { label: "FLAC", slug: "flac" },
  { label: "OGG", slug: "ogg" },
  { label: "AIFF", slug: "aiff" },
  { label: "WMA", slug: "wma" },
  { label: "ALAC", slug: "alac" },
  { label: "AMR", slug: "amr" },
  { label: "OPUS", slug: "opus" },
];

const midiSourceNames: Array<{ label: string; slug: string; toolSlug: string }> = [
  { label: "WAV", slug: "wav", toolSlug: "audio-to-midi" },
  { label: "MP3", slug: "mp3", toolSlug: "audio-to-midi" },
  { label: "M4A", slug: "m4a", toolSlug: "audio-to-midi" },
  { label: "FLAC", slug: "flac", toolSlug: "audio-to-midi" },
  { label: "AAC", slug: "aac", toolSlug: "audio-to-midi" },
  { label: "OGG", slug: "ogg", toolSlug: "audio-to-midi" },
  { label: "Guitar Audio", slug: "guitar-audio", toolSlug: "audio-to-midi" },
  { label: "Piano Audio", slug: "piano-audio", toolSlug: "audio-to-midi" },
  { label: "Vocal Audio", slug: "vocal-audio", toolSlug: "vocal-melody-extractor" },
  { label: "Voice Memo", slug: "voice-memo", toolSlug: "vocal-melody-extractor" },
  { label: "Podcast Audio", slug: "podcast-audio", toolSlug: "vocal-melody-extractor" },
  { label: "Singing Recording", slug: "singing-recording", toolSlug: "vocal-melody-extractor" },
];

function resolveImageCategory(source: string, target: string): string {
  if (source === "HEIC" || target === "HEIC") return "iphone image compatibility";
  if (source === "SVG" || target === "SVG") return "vector and raster conversion";
  if (target === "WEBP" || target === "AVIF" || target === "JPG") return "web delivery optimization";
  return "image format conversion";
}

function buildImageEntities(startPriority: number): FileConvertEntity[] {
  const entities: FileConvertEntity[] = [];
  let priority = startPriority;

  for (const source of imageFormats) {
    for (const target of imageFormats) {
      if (source.slug === target.slug) continue;

      const category = resolveImageCategory(source.label, target.label);
      entities.push({
        key: `${source.slug}-to-${target.slug}`,
        name: `${source.label} to ${target.label}`,
        sourceFormat: source.label,
        targetFormat: target.label,
        category,
        toolSlug: source.label === "HEIC" || target.label === "HEIC" ? "heic-to-jpg" : "webp-to-jpg",
        bestFor: `Converting ${source.label} assets to ${target.label} for ${category.toLowerCase()} workflows.`,
        notes: "Convert from a high-quality source and validate final output on your destination platform.",
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

function buildAudioEntities(startPriority: number): FileConvertEntity[] {
  const entities: FileConvertEntity[] = [];
  let priority = startPriority;

  for (const source of audioFormats) {
    for (const target of audioFormats) {
      if (source.slug === target.slug) continue;

      entities.push({
        key: `${source.slug}-to-${target.slug}`,
        name: `${source.label} to ${target.label}`,
        sourceFormat: source.label,
        targetFormat: target.label,
        category: "audio format conversion",
        toolSlug: "m4a-to-mp3-conversion",
        bestFor: `Transcoding ${source.label} audio into ${target.label} for playback and publishing compatibility.`,
        notes: "Use moderate bitrate and avoid repeated transcodes to reduce cumulative quality loss.",
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

function buildMidiEntities(startPriority: number): FileConvertEntity[] {
  const entities: FileConvertEntity[] = [];
  let priority = startPriority;

  for (const source of midiSourceNames) {
    entities.push({
      key: `${source.slug}-to-midi`,
      name: `${source.label} to MIDI`,
      sourceFormat: source.label,
      targetFormat: "MIDI",
      category: "audio to MIDI conversion",
      toolSlug: source.toolSlug,
      bestFor: `Extracting note information from ${source.label.toLowerCase()} recordings for editing in a DAW.`,
      notes: "Cleaner monophonic input generally produces better note extraction quality.",
      priority,
    });
    priority += 1;
  }

  return entities;
}

function buildFileConvertEntities(): FileConvertEntity[] {
  const imageEntities = buildImageEntities(1);
  const audioEntities = buildAudioEntities(imageEntities.length + 1);
  const midiEntities = buildMidiEntities(imageEntities.length + audioEntities.length + 1);
  return [...imageEntities, ...audioEntities, ...midiEntities];
}

export const fileConvertTemplates: FileConvertTemplate[] = [
  {
    slug: "file-convert-main",
    phrase: "convert {source} to {target}",
    phraseSlug: "convert",
    titlePattern: "Convert {source} to {target} Online Free | Fast Workflow",
    descriptionPattern:
      "Convert {source} to {target} online with a practical browser workflow, compatibility notes, and direct tool access.",
    introPattern:
      "To convert {source} to {target}, start with your output compatibility goal, then apply settings that preserve quality and keep file size manageable.",
  },
  {
    slug: "file-convert-converter",
    phrase: "{source} to {target} converter",
    phraseSlug: "converter",
    titlePattern: "{source} to {target} Converter (Free, No Install)",
    descriptionPattern:
      "Need a {source} to {target} converter? Follow this direct workflow to generate cleaner, more compatible output files.",
    introPattern:
      "A {source} to {target} converter flow should prioritize compatibility, stable quality, and predictable exports. Use this guide as a repeatable baseline.",
  },
  {
    slug: "file-convert-how-to",
    phrase: "how to convert {source} to {target}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {source} to {target} (Step-by-Step)",
    descriptionPattern:
      "Learn how to convert {source} to {target} with practical settings, output checks, and a free conversion workflow.",
    introPattern:
      "If you are figuring out how to convert {source} to {target}, begin with destination requirements and then run a clean conversion workflow with output validation.",
  },
  {
    slug: "file-convert-online",
    phrase: "{source} to {target} converter online",
    phraseSlug: "online",
    titlePattern: "{source} to {target} Converter Online (Fast Free Guide)",
    descriptionPattern:
      "Use this {source} to {target} converter online guide to run fast conversions and avoid common compatibility issues.",
    introPattern:
      "This {source} to {target} converter online workflow is designed for quick turnarounds while keeping exports compatible with typical upload platforms.",
  },
  {
    slug: "file-convert-best",
    phrase: "best way to convert {source} to {target}",
    phraseSlug: "best",
    titlePattern: "Best Way to Convert {source} to {target} (Free Workflow)",
    descriptionPattern:
      "Find the best way to convert {source} to {target} with practical settings, quality notes, and direct tool routing.",
    introPattern:
      "For most use cases, the best way to convert {source} to {target} is a single-pass conversion from your best source file, followed by quick validation checks.",
  },
];

export const fileConvertEntities: FileConvertEntity[] = buildFileConvertEntities();
