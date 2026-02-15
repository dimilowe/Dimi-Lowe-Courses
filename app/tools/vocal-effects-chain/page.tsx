import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Vocal Effects Chain Tool | VCM Suite",
  description: "Free vocal effects chain tool with compression, EQ, reverb, and delay controls. Preview and export WAV.",
  keywords: "vocal effects chain tool, vocal chain online, vocal processing online free, vocal fx chain",
  alternates: { canonical: "/tools/vocal-effects-chain" },
  openGraph: {
    title: "Vocal Effects Chain Tool | VCM Suite",
    description: "Free vocal effects chain tool with compression, EQ, reverb, and delay controls. Preview and export WAV.",
    url: "/tools/vocal-effects-chain",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this vocal effects chain tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "Can I build a basic vocal chain here?", acceptedAnswer: { "@type": "Answer", text: "Yes. Compression, EQ, reverb, and delay are included." } },
    { "@type": "Question", name: "Is this good for quick demos and social clips?", acceptedAnswer: { "@type": "Answer", text: "Yes. It is designed for fast vocal polish workflows." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Vocal Effects Chain Tool" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Vocal Effects Chain Tool</h1>
          <p className="text-gray-600 mt-3">Polish vocals quickly with compression, EQ cleanup, reverb space, and delay depth.</p>
        </div>

        <AudioEffectTool kind="vocal-chain" toolId="vocal-effects-chain" downloadName="vcm-vocal-effects-chain.wav" />

        <AudioSeoSections
          keyword="vocal effects chain tool"
          introTitle="Build a Clean Vocal Chain Fast"
          introBody="If you need a"
          introBody2="for quick content output, this page gives you the exact controls you use most often."
          controls={[
            { title: "Compressor", description: "Stabilize vocal levels so words stay consistent." },
            { title: "EQ Cleanup", description: "Trim low-end buildup and improve intelligibility." },
            { title: "Reverb + Delay", description: "Add depth and width while keeping the vocal upfront." },
          ]}
          howToTitle="How to Use This Vocal Chain"
          steps={["Upload vocal audio.", "Enable chain modules.", "Adjust compressor and EQ first.", "Add reverb and delay to taste.", "Preview and download WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Song demo vocals", "Podcast and narration polish", "Hook and ad-lib prep", "Short-form content audio"]}
          relatedTitle="Save and Reuse Chain Presets"
          relatedBody="If you use similar vocal settings repeatedly, saved presets remove setup friction and improve consistency across projects."
          accentClassName="border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50"
        />

        <AudioRelatedToolsStrip currentSlug="vocal-effects-chain" />
      </div>
    </div>
  );
}
