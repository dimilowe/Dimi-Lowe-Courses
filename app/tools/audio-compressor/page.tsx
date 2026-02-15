import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Compressor Online | VCM Suite",
  description: "Free audio compressor online with threshold, ratio, attack, and release controls. Preview and export WAV.",
  keywords: "audio compressor online, compress audio online free, dynamics compressor tool, vocal compressor online",
  alternates: { canonical: "/tools/audio-compressor" },
  openGraph: {
    title: "Audio Compressor Online | VCM Suite",
    description: "Free audio compressor online with threshold, ratio, attack, and release controls. Preview and export WAV.",
    url: "/tools/audio-compressor",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this audio compressor online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "Can I adjust threshold, ratio, attack, and release?", acceptedAnswer: { "@type": "Answer", text: "Yes. Full core compressor controls are included." } },
    { "@type": "Question", name: "Is this useful for quick vocal leveling?", acceptedAnswer: { "@type": "Answer", text: "Yes. It is ideal for quick dynamics control before deeper mixing." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Compressor Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Compressor Online</h1>
          <p className="text-gray-600 mt-3">Control dynamics fast with threshold, ratio, attack, and release.</p>
        </div>

        <AudioEffectTool kind="compressor" toolId="audio-compressor" downloadName="vcm-audio-compressor.wav" />

        <AudioSeoSections
          keyword="audio compressor online"
          introTitle="Fast Dynamics Control Without Plugin Setup"
          introBody="Use this"
          introBody2="workflow to tighten peaks, raise consistency, and make tracks sit better in a mix."
          controls={[
            { title: "Threshold", description: "Set where compression begins to tame dynamic peaks." },
            { title: "Ratio", description: "Choose how strongly signal is compressed once it crosses threshold." },
            { title: "Attack / Release", description: "Shape transient behavior and recovery speed for musical results." },
          ]}
          howToTitle="How to Use This Compressor"
          steps={["Upload audio.", "Lower threshold until compression engages.", "Set ratio for desired control level.", "Tune attack/release for feel.", "Preview and download WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Vocal leveling", "Drum bus control", "Podcast voice consistency", "Pre-master prep"]}
          relatedTitle="Pair With Limiter"
          relatedBody="Use compression for tone and movement, then limiter for peak safety. Save the combo as a reusable preset."
          accentClassName="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-compressor" />
      </div>
    </div>
  );
}
