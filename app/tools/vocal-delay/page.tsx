import { Metadata } from "next";
import VocalDelayClient from "./VocalDelayClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free Vocal Delay Plugin Online (1/4, 1/8, 1/16 + Ping Pong) | VCM Vocal Delay",
  description: "Free online vocal delay effect. Upload vocals, sync delay to BPM (1/4, 1/8, 1/16), add ping-pong stereo bounce, feedback, and mix. Preview instantly and export WAV. No login required.",
  keywords: "vocal delay online, delay plugin online, ping pong delay vocals, slapback delay vocal, 1/8 delay vocal, 1/16 delay vocal, bpm synced delay, free vocal effects, h delay alternative, waves h delay alternative",
  openGraph: {
    title: "Free Vocal Delay Plugin Online (1/4, 1/8, 1/16 + Ping Pong) | VCM Vocal Delay",
    description: "Free online vocal delay effect. Upload vocals, sync delay to BPM, add ping-pong stereo bounce, feedback, and mix. Preview instantly and export WAV.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VCM Vocal Delay",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free online vocal delay effect with BPM-synced timing, ping-pong stereo bounce, and WAV export.",
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
            "name": "What is ping pong delay?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ping pong delay bounces the delayed signal between the left and right stereo channels, creating a wide, immersive sound where echoes alternate from side to side."
            }
          },
          {
            "@type": "Question",
            "name": "What BPM should I use for my delay?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Match the BPM of your song. If your track is at 120 BPM, set the delay to 120 BPM. This ensures the delay repeats are perfectly in time with the music."
            }
          },
          {
            "@type": "Question",
            "name": "What's the difference between 1/4, 1/8, and 1/16 note delays?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "1/4 note delay is the longest (one beat), 1/8 is half that speed (half beat), and 1/16 is the fastest (quarter beat). Faster divisions create tighter, more rhythmic echoes."
            }
          },
          {
            "@type": "Question",
            "name": "How do I create a slapback delay?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For slapback, use a faster division like 1/16, set feedback low (10-20%), and mix around 20-30%. This creates a quick, single-repeat echo popular in rockabilly and country vocals."
            }
          },
          {
            "@type": "Question",
            "name": "Why does high feedback cause runaway sound?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "High feedback means each echo is nearly as loud as the previous one. VCM Vocal Delay caps feedback at 95% to prevent infinite buildup while still allowing long, atmospheric trails."
            }
          },
          {
            "@type": "Question",
            "name": "Is my audio stored on your servers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. All audio processing happens directly in your browser using the Web Audio API. Your files never leave your device."
            }
          },
          {
            "@type": "Question",
            "name": "What file types are supported?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "VCM Vocal Delay supports WAV, MP3, and M4A files. For best quality, we recommend uploading WAV files."
            }
          },
          {
            "@type": "Question",
            "name": "Can I export wet-only audio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Set the Mix slider to 100% to hear only the delayed (wet) signal. The export will match your current Mix setting."
            }
          },
          {
            "@type": "Question",
            "name": "Why does the exported file include extra silence at the end?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The extra time is the delay tail—it allows the echo repeats to fade out naturally instead of cutting off abruptly."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use this on mobile devices?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, VCM Vocal Delay works on most modern mobile browsers that support the Web Audio API, including Safari on iOS and Chrome on Android."
            }
          }
        ]
      }
    ])
  }
};

const faqs = [
  {
    q: "What is ping pong delay?",
    a: "Ping pong delay bounces the delayed signal between the left and right stereo channels, creating a wide, immersive sound where echoes alternate from side to side."
  },
  {
    q: "What BPM should I use for my delay?",
    a: "Match the BPM of your song. If your track is at 120 BPM, set the delay to 120 BPM. This ensures the delay repeats are perfectly in time with the music."
  },
  {
    q: "What's the difference between 1/4, 1/8, and 1/16 note delays?",
    a: "1/4 note delay is the longest (one beat), 1/8 is half that speed (half beat), and 1/16 is the fastest (quarter beat). Faster divisions create tighter, more rhythmic echoes."
  },
  {
    q: "How do I create a slapback delay?",
    a: "For slapback, use a faster division like 1/16, set feedback low (10-20%), and mix around 20-30%. This creates a quick, single-repeat echo popular in rockabilly and country vocals."
  },
  {
    q: "Why does high feedback cause runaway sound?",
    a: "High feedback means each echo is nearly as loud as the previous one. VCM Vocal Delay caps feedback at 95% to prevent infinite buildup while still allowing long, atmospheric trails."
  },
  {
    q: "Is my audio stored on your servers?",
    a: "No. All audio processing happens directly in your browser using the Web Audio API. Your files never leave your device."
  },
  {
    q: "What file types are supported?",
    a: "VCM Vocal Delay supports WAV, MP3, and M4A files. For best quality, we recommend uploading WAV files."
  },
  {
    q: "Can I export wet-only audio?",
    a: "Set the Mix slider to 100% to hear only the delayed (wet) signal. The export will match your current Mix setting."
  },
  {
    q: "Why does the exported file include extra silence at the end?",
    a: "The extra time is the delay tail—it allows the echo repeats to fade out naturally instead of cutting off abruptly."
  },
  {
    q: "Can I use this on mobile devices?",
    a: "Yes, VCM Vocal Delay works on most modern mobile browsers that support the Web Audio API, including Safari on iOS and Chrome on Android."
  }
];

