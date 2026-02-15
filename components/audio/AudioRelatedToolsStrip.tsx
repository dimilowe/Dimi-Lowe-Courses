import Link from "next/link";

const AUDIO_TOOLS = [
  { slug: "audio-bitcrusher", label: "Audio Bitcrusher" },
  { slug: "audio-pitch-shift", label: "Audio Pitch Shift" },
  { slug: "audio-reverb", label: "Audio Reverb" },
  { slug: "audio-delay", label: "Audio Delay" },
  { slug: "audio-compressor", label: "Audio Compressor" },
  { slug: "audio-limiter", label: "Audio Limiter" },
  { slug: "audio-high-pass-filter", label: "High-Pass Filter" },
  { slug: "audio-low-pass-filter", label: "Low-Pass Filter" },
  { slug: "audio-effect-chain-builder", label: "Effect Chain Builder" },
  { slug: "vocal-effects-chain", label: "Vocal Effects Chain" },
];

export default function AudioRelatedToolsStrip({ currentSlug }: { currentSlug: string }) {
  const related = AUDIO_TOOLS.filter((t) => t.slug !== currentSlug);

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">Related Audio Tools</h2>
      <p className="mt-2 text-gray-600">
        Build a full workflow by combining effects and comparing outputs across tools.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {related.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            {tool.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
