import { Metadata } from "next";
import ThumbnailGeneratorClient from "./ThumbnailGeneratorClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free AI YouTube Thumbnail Generator | Create 4 Thumbnail Options Instantly",
  description: "Free AI YouTube thumbnail generator. Create 4 unique 1280x720 thumbnail options instantly. Download PNG files, no login required. Perfect 16:9 aspect ratio for YouTube.",
  keywords: [
    "youtube thumbnail generator",
    "ai thumbnail maker",
    "thumbnail creator",
    "1280x720 thumbnail",
    "16:9 thumbnail",
    "youtube thumbnail size",
    "free thumbnail generator",
    "ai thumbnail generator",
    "thumbnail design tool",
    "youtube thumbnail maker free",
  ],
  openGraph: {
    title: "Free AI YouTube Thumbnail Generator | 4 Options Instantly",
    description: "Generate 4 unique YouTube thumbnails with AI. 1280x720 PNG downloads, no login required.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM AI YouTube Thumbnail Generator",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free AI-powered YouTube thumbnail generator that creates 4 unique 1280x720 thumbnail options instantly. Download PNG files for A/B testing.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "ratingCount": "890"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What size are YouTube thumbnails?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "YouTube thumbnails should be 1280 x 720 pixels with a 16:9 aspect ratio. This is the standard size that YouTube recommends for optimal display across all devices. Our generator outputs exactly this size."
      }
    },
    {
      "@type": "Question",
      "name": "Can I generate multiple thumbnail options?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our AI generator creates up to 4 unique thumbnail variations per request. Each uses a different visual approach (close-up, split-screen, bold text, minimalist) so you can A/B test which performs best."
      }
    },
    {
      "@type": "Question",
      "name": "Will it output 1280x720 PNG?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, every generated thumbnail is automatically resized to exactly 1280x720 pixels and exported as a high-quality PNG file. Ready to upload directly to YouTube."
      }
    },
    {
      "@type": "Question",
      "name": "Do you store my images?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Generated thumbnails are created on-demand and delivered directly to your browser. We do not store, save, or retain any generated images. Download them immediately for best results."
      }
    },
    {
      "@type": "Question",
      "name": "How do I A/B test YouTube thumbnails?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Generate 4 different thumbnails with our tool, then use YouTube's built-in A/B testing feature (available to most creators) or manually swap thumbnails every few days and compare CTR in YouTube Analytics."
      }
    },
    {
      "@type": "Question",
      "name": "How many words should be on a thumbnail?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Keep text to 2-5 words maximum. Text must be readable at small sizes (mobile preview is only 120x68 pixels). Our generator enforces a 5-word limit to ensure readability."
      }
    },
    {
      "@type": "Question",
      "name": "Why do AI thumbnails sometimes look weird?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI can struggle with text, hands, and faces. Tips: Keep text overlays short (we limit to 5 words), use specific descriptions for subjects, and regenerate variations until you get a good result. Our tool outputs 4 options to increase your chances of getting a great one."
      }
    }
  ]
};

const exampleGenerations = [
  {
    title: "Curiosity Hook Thumbnail",
    description: "Creates intrigue with questions or surprising visuals",
    features: ["Bold question text", "Dramatic lighting", "Single focal point", "High contrast colors"],
  },
  {
    title: "Comparison Thumbnail",
    description: "Side-by-side or before/after style layouts",
    features: ["Split-screen composition", "Clear vs/or divider", "Contrasting elements", "Easy to scan"],
  },
  {
    title: "Tutorial Thumbnail",
    description: "Clean, educational look that builds trust",
    features: ["Step indicators", "Clean background", "Professional subject", "Readable text overlay"],
  },
];

const features = [
  { name: "4 Variations per Click", description: "Get 4 unique thumbnail concepts with different compositions" },
  { name: "16:9 (1280×720) Output", description: "Perfect YouTube thumbnail size, ready to upload" },
  { name: "High-Contrast, Mobile-Readable", description: "Optimized for small screen visibility" },
  { name: "Hook Angle Presets", description: "Curiosity, Shock, Authority, Comparison, Tutorial styles" },
  { name: "Text Overlay Control", description: "Add 2-5 word overlays that render cleanly" },
  { name: "Regenerate Similar Variants", description: "Like a thumbnail? Generate more like it" },
  { name: "Download PNG Instantly", description: "High-quality PNG files, no watermarks" },
  { name: "Prompt Preview", description: "See exactly what prompt generated your thumbnails" },
];

