import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "High Pass Filter Audio Online | VCM Suite",
  description: "Free high pass filter audio online tool to remove low-end rumble. Adjust cutoff and Q, then export WAV.",
  keywords: "high pass filter audio online, remove low frequencies online, audio highpass tool, high pass filter free",
  alternates: { canonical: "/tools/audio-high-pass-filter" },
  openGraph: {
    title: "High Pass Filter Audio Online | VCM Suite",
    description: "Free high pass filter audio online tool to remove low-end rumble. Adjust cutoff and Q, then export WAV.",
    url: "/tools/audio-high-pass-filter",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this high pass filter audio online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "What does a high-pass filter do?", acceptedAnswer: { "@type": "Answer", text: "It removes low frequencies while leaving higher content in place." } },
    { "@type": "Question", name: "Can I target rumble and handling noise?", acceptedAnswer: { "@type": "Answer", text: "Yes. Raise cutoff gradually until unwanted low-end is reduced." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="High Pass Filter Audio Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">High Pass Filter Audio Online</h1>
          <p className="text-gray-600 mt-3">Remove low-end rumble and clean up muddy recordings quickly.</p>
        </div>

        <AudioEffectTool kind="high-pass" toolId="audio-high-pass-filter" downloadName="vcm-audio-high-pass.wav" />

        <AudioSeoSections
          keyword="high pass filter audio online"
          introTitle="Clean Low-End Noise in Seconds"
          introBody="Use this"
          introBody2="workflow to remove rumble, plosives, and low-end buildup before further processing."
          controls={[
            { title: "Cutoff Frequency", description: "Set where low frequencies are reduced." },
            { title: "Resonance (Q)", description: "Add or reduce emphasis around the cutoff point." },
            { title: "Wet / Dry Mix", description: "Blend filtered and original signal for transparent cleanup." },
          ]}
          howToTitle="How to Use This High-Pass Filter"
          steps={["Upload audio.", "Raise cutoff until rumble is controlled.", "Adjust Q for smoother transition.", "Use bypass A/B to compare.", "Download WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Podcast voice cleanup", "Vocal plosive reduction", "Guitar and synth low-end trim", "Pre-mix stem cleanup"]}
          relatedTitle="Pair With Compressor"
          relatedBody="After high-pass cleanup, use compression for stable loudness and better clarity. Save the setup as a preset to reuse."
          accentClassName="border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-high-pass-filter" />
      </div>
    </div>
  );
}
