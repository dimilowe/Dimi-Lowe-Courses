import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Limiter Online | VCM Suite",
  description: "Free audio limiter online to catch peaks and improve loudness control. Preview and export WAV.",
  keywords: "audio limiter online, limit audio online, peak limiter tool, free audio limiter",
  alternates: { canonical: "/tools/audio-limiter" },
  openGraph: {
    title: "Audio Limiter Online | VCM Suite",
    description: "Free audio limiter online to catch peaks and improve loudness control. Preview and export WAV.",
    url: "/tools/audio-limiter",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this audio limiter online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "What is the difference between limiter and compressor?", acceptedAnswer: { "@type": "Answer", text: "Limiter is stronger peak protection, while compressor is broader dynamics shaping." } },
    { "@type": "Question", name: "Can I use this to avoid clipping?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limiting helps keep peaks under control before export." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Limiter Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Limiter Online</h1>
          <p className="text-gray-600 mt-3">Catch peaks fast and keep outputs controlled before final export.</p>
        </div>

        <AudioEffectTool kind="limiter" toolId="audio-limiter" downloadName="vcm-audio-limiter.wav" />

        <AudioSeoSections
          keyword="audio limiter online"
          introTitle="Peak Control for Cleaner Exports"
          introBody="This"
          introBody2="tool is ideal when you need louder, safer output without clipping artifacts."
          controls={[
            { title: "Threshold", description: "Set the ceiling where peak protection engages." },
            { title: "Release", description: "Control how quickly the limiter recovers after peak reduction." },
            { title: "Output Gain", description: "Balance loudness while keeping peak behavior stable." },
          ]}
          howToTitle="How to Use This Limiter"
          steps={["Upload audio.", "Lower threshold to catch peaks.", "Adjust release for smoother dynamics.", "Check with bypass A/B.", "Download processed WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Prevent clipping before upload", "Tighten podcast peaks", "Control vocal spikes", "Loudness prep for social clips"]}
          relatedTitle="Limiter + Compressor Workflow"
          relatedBody="Use compression first for tone and dynamic shape, then limiter last for peak safety. Save the chain as a reusable preset."
          accentClassName="border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-limiter" />
      </div>
    </div>
  );
}
