import type { Metadata } from "next";
import AudioEffectTool from "@/components/audio/AudioEffectTool";
import AudioSeoSections from "@/components/audio/AudioSeoSections";
import AudioRelatedToolsStrip from "@/components/audio/AudioRelatedToolsStrip";
import AudioToolsBreadcrumb from "@/components/audio/AudioToolsBreadcrumb";

export const metadata: Metadata = {
  title: "Audio Pitch Shift Online Free | VCM Suite",
  description:
    "Free audio pitch shift online tool. Shift semitones up or down, preview quickly, and export WAV.",
  keywords:
    "audio pitch shift online, free pitch shift audio, change pitch of audio online, semitone pitch shifter",
  alternates: { canonical: "/tools/audio-pitch-shift" },
  openGraph: {
    title: "Audio Pitch Shift Online Free | VCM Suite",
    description:
      "Free audio pitch shift online tool. Shift semitones up or down, preview quickly, and export WAV.",
    url: "/tools/audio-pitch-shift",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this audio pitch shift online tool free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Upload, preview, and export for free." },
    },
    {
      "@type": "Question",
      name: "Can I shift pitch up and down in semitones?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Use the Semitones control to raise or lower pitch." },
    },
    {
      "@type": "Question",
      name: "Does audio processing require local plugin install?",
      acceptedAnswer: { "@type": "Answer", text: "No plugin install is needed." },
    },
    {
      "@type": "Question",
      name: "Does my audio upload to your server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Preview runs in-browser. Download rendering uses server Pedalboard processing when available, with browser fallback.",
      },
    },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AudioToolsBreadcrumb currentTitle="Audio Pitch Shift Online Free" />
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">Free Audio Tool</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Audio Pitch Shift Online Free</h1>
          <p className="text-gray-600 mt-3">Shift pitch up or down in semitones. Preview quickly and export WAV.</p>
        </div>

        <AudioEffectTool kind="pitch-shift" toolId="audio-pitch-shift" downloadName="vcm-audio-pitch-shift.wav" />

        <AudioSeoSections
          keyword="audio pitch shift online"
          introTitle="Fast Audio Pitch Shift for Creators"
          introBody="If you need to"
          introBody2="without opening a DAW, this tool gives you a clean semitone workflow in a few clicks."
          controls={[
            { title: "Semitones", description: "Raise or lower pitch in musical steps for key matching and creative FX." },
            { title: "Wet / Dry Mix", description: "Blend processed and original signal for subtle tuning or full pitch character." },
            { title: "Output Gain", description: "Keep loudness under control after shifting so levels remain consistent." },
          ]}
          howToTitle="How to Use This Pitch Shifter"
          steps={[
            "Upload an audio file.",
            "Set semitones up or down.",
            "Adjust wet/dry mix for subtle or heavy effect.",
            "Preview and compare using bypass.",
            "Download processed WAV.",
          ]}
          useCasesTitle="Best Use Cases"
          useCases={[
            "Transpose vocals to fit a new key",
            "Creative ad-lib and harmony textures",
            "Pitch FX for intros and transitions",
            "Quick stem prep before full mix session",
          ]}
          relatedTitle="Stack With Other Effects"
          relatedBody="After pitch shift, use compression, reverb, or delay to seat the sound in your mix and save the chain as a reusable preset."
          accentClassName="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50"
        />

        <AudioRelatedToolsStrip currentSlug="audio-pitch-shift" />
      </div>
    </div>
  );
}
