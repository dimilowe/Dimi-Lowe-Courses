import { Metadata } from "next";
import VocalDoublerClient from "./VocalDoublerClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free Vocal Doubler Online | Tape-Style ADT Effect | VCM Vocal Doubler",
  description: "Free online vocal doubler with tape-style ADT modulation. Upload vocals, add natural width with wow, flutter, and drift, export WAV. Browser-based, no upload required.",
  keywords: "vocal doubler, adt doubler, artificial double tracking, tape style doubling, vocal thickener, vocal width, chorus alternative, modulated delay, vocal effect online, double tracking vocals",
  openGraph: {
    title: "Free Vocal Doubler Online | Tape-Style ADT Effect",
    description: "Upload vocals and add natural-sounding doubling with tape-style modulation. No login required.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VCM Vocal Doubler",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free online vocal doubler with tape-style ADT-inspired modulation, width control, and WAV export.",
        "publisher": {
          "@type": "Organization",
          "name": "VCM Suite"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is a vocal doubler?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A vocal doubler creates the effect of two voices singing together by playing a slightly delayed and modulated copy of the original vocal. This adds thickness, width, and presence without recording a second take."
            }
          },
          {
            "@type": "Question",
            "name": "What's the difference between a doubler and chorus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Chorus uses shorter delays (typically under 20ms) with consistent pitch modulation, creating a shimmery, watery sound. Doublers use longer delays (15-40ms) with irregular, tape-like drift that sounds more like a real human performance variation."
            }
          },
          {
            "@type": "Question",
            "name": "What is ADT-style doubling?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ADT (Artificial Double Tracking) was invented in the 1960s to simulate double-tracked vocals without re-recording. It uses varispeed tape manipulation to create subtle timing and pitch variations. This tool creates a similar effect digitally."
            }
          },
          {
            "@type": "Question",
            "name": "What delay time should I use for vocals?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For natural doubling, 15-25ms works well. Shorter delays (5-15ms) create tighter, more subtle thickening. Longer delays (25-40ms) create a more obvious double that can sound like slapback."
            }
          },
          {
            "@type": "Question",
            "name": "How do I make doubles wider without sounding phasey?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Use the Width control to spread the doubled signal across the stereo field, and add some Wow (drift) to keep the timing constantly shifting. This prevents the static comb-filtering that causes phasiness."
            }
          },
          {
            "@type": "Question",
            "name": "Why does modulation make it sound more human?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Real human performances naturally vary in timing and pitch. Wow and Flutter simulate the imperfections of tape machines, which themselves mimic human inconsistency. Static delays sound artificial; modulated delays sound alive."
            }
          },
          {
            "@type": "Question",
            "name": "Does this work on instruments too?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Doublers work great on guitars, synths, and other instruments. Use lower modulation amounts for cleaner sources to avoid pitch wobble, or crank it up for creative lo-fi effects."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use it live?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Enable Low Latency mode for live use. This reduces modulation to minimize CPU load and latency. The effect will be more subtle but still adds width and thickness in real-time."
            }
          },
          {
            "@type": "Question",
            "name": "Why is there latency?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Web audio processing requires buffering for stability. The base delay itself (15-40ms) also adds inherent latency. Low Latency mode minimizes this by reducing the base delay and disabling heavy modulation."
            }
          },
          {
            "@type": "Question",
            "name": "What audio formats are supported?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "VCM Vocal Doubler supports WAV, MP3, and M4A files. For best quality, use WAV files. Export is always in WAV format for maximum compatibility."
            }
          },
          {
            "@type": "Question",
            "name": "Is my audio uploaded or stored?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. All processing happens directly in your browser using the Web Audio API. Your files never leave your device."
            }
          },
          {
            "@type": "Question",
            "name": "How do I export the processed vocal?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Click Export WAV to render and download your processed audio. The free version exports up to 30 seconds. The export uses the same settings you hear in preview."
            }
          }
        ]
      }
    ])
  }
};

