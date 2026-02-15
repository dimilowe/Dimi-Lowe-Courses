import { createDbPool, getDbTarget } from "./db/connection";

type ToolSeed = {
  slug: string;
  name: string;
  description: string;
  primaryKeyword: string;
  icon: string;
  iconBg: string;
};

const TOOLS: ToolSeed[] = [
  {
    slug: "audio-pitch-shift",
    name: "Audio Pitch Shift Online Free",
    description: "Shift pitch up or down in semitones with in-browser preview and WAV export.",
    primaryKeyword: "audio pitch shift online free",
    icon: "Music",
    iconBg: "bg-violet-600",
  },
  {
    slug: "audio-reverb",
    name: "Audio Reverb Online",
    description: "Add reverb ambience with room size, damping, and pre-delay controls.",
    primaryKeyword: "audio reverb online",
    icon: "Heart",
    iconBg: "bg-indigo-500",
  },
  {
    slug: "audio-delay",
    name: "Audio Delay Effect Online",
    description: "Apply delay repeats with feedback and wet/dry mix controls.",
    primaryKeyword: "audio delay effect online",
    icon: "RotateCcw",
    iconBg: "bg-amber-500",
  },
  {
    slug: "audio-compressor",
    name: "Audio Compressor Online",
    description: "Control dynamics with threshold, ratio, attack, and release settings.",
    primaryKeyword: "audio compressor online",
    icon: "TrendingUp",
    iconBg: "bg-emerald-500",
  },
  {
    slug: "audio-limiter",
    name: "Audio Limiter Online",
    description: "Catch peaks and manage loudness using limiter-style controls.",
    primaryKeyword: "audio limiter online",
    icon: "Target",
    iconBg: "bg-red-500",
  },
  {
    slug: "audio-high-pass-filter",
    name: "High Pass Filter Audio Online",
    description: "Remove low-end rumble with a high-pass filter and resonance control.",
    primaryKeyword: "high pass filter audio online",
    icon: "Search",
    iconBg: "bg-cyan-500",
  },
  {
    slug: "audio-low-pass-filter",
    name: "Low Pass Filter Audio Online",
    description: "Reduce harsh high-end frequencies with a low-pass filter.",
    primaryKeyword: "low pass filter audio online",
    icon: "CloudSun",
    iconBg: "bg-blue-500",
  },
  {
    slug: "audio-bitcrusher",
    name: "Audio Bitcrusher Online",
    description: "Create lo-fi digital textures using bit depth and downsample controls.",
    primaryKeyword: "audio bitcrusher online",
    icon: "Package",
    iconBg: "bg-fuchsia-600",
  },
  {
    slug: "audio-effect-chain-builder",
    name: "Audio Effect Chain Builder",
    description: "Build your own chain with compressor, EQ, reverb, and delay in one tool.",
    primaryKeyword: "audio effect chain builder",
    icon: "GitBranch",
    iconBg: "bg-orange-500",
  },
  {
    slug: "vocal-effects-chain",
    name: "Vocal Effects Chain Tool",
    description: "Shape vocals with compression, EQ cleanup, reverb space, and delay depth.",
    primaryKeyword: "vocal effects chain tool",
    icon: "FileText",
    iconBg: "bg-pink-500",
  },
];

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const query = (text: string, params?: unknown[]) => pool.query(text, params);

  console.log(`[seed:audio] target=${target}`);

  try {
    for (const tool of TOOLS) {
      await query(
        `INSERT INTO tools (
        slug, name, description, engine, status, is_indexed, in_directory,
        category, tags, icon, icon_bg, priority, input_type, output_type,
        primary_keyword, search_intent, source, required_clouds, required_tier,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'standalone', 'published', true, true,
        'utilities', ARRAY['utilities']::text[], $5, $6, 42, 'file', 'file',
        $4, 'action', 'manual', ARRAY[]::text[], 'free',
        NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = 'published',
        is_indexed = true,
        in_directory = true,
        category = 'utilities',
        tags = ARRAY['utilities']::text[],
        icon = EXCLUDED.icon,
        icon_bg = EXCLUDED.icon_bg,
        input_type = 'file',
        output_type = 'file',
        primary_keyword = EXCLUDED.primary_keyword,
        search_intent = 'action',
        source = 'manual',
        required_clouds = ARRAY[]::text[],
        required_tier = 'free',
        updated_at = NOW()`,
        [tool.slug, tool.name, tool.description, tool.primaryKeyword, tool.icon, tool.iconBg]
      );

      await query(
        `INSERT INTO global_urls (url, type, title, is_indexed, indexed_at, updated_at)
       VALUES ($1, 'tool', $2, true, NOW(), NOW())
       ON CONFLICT (url) DO UPDATE SET
         type = 'tool',
         title = EXCLUDED.title,
         is_indexed = true,
         indexed_at = NOW(),
         updated_at = NOW()`,
        [`/tools/${tool.slug}`, tool.name]
      );

      console.log(`seeded: ${tool.slug}`);
    }

    console.log("Done seeding audio tools.");
  } finally {
    await pool.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
