import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Low Pass Filter Audio Online | VCM Suite",
  description: "Free low pass filter audio online tool to reduce harsh highs. Control cutoff and Q, preview, and export WAV.",
  keywords: "low pass filter audio online, reduce high frequencies online, audio lowpass filter free, low pass effect tool",
  alternates: { canonical: "/tools/audio-low-pass-filter" },
  openGraph: {
    title: "Low Pass Filter Audio Online | VCM Suite",
    description: "Free low pass filter audio online tool to reduce harsh highs. Control cutoff and Q, preview, and export WAV.",
    url: "/tools/audio-low-pass-filter",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this low pass filter audio online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "What does a low-pass filter do?", acceptedAnswer: { "@type": "Answer", text: "It reduces high frequencies and keeps lower content more prominent." } },
    { "@type": "Question", name: "Can I soften harsh recordings?", acceptedAnswer: { "@type": "Answer", text: "Yes. Lower the cutoff to remove brittle highs and smooth the tone." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Low Pass Filter Audio Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Low Pass Filter Audio Online</h1>
          <p className="text-gray-600 mt-3">Smooth harsh top-end and shape warmer tone quickly.</p>
        </div>

        <AudioEffectTool kind="low-pass" toolId="audio-low-pass-filter" downloadName="vcm-audio-low-pass.wav" />

        <AudioSeoSections
          keyword="low pass filter audio online"
          introTitle="Soften High-End Harshness Quickly"
          introBody="This"
          introBody2="tool helps tame bright, brittle, or noisy highs in vocals, synths, and FX layers."
          controls={[
            { title: "Cutoff Frequency", description: "Lower the cutoff to remove more high-frequency content." },
            { title: "Resonance (Q)", description: "Shape edge around cutoff for smooth or more character-heavy results." },
            { title: "Wet / Dry Mix", description: "Blend filtered and original signal to keep clarity while reducing harshness." },
          ]}
          howToTitle="How to Use This Low-Pass Filter"
          steps={["Upload audio.", "Lower cutoff to reduce highs.", "Adjust Q for tone character.", "Compare with bypass.", "Download processed WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Harsh vocal smoothing", "Lo-fi tone shaping", "Sound design darkening", "Top-end control before mastering"]}
          relatedTitle="Pair With Bitcrusher"
          relatedBody="Use low-pass after bitcrusher to tame aggressive digital highs and create smoother lo-fi textures."
          accentClassName="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-low-pass-filter" />
      </div>
    </div>
  );
}