const faqs = [
  {
    q: "What is a vocal doubler?",
    a: "A vocal doubler creates the effect of two voices singing together by playing a slightly delayed and modulated copy of the original vocal. This adds thickness, width, and presence without recording a second take."
  },
  {
    q: "What's the difference between a doubler and chorus?",
    a: "Chorus uses shorter delays (typically under 20ms) with consistent pitch modulation, creating a shimmery, watery sound. Doublers use longer delays (15-40ms) with irregular, tape-like drift that sounds more like a real human performance variation."
  },
  {
    q: "What is ADT-style doubling?",
    a: "ADT (Artificial Double Tracking) was invented in the 1960s to simulate double-tracked vocals without re-recording. It uses varispeed tape manipulation to create subtle timing and pitch variations. This tool creates a similar effect digitally."
  },
  {
    q: "What delay time should I use for vocals?",
    a: "For natural doubling, 15-25ms works well. Shorter delays (5-15ms) create tighter, more subtle thickening. Longer delays (25-40ms) create a more obvious double that can sound like slapback."
  },
  {
    q: "How do I make doubles wider without sounding phasey?",
    a: "Use the Width control to spread the doubled signal across the stereo field, and add some Wow (drift) to keep the timing constantly shifting. This prevents the static comb-filtering that causes phasiness."
  },
  {
    q: "Why does modulation make it sound more human?",
    a: "Real human performances naturally vary in timing and pitch. Wow and Flutter simulate the imperfections of tape machines, which themselves mimic human inconsistency. Static delays sound artificial; modulated delays sound alive."
  },
  {
    q: "Does this work on instruments too?",
    a: "Yes! Doublers work great on guitars, synths, and other instruments. Use lower modulation amounts for cleaner sources to avoid pitch wobble, or crank it up for creative lo-fi effects."
  },
  {
    q: "Can I use it live?",
    a: "Enable Low Latency mode for live use. This reduces modulation to minimize CPU load and latency. The effect will be more subtle but still adds width and thickness in real-time."
  },
  {
    q: "Why is there latency?",
    a: "Web audio processing requires buffering for stability. The base delay itself (15-40ms) also adds inherent latency. Low Latency mode minimizes this by reducing the base delay and disabling heavy modulation."
  },
  {
    q: "What audio formats are supported?",
    a: "VCM Vocal Doubler supports WAV, MP3, and M4A files. For best quality, use WAV files. Export is always in WAV format for maximum compatibility."
  },
  {
    q: "Is my audio uploaded or stored?",
    a: "No. All processing happens directly in your browser using the Web Audio API. Your files never leave your device."
  },
  {
    q: "How do I export the processed vocal?",
    a: "Click Export WAV to render and download your processed audio. The free version exports up to 30 seconds. The export uses the same settings you hear in preview."
  }
];

const presetCards = [
  {
    name: "Tight Double",
    desc: "Subtle thickening with minimal modulation. Great for natural-sounding vocal support.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    name: "Wide Chorusy",
    desc: "More modulation and width for a lush, spread-out vocal sound.",
    color: "bg-purple-50 border-purple-200",
  },
  {
    name: "Dreamy Drift",
    desc: "Heavy wow and slow flutter for ambient, floating vocals.",
    color: "bg-pink-50 border-pink-200",
  },
  {
    name: "Slap Thickener",
    desc: "Short delay with light saturation for punchy, present vocals.",
    color: "bg-orange-50 border-orange-200",
  },
];