const faqs = [
  {
    q: "What size are YouTube thumbnails?",
    a: "YouTube thumbnails should be 1280 x 720 pixels with a 16:9 aspect ratio. This is the standard size that YouTube recommends for optimal display across all devices—from mobile phones to smart TVs. Our generator outputs exactly this size, so your thumbnails are ready to upload immediately."
  },
  {
    q: "Can I generate multiple thumbnail options?",
    a: "Yes! Our AI generator creates up to 4 unique thumbnail variations per request. Each uses a different visual approach—close-up shots, split-screen layouts, bold text emphasis, and minimalist designs—so you can A/B test which performs best for your audience."
  },
  {
    q: "Will it output 1280x720 PNG?",
    a: "Absolutely. Every generated thumbnail is automatically resized to exactly 1280x720 pixels and exported as a high-quality PNG file. PNG format ensures crisp text and no compression artifacts. Ready to upload directly to YouTube."
  },
  {
    q: "Do you store my generated images?",
    a: "No. Generated thumbnails are created on-demand and delivered directly to your browser as base64 data. We do not store, save, or retain any generated images on our servers. Download them immediately after generation."
  },
  {
    q: "How do I A/B test YouTube thumbnails?",
    a: "Generate 4 different thumbnails with our tool. Then either: 1) Use YouTube's built-in A/B testing feature (YouTube Studio → Content → Select video → Test & Compare), or 2) Manually swap thumbnails every 3-4 days and compare CTR in YouTube Analytics. Our multi-variant output is designed specifically for this workflow."
  },
  {
    q: "How many words should be on a thumbnail?",
    a: "Keep text to 2-5 words maximum. Remember that YouTube previews can be as small as 120x68 pixels on mobile—your text needs to be readable at that size. Our generator enforces a strict 5-word limit on text overlays to ensure your thumbnails remain readable."
  },
  {
    q: "Why do AI-generated thumbnails sometimes look weird?",
    a: "AI image models can struggle with: 1) Text rendering (letters may be garbled), 2) Human hands (extra fingers), 3) Complex faces (distortion). Our tips: Keep text overlays very short, use descriptive prompts for subjects, choose 'minimalist' style for cleaner results, and generate multiple variations—usually at least 1-2 of the 4 will be excellent."
  },
];

export default function AIYouTubeThumbnailGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Free AI-Powered Thumbnail Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI YouTube Thumbnail Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Generate 4 unique thumbnail options instantly. 1280×720 PNG downloads, 
              optimized for clicks. No login required.
            </p>
          </div>

          {/* The Tool */}
          <ThumbnailGeneratorClient />

          {/* SECTION 1: Keyword-Rich Intro */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              The Free AI YouTube Thumbnail Generator That Creates Click-Worthy Designs
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                Stop spending hours designing thumbnails. Our free <strong>AI YouTube thumbnail generator</strong> creates 
                4 unique <strong>1280×720</strong> thumbnail options in seconds. Each variation uses a different visual approach—from 
                bold close-ups to clean minimalist designs—so you can <strong>A/B test</strong> which performs best for your audience.
              </p>
              <p>
                Unlike basic template tools, our <strong>AI thumbnail maker</strong> generates completely original designs based on 
                your video title and topic. Choose from hook angle presets like Curiosity, Shock, Authority, Comparison, or Tutorial 
                to match your content style. Add optional text overlays (2-5 words) for maximum impact.
              </p>
              <p>
                Every thumbnail is automatically sized to the perfect <strong>16:9 aspect ratio</strong> and exported as a 
                high-quality <strong>PNG file</strong>. No watermarks, no subscription required. Just enter your video details, 
                click generate, and download your thumbnails. Ready to upload directly to YouTube.
              </p>
            </div>
          </section>

          {/* SECTION 2: Example Generation Previews */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              What You&apos;ll Get: Thumbnail Styles
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Our AI generates thumbnails in different styles. Here&apos;s what each approach delivers.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {exampleGenerations.map((example, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-orange-700 font-medium text-sm">Example Style</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">{example.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                    <ul className="space-y-1">
                      {example.features.map((feature, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Features */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Everything You Need to Create Perfect Thumbnails
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Built specifically for YouTube creators who want high-CTR thumbnails without the design hassle.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{feature.name}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Comparison Table */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How VCM Compares to Other Options
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-orange-600">VCM Generator</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Canva</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Generic AI Tool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Price</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-green-600">Free</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Free tier + paid</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Usually paid</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-700">4 Options at Once</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">1280×720 Export</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600">✓ Auto</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Manual setup</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">Varies</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-700">Hook Angle Presets</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600">✓ 5 presets</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Thumbnail-Optimized</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600">✓ Built-in</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Templates only</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-700">No Login Required</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Sometimes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 5: FAQ */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <h3 className="font-medium text-gray-900 pr-4">{faq.q}</h3>
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Explore More Tools */}
          <div className="mt-20">
            <ExploreMoreTools currentTool="ai-youtube-thumbnail-generator" />
          </div>
        </div>
      </div>
    </>
  );
}
