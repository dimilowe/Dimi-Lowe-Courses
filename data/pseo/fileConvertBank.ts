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

export const fileConvertTemplates: FileConvertTemplate[] = [
  {
    slug: "file-convert-main",
    phrase: "convert {source} to {target}",
    phraseSlug: "convert",
    titlePattern: "Convert {source} to {target} Online Free | Fast {source} to {target} Workflow",
    descriptionPattern:
      "Convert {source} to {target} online with a simple browser workflow. Includes compatibility tips and the best VCM tool path.",
    introPattern:
      "To convert {source} to {target}, use a browser-first workflow that preserves quality and avoids unnecessary recompression. This page gives you the exact conversion path plus practical compatibility notes.",
  },
  {
    slug: "file-convert-converter",
    phrase: "{source} to {target} converter",
    phraseSlug: "converter",
    titlePattern: "{source} to {target} Converter (Free, No Install)",
    descriptionPattern:
      "Need a {source} to {target} converter? Follow this direct method and launch the right tool for clean output and cross-platform compatibility.",
    introPattern:
      "A {source} to {target} converter workflow should prioritize output compatibility, file size control, and minimal quality loss. Use the steps below to convert quickly and safely.",
  },
  {
    slug: "file-convert-how-to",
    phrase: "how to convert {source} to {target}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {source} to {target} (Step-by-Step Guide)",
    descriptionPattern:
      "Learn how to convert {source} to {target} with a practical step-by-step process, output notes, and the best free tool entry point.",
    introPattern:
      "If you are figuring out how to convert {source} to {target}, start with the format requirements of your destination platform. Then use the recommended VCM tool workflow to generate a usable final file.",
  },
];

