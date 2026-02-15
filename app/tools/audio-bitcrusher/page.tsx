import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Bitcrusher Online | VCM Suite",
  description:
    "Use a free audio bitcrusher online to add lo-fi digital grit. Control bit depth and downsample, preview fast, and export WAV.",
  keywords:
    "bitcrusher, audio bitcrusher online, free bitcrusher, bitcrusher effect, lo fi audio effect, reduce bit depth audio, downsample audio",
  alternates: { canonical: "/tools/audio-bitcrusher" },
  openGraph: {
    title: "Audio Bitcrusher Online | VCM Suite",
    description:
      "Use a free audio bitcrusher online to add lo-fi digital grit. Control bit depth and downsample, preview fast, and export WAV.",
    url: "/tools/audio-bitcrusher",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this audio bitcrusher online tool free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can upload audio, apply settings, preview, and export for free."
      }
    },
    {
      "@type": "Question",
      name: "Does my audio upload to your server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback."
      }
    },
    {
      "@type": "Question",
      name: "What does a bitcrusher do to audio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A bitcrusher lowers resolution by reducing bit depth and sample detail, creating crunchy, lo-fi digital distortion."
      }
    },
    {
      "@type": "Question",
      name: "How do I get subtle bitcrusher texture instead of heavy distortion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Start with higher bit depth and lighter downsample values, then blend with wet/dry mix to preserve clarity."
      }
    }
  ]
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Bitcrusher Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Bitcrusher Online</h1>
          <p className="text-gray-600 mt-3">Create lo-fi digital texture with bit depth and downsample controls. Preview and export instantly.</p>
        </div>

        <AudioEffectTool kind="bitcrusher" toolId="audio-bitcrusher" downloadName="vcm-audio-bitcrusher.wav" />

        <section className="mt-10 rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-indigo-50 p-7">
          <h2 className="text-2xl font-bold text-gray-900">Free Bitcrusher for Fast Lo-Fi Sound Design</h2>
          <p className="mt-3 text-gray-700 leading-relaxed">
            If you searched for <strong>bitcrusher</strong>, this is the exact workflow: drop in audio, dial in
            bit depth and downsample, then export a ready-to-use WAV. No plugin install, no DAW setup, no waiting.
            This tool is built for creators who want quick texture for drums, vocals, leads, transitions, and sound FX.
          </p>
          <p className="mt-3 text-gray-700 leading-relaxed">
            Preview playback is instant in your browser. Download rendering uses Spotify Pedalboard on the server when
            available, with browser fallback so you still get an output file reliably.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900">Bit Depth</h3>
            <p className="mt-2 text-sm text-gray-600">
              Lower values add crunchy digital breakup. Higher values keep more detail and a cleaner tone.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900">Downsample</h3>
            <p className="mt-2 text-sm text-gray-600">
              Reduces time resolution for gritty aliasing artifacts. Great for retro, game-like, and aggressive textures.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900">Wet / Dry Mix</h3>
            <p className="mt-2 text-sm text-gray-600">
              Blend crushed tone with original audio to keep transients clear while adding character.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">How to Use This Audio Bitcrusher Online</h2>
          <ol className="mt-4 space-y-3 text-gray-700">
            <li><strong>1.</strong> Upload your audio file.</li>
            <li><strong>2.</strong> Lower <em>Bit Depth</em> for stronger digital crunch.</li>
            <li><strong>3.</strong> Raise <em>Downsample</em> for rougher lo-fi character.</li>
            <li><strong>4.</strong> Use <em>Wet/Dry Mix</em> to balance clarity and texture.</li>
            <li><strong>5.</strong> Preview, then download your processed WAV.</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Best Use Cases for Bitcrusher</h2>
          <ul className="mt-4 grid gap-3 text-gray-700 md:grid-cols-2">
            <li className="rounded-lg bg-gray-50 p-3">Lo-fi drum layers and crunchy percussion tops</li>
            <li className="rounded-lg bg-gray-50 p-3">Vocal ad-libs and texture doubles</li>
            <li className="rounded-lg bg-gray-50 p-3">Retro synth leads and chiptune style tones</li>
            <li className="rounded-lg bg-gray-50 p-3">Transitions, risers, and glitch FX moments</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Related Audio Effects You Can Stack</h2>
          <p className="mt-3 text-gray-700">
            After bitcrushing, many creators add space and movement with delay/reverb or control peaks using compression.
            Try combining this with your saved presets to build repeatable sound design chains across sessions.
          </p>
        </section>

        <AudioRelatedToolsStrip currentSlug="audio-bitcrusher" />
      </div>
    </div>
  );
}
