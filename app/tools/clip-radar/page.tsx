import { Metadata } from "next";
import ClipRadarClient from "./ClipRadarClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "ClipRadar: Free YouTube Clip Finder from Transcript | Gaming Highlight Timestamps",
  description: "Paste a YouTube URL and ClipRadar scans the transcript to find clip-worthy moments. Get ranked highlight timestamps, auto clip windows, hook ideas, and export markers for editing. Free, no login.",
  keywords: [
    "youtube clip finder",
    "gaming clip finder",
    "clip marker",
    "youtube transcript clip detector",
    "highlight timestamps",
    "best moments finder",
    "clip timestamps generator",
    "premiere marker export",
    "davinci resolve markers",
    "youtube shorts clip ideas"
  ],
  openGraph: {
    title: "ClipRadar: Free YouTube Clip Finder from Transcript",
    description: "Paste a YouTube URL and ClipRadar scans the transcript to find clip-worthy moments. Get ranked highlight timestamps and export markers. Free, no login.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipRadar: Free YouTube Clip Finder from Transcript",
    description: "Paste a YouTube URL and ClipRadar scans the transcript to find clip-worthy moments. Get ranked highlight timestamps and export markers."
  }
};

const faqs = [
  {
    question: "What is ClipRadar?",
    answer: "ClipRadar is a free tool that analyzes YouTube video transcripts to find the best moments for clips. It detects emotional reactions, gaming events, audience engagement, and high-energy pacing to score and rank potential clip-worthy segments."
  },
  {
    question: "How does transcript-based clip detection work?",
    answer: "ClipRadar downloads the video's captions/subtitles and scans the text for signals like exclamations ('no way!', 'let's go!'), gaming events ('clutch', 'headshot', 'win'), audience addresses ('watch this', 'clip that'), and fast-paced speech. Each segment gets a score, and the highest-scoring non-overlapping moments are selected as clip candidates."
  },
  {
    question: "Does it work for any YouTube video?",
    answer: "ClipRadar works with any YouTube video that has captions enabled (either manual or auto-generated). If a video doesn't have captions, you'll need to enable them in YouTube Studio first, or the tool won't be able to analyze it."
  },
  {
    question: "Does it find silent gameplay highlights?",
    answer: "Not reliably. Since ClipRadar is transcript-based, it detects moments where you speak or react. Silent gameplay without commentary won't be detected. For best results, use it with content where you vocalize during key moments."
  },
  {
    question: "How do I export timestamps for video editing?",
    answer: "ClipRadar provides three export formats: 1) CSV with start/end times, titles, scores, and categories - perfect for spreadsheets. 2) YouTube timestamps (MM:SS format) for video descriptions. 3) Marker CSV that can be imported into video editors like DaVinci Resolve or Premiere Pro."
  },
  {
    question: "Can I use this for YouTube Shorts?",
    answer: "Yes! Use the 'short' window setting (10 seconds by default) to find moments perfect for Shorts and TikToks. The tool automatically generates clip windows of different lengths so you can pick what works best for each platform."
  },
  {
    question: "Is ClipRadar free?",
    answer: "Yes, ClipRadar is completely free to use with no login required. There are no hidden fees or premium features locked behind a paywall."
  },
  {
    question: "Do you store my transcripts?",
    answer: "No. Transcripts are processed in memory and not stored long-term. We fetch the transcript, analyze it, return your results, and then discard the data. Your content remains private."
  },
  {
    question: "What's the difference between the style modes?",
    answer: "The style modes adjust how ClipRadar weights different signals: 'Balanced' is the default all-around detection. 'Hype' prioritizes excitement and gaming events. 'Funny' looks for audience engagement and comedy moments. 'Rage' finds frustrated reactions. 'Educational' detects tutorial-style explanations."
  },
  {
    question: "Why are some high-energy moments not detected?",
    answer: "If you react without speaking (just gasping, for example), the transcript may not capture it. Auto-generated captions can also miss words or misinterpret speech. For best results, clearly vocalize your reactions during key moments."
  }
];

function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ClipRadar",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    description: "Paste a YouTube URL and ClipRadar scans the transcript to find clip-worthy moments. Get ranked highlight timestamps, auto clip windows, hook ideas, and export markers for editing.",
    featureList: [
      "Transcript-based clip detection",
      "Ranked highlight moments",
      "Multiple clip window sizes",
      "CSV export for spreadsheets",
      "YouTube timestamp generation",
      "Video editor marker export",
      "Style-based detection modes",
      "Score threshold customization"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ClipRadarPage() {
  return (
    <>
      <SoftwareApplicationSchema />
      <FAQSchema />
      
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Free YouTube Clip Finder
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ClipRadar
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Paste a YouTube URL and instantly find the best moments for clips. Get ranked timestamps, auto-generated titles, and export markers for your editor.
            </p>
          </div>

          <ClipRadarClient />

          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Ranked Clip Moments</h3>
                <p className="text-sm text-gray-600">Each potential clip is scored and ranked so you can quickly find your best content without scrubbing through hours of footage.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Multiple Window Sizes</h3>
                <p className="text-sm text-gray-600">Get short (10s), standard (20s), and long (40s) clip windows automatically calculated for each moment. Perfect for Shorts, TikToks, or longer highlights.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Export for Editors</h3>
                <p className="text-sm text-gray-600">Export as CSV, YouTube timestamps for descriptions, or marker files compatible with Premiere Pro and DaVinci Resolve.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Style Detection Modes</h3>
                <p className="text-sm text-gray-600">Choose between Balanced, Hype, Funny, Rage, or Educational modes to find moments that match your content style.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Auto Title & Caption Ideas</h3>
                <p className="text-sm text-gray-600">Get hook-worthy title suggestions and caption overlays automatically generated for each clip moment.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No Login Required</h3>
                <p className="text-sm text-gray-600">Completely free with no account needed. Your transcripts are processed and discarded - we don't store your content.</p>
              </div>
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                    {faq.question}
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-16 p-6 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>Transcript-based detection works best when you react and talk during highlights.</li>
              <li>Silent gameplay or moments without speech may not be detected.</li>
              <li>We do not store your transcripts long-term. Data is processed and discarded.</li>
              <li>Videos must have captions enabled (manual or auto-generated) for analysis.</li>
            </ul>
          </section>

          <ExploreMoreTools currentTool="/tools/clip-radar" />
        </div>
      </main>
    </>
  );
}
