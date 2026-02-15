import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Effect Chain Builder | VCM Suite",
  description: "Build an audio effect chain online with compressor, EQ, reverb, and delay. Preview and export WAV.",
  keywords: "audio effect chain builder, audio fx chain online, build audio chain free, audio processing chain",
  alternates: { canonical: "/tools/audio-effect-chain-builder" },
  openGraph: {
    title: "Audio Effect Chain Builder | VCM Suite",
    description: "Build an audio effect chain online with compressor, EQ, reverb, and delay. Preview and export WAV.",
    url: "/tools/audio-effect-chain-builder",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this audio effect chain builder free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "Which effects can I combine?", acceptedAnswer: { "@type": "Answer", text: "You can chain compressor, EQ, reverb, and delay." } },
    { "@type": "Question", name: "Can I save effect chain presets?", acceptedAnswer: { "@type": "Answer", text: "Yes, with a subscription you can save and reuse presets." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Effect Chain Builder" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Effect Chain Builder</h1>
          <p className="text-gray-600 mt-3">Build practical effect chains fast with compressor, EQ, reverb, and delay.</p>
        </div>

        <AudioEffectTool kind="effect-chain" toolId="audio-effect-chain-builder" downloadName="vcm-audio-effect-chain.wav" />

        <AudioSeoSections
          keyword="audio effect chain builder"
          introTitle="Build Repeatable Audio Chains in One Place"
          introBody="Use this"
          introBody2="to create fast, production-ready effect stacks without plugin routing complexity."
          controls={[
            { title: "Chain Toggles", description: "Turn compressor, EQ, reverb, and delay on/off in one flow." },
            { title: "Core Parameters", description: "Dial threshold, ratio, cutoff, room size, delay, and feedback quickly." },
            { title: "Preset Saving", description: "Subscribers can store full chain settings for repeatable output." },
          ]}
          howToTitle="How to Build a Chain"
          steps={["Upload source audio.", "Toggle desired effects.", "Adjust core controls.", "A/B with bypass.", "Download WAV and save preset."]}
          useCasesTitle="Best Use Cases"
          useCases={["Vocal starter chains", "Creator voice cleanup", "Fast demo mastering", "Sound design templates"]}
          relatedTitle="Why Chains Convert Better"
          relatedBody="One-click chain presets reduce repeated setup work. That makes this tool ideal for recurring creator workflows."
          accentClassName="border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-effect-chain-builder" />
      </div>
    </div>
  );
}