export default function VocalDoublerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Free Online Vocal Doubler
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            VCM Vocal Doubler
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Add natural width and thickness to vocals with tape-style ADT modulation.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">✓ Tape-style wow &amp; flutter</span>
            <span className="flex items-center gap-1">✓ Stereo width control</span>
            <span className="flex items-center gap-1">✓ Real-time preview</span>
          </div>
        </div>

        <VocalDoublerClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What is a Vocal Doubler?</h2>
          <p className="text-gray-600 mb-4">
            A <strong>vocal doubler</strong> creates the illusion of two voices singing in unison by playing a slightly delayed, modulated copy of your vocal alongside the original. Unlike static delay, a good doubler adds subtle timing and pitch variations that mimic the natural inconsistencies of a real double-tracked performance.
          </p>
          <p className="text-gray-600 mb-4">
            <strong>Tape-style ADT (Artificial Double Tracking)</strong> takes this further by simulating the wow, flutter, and drift of analog tape machines. The result is a warm, organic doubling effect that sounds more human than digital—adding width, thickness, and presence to any vocal.
          </p>
          <p className="text-gray-600">
            VCM Vocal Doubler uses modulated delay with independent stereo modulation, optional saturation, and precise control over the character of the effect. Upload a vocal, dial in your settings, and export a processed WAV file—all in your browser.
          </p>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload or Mic</h3>
              <p className="text-sm text-gray-600">Drop in a WAV, MP3, or M4A file, or use your microphone for live monitoring.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Dial In the Effect</h3>
              <p className="text-sm text-gray-600">Adjust delay, width, wow/flutter, and saturation. Use presets for quick starting points.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Preview &amp; Export</h3>
              <p className="text-sm text-gray-600">Listen in real-time, then export a processed WAV file with your settings baked in.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preset Starting Points</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {presetCards.map((preset) => (
              <div key={preset.name} className={`p-4 rounded-xl border ${preset.color}`}>
                <h3 className="font-semibold text-gray-900 mb-1">{preset.name}</h3>
                <p className="text-sm text-gray-600">{preset.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Tape-Style Modulation", desc: "Wow and flutter simulate analog tape drift" },
              { title: "Stereo Width Control", desc: "Spread the doubled signal across the stereo field" },
              { title: "Independent L/R Modulation", desc: "Each channel has its own random seed for natural width" },
              { title: "Optional Saturation", desc: "Add warmth with gentle drive and tone control" },
              { title: "Real-Time Preview", desc: "Hear changes instantly as you adjust settings" },
              { title: "Mic Input Support", desc: "Monitor through the doubler live with your microphone" },
              { title: "WAV Export", desc: "Download processed audio with effect baked in" },
              { title: "Low Latency Mode", desc: "Reduced CPU and delay for live performance" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Honest Limitations</h2>
          <div className="space-y-3">
            {[
              { title: "Browser CPU usage", desc: "Complex modulation uses more processing power. Use Low Latency mode if needed." },
              { title: "Inherent latency", desc: "Doubling requires delay (15-40ms). This adds latency for live monitoring." },
              { title: "Best with clean sources", desc: "Works best on isolated vocals or instruments without heavy reverb." },
              { title: "Headphones recommended", desc: "Stereo width is best appreciated with headphones or studio monitors." },
            ].map((limit) => (
              <div key={limit.title} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">!</div>
                <div>
                  <h4 className="font-medium text-gray-900">{limit.title}</h4>
                  <p className="text-sm text-gray-600">{limit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Doubler vs Chorus vs Static Delay</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Feature</th>
                  <th className="text-center py-3 px-2 font-medium text-indigo-600">VCM Vocal Doubler</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Basic Delay</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Chorus</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Natural human variation", doubler: true, delay: false, chorus: "Partial" },
                  { feature: "Tape-style drift", doubler: true, delay: false, chorus: false },
                  { feature: "Stereo width control", doubler: true, delay: false, chorus: true },
                  { feature: "Subtle thickening", doubler: true, delay: true, chorus: true },
                  { feature: "Independent L/R modulation", doubler: true, delay: false, chorus: "Partial" },
                  { feature: "Low phasiness", doubler: true, delay: false, chorus: false },
                  { feature: "Works on vocals", doubler: true, delay: true, chorus: "Partial" },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-gray-900">{row.feature}</td>
                    <td className="py-3 px-2 text-center">
                      {row.doubler === true ? "✓" : row.doubler === false ? "—" : row.doubler}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {row.delay === true ? "✓" : row.delay === false ? "—" : row.delay}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {row.chorus === true ? "✓" : row.chorus === false ? "—" : row.chorus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
                <summary className="font-semibold text-gray-900 flex items-center justify-between">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <ExploreMoreTools currentTool="/tools/vocal-doubler" />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Audio processed locally. Nothing uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}
