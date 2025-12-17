import { Metadata } from "next";
import YoutubeTranscriptGeneratorClient from "./YoutubeTranscriptGeneratorClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import Link from "next/link";

const faqs = [
  {
    question: "What is a YouTube transcript generator?",
    answer: "A YouTube transcript generator is a tool that extracts the text from a YouTube video's captions or subtitles. It converts the audio content into readable text that you can copy, download, or use for various purposes like studying, content creation, or accessibility."
  },
  {
    question: "Is this YouTube transcript generator free?",
    answer: "Yes! This tool is 100% free to use. There's no signup required, no watermarks, and no hidden costs. You can generate unlimited transcripts from any YouTube video that has captions available."
  },
  {
    question: "Can I get a transcript from any YouTube video?",
    answer: "You can get transcripts from any YouTube video that has captions enabled. This includes videos with auto-generated captions or manually added subtitles. Some creators disable captions on their videos, in which case the transcript won't be available."
  },
  {
    question: "Why can't I get a transcript for some videos?",
    answer: "Some videos don't have transcripts available because the creator has disabled captions, the video is private or age-restricted, or it's a live stream without replays. Auto-generated captions may also be unavailable for certain languages or audio quality."
  },
  {
    question: "Does this work with auto-generated captions?",
    answer: "Yes! This tool works with both manually uploaded subtitles and YouTube's auto-generated captions. Auto-generated captions may have occasional errors since they're created by speech recognition, but they work well for most videos."
  },
  {
    question: "Can I copy and download the transcript?",
    answer: "Absolutely! Once the transcript is generated, you can copy it to your clipboard with one click or download it as a .txt file. This makes it easy to use in documents, notes, or other applications."
  },
  {
    question: "Do you store my transcript or video?",
    answer: "No. We do not store any transcripts, video data, or personal information. The transcript is generated on-the-fly and displayed in your browser. Once you leave the page, it's gone."
  },
  {
    question: "Can I extract transcripts in different languages?",
    answer: "The tool extracts the default caption track available for the video. If a video has captions in multiple languages, the tool will use the primary available track. You can then translate the text using any translation service."
  },
  {
    question: "Is this better than YouTube's built-in transcript feature?",
    answer: "YouTube's built-in transcript feature requires multiple clicks and doesn't easily let you copy or download the full text. Our tool provides a cleaner interface with one-click copy and download options, making it faster and more convenient."
  },
  {
    question: "What can I use YouTube transcripts for?",
    answer: "Transcripts are useful for studying video content, creating summaries or blog posts, improving accessibility, researching topics, creating subtitles for other platforms, SEO optimization, and more."
  }
];

export const metadata: Metadata = {
  title: "YouTube Transcript Generator – Get Video Transcripts Free",
  description: "Free YouTube transcript generator. Paste a YouTube link to instantly generate a full video transcript. Works with captions and auto-captions. No login, no watermark.",
  keywords: "youtube transcript generator, youtube transcript, get transcript from youtube video, youtube captions transcript, extract youtube transcript, youtube subtitles to text, youtube transcript copy, transcript from youtube link, youtube transcript downloader, free youtube transcript generator",
  openGraph: {
    title: "YouTube Transcript Generator – Get Video Transcripts Free",
    description: "Free YouTube transcript generator. Paste a YouTube link to instantly generate a full video transcript. Works with captions and auto-captions.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VCM YouTube Transcript Generator",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Web",
        "description": "Free YouTube transcript generator. Paste a YouTube link to instantly generate a full video transcript. Works with captions and auto-captions. No login, no watermark.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ])
  }
};

export default function YoutubeTranscriptGeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-red-100 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            100% Free
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            YouTube Transcript Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Paste a YouTube link to instantly generate a full video transcript.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Works with captions and auto-captions
          </p>
        </div>

        <YoutubeTranscriptGeneratorClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Free YouTube Transcript Generator</h2>
          <p className="text-gray-600 mb-4">
            Looking for a reliable <strong>YouTube transcript generator</strong>? VCM Suite's free tool lets you extract the full text from any YouTube video with captions. Whether you need transcripts for studying, content creation, or accessibility, our tool delivers instant results with no signup required.
          </p>
          <p className="text-gray-600 mb-4">
            Simply paste your YouTube URL, click the button, and get your complete transcript in seconds. Copy it to your clipboard or download it as a text file—it's that easy.
          </p>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Get a Transcript From a YouTube Video</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Paste URL</h3>
              <p className="text-gray-600 text-sm">Copy the YouTube video URL and paste it into the input field above.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Generate</h3>
              <p className="text-gray-600 text-sm">Click "Generate Transcript" and wait a few seconds for the text to load.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Copy or Download</h3>
              <p className="text-gray-600 text-sm">Copy the transcript to your clipboard or download it as a .txt file.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Use Cases</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Content Creation</h3>
              <p className="text-gray-600 text-sm">Turn video content into blog posts, articles, or social media content quickly.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Research & Study</h3>
              <p className="text-gray-600 text-sm">Extract key information from educational videos and lectures for notes.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600 text-sm">Make video content accessible to those who prefer or need text formats.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">SEO & Keywords</h3>
              <p className="text-gray-600 text-sm">Analyze what topics and keywords are discussed in popular videos.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
                <summary className="font-semibold text-gray-900 flex items-center justify-between">
                  {faq.question}
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8 bg-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Related Tools</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/tools/pdf-merger-free" className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200">
              PDF Merger Free
            </Link>
            <Link href="/tools/pdf-merge-split" className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200">
              PDF Merge Split
            </Link>
            <Link href="/tools/summarizer" className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200">
              AI Summarizer
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          We do not store your transcripts or video data.
        </p>

        <div className="mt-12">
          <ExploreMoreTools currentTool="youtube-transcript-generator" />
        </div>
      </div>
    </div>
  );
}