export const fileConvertEntities: FileConvertEntity[] = [
  {
    key: "webp-to-jpg",
    name: "WEBP to JPG",
    sourceFormat: "WEBP",
    targetFormat: "JPG",
    category: "image",
    toolSlug: "webp-to-jpg",
    bestFor: "Uploading modern web images to apps that prefer JPG.",
    notes: "JPG is broadly supported; tune quality for size vs detail.",
    priority: 1,
  },
  {
    key: "webp-to-png",
    name: "WEBP to PNG",
    sourceFormat: "WEBP",
    targetFormat: "PNG",
    category: "image",
    toolSlug: "webp-to-jpg",
    bestFor: "Cases where lossless quality or transparency is needed.",
    notes: "PNG files are larger but preserve edge detail cleanly.",
    priority: 2,
  },
  {
    key: "png-to-jpg",
    name: "PNG to JPG",
    sourceFormat: "PNG",
    targetFormat: "JPG",
    category: "image",
    toolSlug: "webp-to-jpg",
    bestFor: "Reducing file size for email, web pages, and ad uploads.",
    notes: "Flatten transparency before export when needed.",
    priority: 3,
  },
  {
    key: "jpg-to-webp",
    name: "JPG to WEBP",
    sourceFormat: "JPG",
    targetFormat: "WEBP",
    category: "image",
    toolSlug: "webp-to-jpg",
    bestFor: "Optimizing legacy JPG files for modern web performance.",
    notes: "WEBP can provide smaller files at similar perceived quality.",
    priority: 4,
  },
  {
    key: "heic-to-jpg",
    name: "HEIC to JPG",
    sourceFormat: "HEIC",
    targetFormat: "JPG",
    category: "image",
    toolSlug: "heic-to-jpg",
    bestFor: "Converting iPhone photos for universal compatibility.",
    notes: "JPG works reliably across browsers, apps, and CMS uploads.",
    priority: 5,
  },
  {
    key: "heic-to-png",
    name: "HEIC to PNG",
    sourceFormat: "HEIC",
    targetFormat: "PNG",
    category: "image",
    toolSlug: "heic-to-jpg",
    bestFor: "Preserving image detail where lossless output matters.",
    notes: "PNG can be large; optimize dimensions when possible.",
    priority: 6,
  },
  {
    key: "heic-to-webp",
    name: "HEIC to WEBP",
    sourceFormat: "HEIC",
    targetFormat: "WEBP",
    category: "image",
    toolSlug: "heic-to-jpg",
    bestFor: "Balancing quality and file size for web publishing.",
    notes: "WEBP support is excellent on modern platforms.",
    priority: 7,
  },
  {
    key: "m4a-to-mp3",
    name: "M4A to MP3",
    sourceFormat: "M4A",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Sharing voice notes and music on tools requiring MP3.",
    notes: "Use a moderate bitrate to control size without harsh artifacts.",
    priority: 8,
  },
  {
    key: "m4a-to-wav",
    name: "M4A to WAV",
    sourceFormat: "M4A",
    targetFormat: "WAV",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Editing audio in DAWs that expect WAV input.",
    notes: "WAV is less compressed and easier for downstream processing.",
    priority: 9,
  },
  {
    key: "wav-to-mp3",
    name: "WAV to MP3",
    sourceFormat: "WAV",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Compressing large WAV files for delivery and publishing.",
    notes: "Choose bitrate based on voice vs music use case.",
    priority: 10,
  },
  {
    key: "aac-to-mp3",
    name: "AAC to MP3",
    sourceFormat: "AAC",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Normalizing audio for broad player compatibility.",
    notes: "MP3 remains the most universally accepted upload format.",
    priority: 11,
  },
  {
    key: "flac-to-mp3",
    name: "FLAC to MP3",
    sourceFormat: "FLAC",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Reducing high-fidelity archives to portable MP3 files.",
    notes: "Batch convert while preserving track naming conventions.",
    priority: 12,
  },
  {
    key: "voice-memo-to-mp3",
    name: "Voice Memo to MP3",
    sourceFormat: "Voice Memo",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Turning phone voice memos into shareable MP3 clips.",
    notes: "Trim silence before export for tighter files.",
    priority: 13,
  },
  {
    key: "podcast-m4a-to-mp3",
    name: "Podcast M4A to MP3",
    sourceFormat: "Podcast M4A",
    targetFormat: "MP3",
    category: "audio",
    toolSlug: "m4a-to-mp3-conversion",
    bestFor: "Publishing podcast episodes to MP3-only distributions.",
    notes: "Keep loudness normalization consistent across episodes.",
    priority: 14,
  },
  {
    key: "wav-to-midi",
    name: "WAV to MIDI",
    sourceFormat: "WAV",
    targetFormat: "MIDI",
    category: "music",
    toolSlug: "audio-to-midi",
    bestFor: "Extracting note data from melodic audio for production.",
    notes: "Cleaner monophonic input produces better MIDI output.",
    priority: 15,
  },
  {
    key: "mp3-to-midi",
    name: "MP3 to MIDI",
    sourceFormat: "MP3",
    targetFormat: "MIDI",
    category: "music",
    toolSlug: "audio-to-midi",
    bestFor: "Rebuilding melodies and experimenting in a DAW.",
    notes: "Use dry vocal or lead lines for clearer note tracking.",
    priority: 16,
  },
  {
    key: "guitar-audio-to-midi",
    name: "Guitar Audio to MIDI",
    sourceFormat: "Guitar Audio",
    targetFormat: "MIDI",
    category: "music",
    toolSlug: "audio-to-midi",
    bestFor: "Translating guitar ideas into editable MIDI notes.",
    notes: "Single-note lines are easier to convert than dense chords.",
    priority: 17,
  },
  {
    key: "vocal-audio-to-midi",
    name: "Vocal Audio to MIDI",
    sourceFormat: "Vocal Audio",
    targetFormat: "MIDI",
    category: "music",
    toolSlug: "vocal-melody-extractor",
    bestFor: "Capturing sung melodies as MIDI for arrangement work.",
    notes: "Stable pitch and low background noise improve extraction.",
    priority: 18,
  },
];
