import { Metadata } from "next";
import BpmFinderClient from "./BpmFinderClient";

export const metadata: Metadata = {
  title: "Free BPM Finder Online | Accurate Tempo Detector for Any Audio | VCM BPM Finder",
  description: "Free BPM finder and tempo detector. Upload audio (WAV/MP3/M4A) and get the most likely BPM plus half-time and double-time options with confidence scoring. No login required. Processed entirely in your browser.",
  keywords: "bpm finder, tempo detector, bpm detector, find bpm of a song, bpm analyzer, bpm finder online, tempo finder, detect tempo, music bpm finder, audio bpm detection, bpm for vocals, bpm for instrumentals, bpm for beats, metronome bpm finder",
  openGraph: {
    title: "Free BPM Finder Online",
    description: "Upload audio and get accurate BPM estimates plus alternate tempos. No login required.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VCM BPM Finder",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free online BPM finder and tempo detector with confidence scoring and alternate tempo options.",
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
            "name": "What is BPM?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "BPM stands for Beats Per Minute. It measures the tempo or speed of music. A higher BPM means faster music, while a lower BPM means slower music. Most pop songs are between 100-130 BPM."
            }
          },
          {
            "@type": "Question",
            "name": "How accurate is this BPM finder?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "VCM BPM Finder uses onset detection and autocorrelation analysis to detect tempo. Accuracy is highest for audio with clear rhythmic content like drums or full mixes. The confidence indicator shows how certain the detection is."
            }
          },
          {
            "@type": "Question",
            "name": "Why do I see half-time and double-time BPMs?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Music tempo can be interpreted in multiple ways. A song at 70 BPM could also be counted at 140 BPM if you count twice as fast. We show both options so you can pick what feels right for your use case."
            }
          },
          {
            "@type": "Question",
            "name": "Does this work on vocals only?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Vocal-only audio is more challenging because there's no steady beat. The tool will still attempt detection, but confidence may be lower. For best results, use audio with rhythmic content."
            }
          },
          {
            "@type": "Question",
            "name": "What file types are supported?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "VCM BPM Finder supports WAV, MP3, and M4A files. Any audio format your browser can decode will work."
            }
          },
          {
            "@type": "Question",
            "name": "Do you store my audio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. All processing happens directly in your browser using the Web Audio API. Your files are never uploaded to any server."
            }
          },
          {
            "@type": "Question",
            "name": "Why does the BPM sometimes feel wrong?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "BPM detection can be ambiguous. Some songs have complex rhythms or tempo changes. If the primary BPM feels off, try the half-time or double-time alternatives, or check the other candidates listed."
            }
          },
          {
            "@type": "Question",
            "name": "How do I use BPM in a DAW?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Once you know the BPM, set your DAW project tempo to match. This ensures your loops, samples, and effects sync correctly with the audio. Most DAWs have a tempo field in the transport bar."
            }
          },
          {
            "@type": "Question",
            "name": "What BPM range is supported?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The detector primarily looks for tempos between 60-200 BPM. Results outside this range are normalized by halving or doubling. Very slow or very fast tempos may be shown as alternatives."
            }
          },
          {
            "@type": "Question",
            "name": "Can I analyze short clips?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, but accuracy decreases with shorter audio. Clips under 8 seconds will show Low confidence. For best results, use at least 15-30 seconds of audio."
            }
          }
        ]
      }
    ])
  }
};