export default function VocalDelayPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Free Online Vocal Delay
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            VCM Vocal Delay
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload vocals, sync delay to BPM, choose 1/4, 1/8, or 1/16, toggle ping-pong, export WAV.
          </p>
        </div>

        <VocalDelayClient />

        <p className="text-xs text-gray-400 text-center mt-4">
          Not affiliated with Waves.
        </p>

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What is VCM Vocal Delay?</h2>
          <p className="text-gray-600 mb-4">
            <strong>VCM Vocal Delay</strong> is a free online vocal delay effect that runs entirely in your browser. Whether you're adding subtle depth to a vocal take or creating dramatic stereo echoes, this tool gives you professional-grade BPM-synced delay without installing any plugins.
          </p>
          <p className="text-gray-600 mb-4">
            Sync your delay to any tempo from 40–240 BPM, choose between <strong>1/4, 1/8, or 1/16 note</strong> divisions, dial in the perfect feedback and mix, and toggle <strong>ping-pong mode</strong> for stereo bounce effects. Preview your settings in real-time and export a high-quality WAV file when you're happy with the result.
          </p>
          <p className="text-gray-600">
            All processing happens locally on your device—your audio is never uploaded to any server. Perfect for quick vocal processing, demo production, or experimenting with delay effects without the complexity of a full DAW setup.
          </p>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Your Vocal</h3>
              <p className="text-sm text-gray-600">Drop in a WAV, MP3, or M4A file. The audio loads directly into your browser for instant processing.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Dial In Your Delay</h3>
              <p className="text-sm text-gray-600">Set BPM and note division to sync with your track. Adjust feedback, mix, and enable ping-pong for stereo bounce.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Preview & Export</h3>
              <p className="text-sm text-gray-600">Listen to your processed vocal in real-time. When it sounds right, export a WAV file with the delay baked in.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "BPM-Synced Timing", desc: "Delay time automatically matches your track tempo" },
              { title: "Note Divisions", desc: "Choose 1/4, 1/8, or 1/16 note timing" },
              { title: "Ping-Pong Stereo", desc: "Bounce echoes between left and right channels" },
              { title: "Adjustable Feedback", desc: "Control how many repeats you hear (0–95%)" },
              { title: "Dry/Wet Mix", desc: "Blend the effect with your original signal" },
              { title: "Real-Time Preview", desc: "Hear changes instantly as you adjust settings" },
              { title: "WAV Export", desc: "Download processed audio with delay tail included" },
              { title: "100% Private", desc: "Audio never leaves your browser" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">VCM Vocal Delay vs. Traditional Plugins</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Feature</th>
                  <th className="text-center py-3 px-2 font-medium text-purple-600">VCM Vocal Delay</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Traditional Plugins</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "No installation required", vcm: true, trad: false },
                  { feature: "Works on any device", vcm: true, trad: false },
                  { feature: "Free to use", vcm: true, trad: "Varies" },
                  { feature: "BPM sync", vcm: true, trad: true },
                  { feature: "Ping-pong mode", vcm: true, trad: true },
                  { feature: "Real-time preview", vcm: true, trad: true },
                  { feature: "WAV export", vcm: true, trad: true },
                  { feature: "Privacy (local processing)", vcm: true, trad: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-gray-900">{row.feature}</td>
                    <td className="py-3 px-2 text-center">
                      {row.vcm === true ? "✓" : row.vcm === false ? "—" : row.vcm}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {row.trad === true ? "✓" : row.trad === false ? "—" : row.trad}
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

        <ExploreMoreTools currentTool="/tools/vocal-delay" />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Your audio is processed locally. Nothing is uploaded or stored.
          </p>
        </div>
      </div>
    </div>
  );
}
