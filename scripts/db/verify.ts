import { createDbPool, getDbTarget } from "./connection";

async function run() {
  const target = getDbTarget();
  const pool = createDbPool(target);
  const query = (text: string, params?: unknown[]) => pool.query(text, params);

  try {
    console.log(`[db:verify] target=${target}`);

    const toolsCount = await query(
      `SELECT COUNT(*)::int AS count FROM tools WHERE deleted_at IS NULL`,
    );
    console.log(`[db:verify] live tools: ${toolsCount.rows[0]?.count ?? 0}`);

    const audioTools = await query(
      `SELECT slug, icon, icon_bg, status, in_directory, is_indexed
       FROM tools
       WHERE slug = ANY($1::text[])
       ORDER BY slug ASC`,
      [[
        "audio-bitcrusher",
        "audio-compressor",
        "audio-delay",
        "audio-effect-chain-builder",
        "audio-limiter",
        "audio-pitch-shift",
        "audio-reverb",
        "audio-high-pass-filter",
        "audio-low-pass-filter",
        "vocal-effects-chain",
      ]],
    );

    console.log("[db:verify] audio tool rows:");
    for (const row of audioTools.rows) {
      console.log(
        `  - ${row.slug} | icon=${row.icon} | bg=${row.icon_bg} | status=${row.status} | in_directory=${row.in_directory} | is_indexed=${row.is_indexed}`,
      );
    }

    const bpmTool = await query(
      `SELECT slug, status, in_directory, is_indexed, deleted_at
       FROM tools
       WHERE slug = 'bpm-key-chord-analyzer'
       LIMIT 1`,
    );

    if (bpmTool.rows.length > 0) {
      const row = bpmTool.rows[0];
      console.log(
        `[db:verify] bpm-key-chord-analyzer => status=${row.status}, in_directory=${row.in_directory}, is_indexed=${row.is_indexed}, deleted_at=${row.deleted_at}`,
      );
    } else {
      console.log("[db:verify] bpm-key-chord-analyzer row not present.");
    }
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[db:verify] Failed:", err);
  process.exit(1);
});