const faqs = [
  {
    q: "What is BPM?",
    a: "BPM stands for Beats Per Minute. It measures the tempo or speed of music. A higher BPM means faster music, while a lower BPM means slower music. Most pop songs are between 100-130 BPM."
  },
  {
    q: "How accurate is this BPM finder?",
    a: "VCM BPM Finder uses onset detection and autocorrelation analysis to detect tempo. Accuracy is highest for audio with clear rhythmic content like drums or full mixes. The confidence indicator shows how certain the detection is."
  },
  {
    q: "Why do I see half-time and double-time BPMs?",
    a: "Music tempo can be interpreted in multiple ways. A song at 70 BPM could also be counted at 140 BPM if you count twice as fast. We show both options so you can pick what feels right for your use case."
  },
  {
    q: "Does this work on vocals only?",
    a: "Vocal-only audio is more challenging because there's no steady beat. The tool will still attempt detection, but confidence may be lower. For best results, use audio with rhythmic content."
  },
  {
    q: "What file types are supported?",
    a: "VCM BPM Finder supports WAV, MP3, and M4A files. Any audio format your browser can decode will work."
  },
  {
    q: "Do you store my audio?",
    a: "No. All processing happens directly in your browser using the Web Audio API. Your files are never uploaded to any server."
  },
  {
    q: "Why does the BPM sometimes feel wrong?",
    a: "BPM detection can be ambiguous. Some songs have complex rhythms or tempo changes. If the primary BPM feels off, try the half-time or double-time alternatives, or check the other candidates listed."
  },
  {
    q: "How do I use BPM in a DAW?",
    a: "Once you know the BPM, set your DAW project tempo to match. This ensures your loops, samples, and effects sync correctly with the audio. Most DAWs have a tempo field in the transport bar."
  },
  {
    q: "What BPM range is supported?",
    a: "The detector primarily looks for tempos between 60-200 BPM. Results outside this range are normalized by halving or doubling. Very slow or very fast tempos may be shown as alternatives."
  },
  {
    q: "Can I analyze short clips?",
    a: "Yes, but accuracy decreases with shorter audio. Clips under 8 seconds will show Low confidence. For best results, use at least 15-30 seconds of audio."
  }
];

export default function BpmFinderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Free Online BPM Finder
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            VCM BPM Finder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload audio and get the most likely BPM plus half-time and double-time options.
          </p>
        </div>

        <BpmFinderClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What is BPM and Why Does It Matter?</h2>
          <p className="text-gray-600 mb-4">
            <strong>BPM (Beats Per Minute)</strong> is the universal way to measure musical tempo. Whether you're a producer syncing samples, a DJ matching tracks, or a musician practicing to a metronome, knowing the exact BPM of your audio is essential.
          </p>
          <p className="text-gray-600 mb-4">
            VCM BPM Finder analyzes rhythmic energy patterns in your audio to detect the most likely tempo. Because music can be felt at different speeds (half-time, double-time), we also show alternate interpretations so you can choose what fits your workflow.
          </p>
          <p className="text-gray-600">
            The <strong>confidence score</strong> tells you how clear the beat pattern is. Drums and full mixes typically show High confidence, while ambient or vocal-only tracks may show Medium or Low confidence due to their less defined rhythmic structure.
          </p>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Audio</h3>
              <p className="text-sm text-gray-600">Drop in a WAV, MP3, or M4A file. The audio loads directly into your browser.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Analyze Rhythm</h3>
              <p className="text-sm text-gray-600">We detect repeating beat intervals by analyzing energy patterns and onset timing.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-sm text-gray-600">See the primary BPM, confidence level, and alternate tempo interpretations.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Accurate BPM Detection", desc: "Onset and autocorrelation analysis for reliable tempo detection" },
              { title: "Alternate Tempo Options", desc: "See half-time and double-time interpretations" },
              { title: "Confidence Scoring", desc: "Know how certain the detection is (High/Medium/Low)" },
              { title: "Works on Various Audio", desc: "Beats, songs, instrumentals, and more" },
              { title: "Fast Browser Processing", desc: "Analysis happens in seconds, right in your browser" },
              { title: "Privacy-First", desc: "No uploads stored—your audio never leaves your device" },
              { title: "WAV/MP3/M4A Support", desc: "All common audio formats are supported" },
              { title: "Mobile-Friendly", desc: "Works on phones and tablets with modern browsers" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
              { title: "Vocal-only audio", desc: "May be more ambiguous due to lack of steady beat" },
              { title: "Live recordings", desc: "Can be noisy and may reduce detection accuracy" },
              { title: "Short clips", desc: "Clips under 8 seconds automatically show Low confidence" },
              { title: "Complex rhythms", desc: "Polyrhythmic or tempo-changing music may show multiple candidates" },
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

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Processed entirely in-browser. No audio is stored.
          </p>
        </div>
      </div>
    </div>
  );
}
