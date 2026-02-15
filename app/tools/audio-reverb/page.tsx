import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Reverb Online | VCM Suite",
  description: "Free audio reverb online with room size, damping, and pre-delay controls. Preview and export WAV.",
  keywords: "audio reverb online, free reverb tool, add reverb to audio online, reverb effect online",
  alternates: { canonical: "/tools/audio-reverb" },
  openGraph: {
    title: "Audio Reverb Online | VCM Suite",
    description: "Free audio reverb online with room size, damping, and pre-delay controls. Preview and export WAV.",
    url: "/tools/audio-reverb",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this audio reverb online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "Can I control room size and damping?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can shape space and tone with room size, damping, and pre-delay." } },
    { "@type": "Question", name: "Does this replace a DAW plugin for quick tasks?", acceptedAnswer: { "@type": "Answer", text: "For quick reverb passes, yes. It is built for fast browser workflow." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Reverb Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Reverb Online</h1>
          <p className="text-gray-600 mt-3">Add natural space and depth with room size, damping, and pre-delay control.</p>
        </div>

        <AudioEffectTool kind="reverb" toolId="audio-reverb" downloadName="vcm-audio-reverb.wav" />

        <AudioSeoSections
          keyword="audio reverb online"
          introTitle="Add Space and Depth Without Opening a DAW"
          introBody="Use this"
          introBody2="workflow to place dry recordings in realistic or stylized rooms for vocals, instruments, and sound design."
          controls={[
            { title: "Room Size", description: "Increase size for bigger ambience, reduce for tighter room tone." },
            { title: "Damping", description: "Control brightness of the tail so reverb sits better in your mix." },
            { title: "Pre-delay", description: "Create separation between dry source and reverb bloom." },
          ]}
          howToTitle="How to Use This Reverb Tool"
          steps={["Upload audio.", "Set room size and damping.", "Tune pre-delay for clarity.", "Blend with wet/dry mix.", "Preview and download WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Vocal space and width", "Guitar ambience and sustain", "Podcast room polish", "Transition FX tails"]}
          relatedTitle="Pair With Compression and Delay"
          relatedBody="Apply light compression before reverb for control, then add delay for dimension. Save the chain as a preset to reuse across projects."
          accentClassName="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-reverb" />
      </div>
    </div>
  );
}
