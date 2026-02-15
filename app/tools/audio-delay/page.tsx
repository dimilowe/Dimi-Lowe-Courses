import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Delay Effect Online | VCM Suite",
  description: "Free audio delay effect online tool with delay time, feedback, and wet/dry control. Preview and export WAV.",
  keywords: "audio delay effect online, delay audio online, free delay effect, echo effect tool",
  alternates: { canonical: "/tools/audio-delay" },
  openGraph: {
    title: "Audio Delay Effect Online | VCM Suite",
    description: "Free audio delay effect online tool with delay time, feedback, and wet/dry control. Preview and export WAV.",
    url: "/tools/audio-delay",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is this audio delay effect online tool free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." } },
    { "@type": "Question", name: "Can I set delay time and feedback?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can tune both delay time and repeat intensity." } },
    { "@type": "Question", name: "Can I use subtle slapback or long repeats?", acceptedAnswer: { "@type": "Answer", text: "Yes. Lower delay for slapback, higher delay and feedback for wider repeats." } },
    { "@type": "Question", name: "Does my audio upload to your server?", acceptedAnswer: { "@type": "Answer", text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback." } },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Delay Effect Online" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Delay Effect Online</h1>
          <p className="text-gray-600 mt-3">Create slapback, echo, and rhythmic repeats with precise delay control.</p>
        </div>

        <AudioEffectTool kind="delay" toolId="audio-delay" downloadName="vcm-audio-delay.wav" />

        <AudioSeoSections
          keyword="audio delay effect online"
          introTitle="Create Echo and Space in Seconds"
          introBody="This"
          introBody2="tool is built for quick repeat FX, from tight vocal slapback to long ambient tails."
          controls={[
            { title: "Delay Time", description: "Set repeat timing for slapback, groove, or atmospheric trails." },
            { title: "Feedback", description: "Control how many repeats you hear and how long they decay." },
            { title: "Wet / Dry Mix", description: "Keep the source upfront or push it deeper into echo texture." },
          ]}
          howToTitle="How to Use This Delay Tool"
          steps={["Upload audio.", "Set delay time.", "Increase feedback for extra repeats.", "Blend with wet/dry mix.", "Preview and download WAV."]}
          useCasesTitle="Best Use Cases"
          useCases={["Vocal slapback for presence", "Guitar echo patterns", "Dub-style transitions", "Sound design repeats"]}
          relatedTitle="Stack Delay With Reverb"
          relatedBody="Use delay first for rhythmic movement, then light reverb for depth. Save your chain as a preset for faster repeat work."
          accentClassName="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-delay" />
      </div>
    </div>
  );
}
