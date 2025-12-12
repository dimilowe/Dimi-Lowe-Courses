import { Metadata } from "next";
import ThumbnailAnalyzerClient from "./ThumbnailAnalyzerClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free YouTube Thumbnail Analyzer | AI Thumbnail Checker & Optimizer",
  description: "Free AI YouTube thumbnail analyzer. Get instant thumbnail feedback, CTR optimization scores, mobile readability testing, and AI coaching. No login required. Better than VidIQ or TubeBuddy thumbnail tools.",
  keywords: [
    "youtube thumbnail analyzer",
    "thumbnail analyzer",
    "thumbnail checker",
    "thumbnail tester",
    "youtube thumbnail feedback",
    "thumbnail optimization",
    "improve thumbnail CTR",
    "thumbnail critique tool",
    "free thumbnail analysis",
    "youtube thumbnail preview",
    "vidiq alternative",
    "tubebuddy alternative",
  ],
  openGraph: {
    title: "Free AI YouTube Thumbnail Analyzer",
    description: "Upload your thumbnail and get instant AI analysis with scores, feedback, and coaching. Free forever, no login required.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM YouTube Thumbnail Analyzer",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free AI-powered YouTube thumbnail analyzer that scores clarity, intrigue, emotion, contrast, readability, and composition. Includes chat-based coaching.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the ideal YouTube thumbnail size?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ideal YouTube thumbnail size is 1280 x 720 pixels with a 16:9 aspect ratio. YouTube recommends a minimum width of 640 pixels. Accepted formats include JPG, GIF, and PNG, with a maximum file size of 2MB."
      }
    },
    {
      "@type": "Question",
      "name": "Does my thumbnail affect my YouTube ranking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. YouTube's algorithm heavily weighs click-through rate (CTR) when determining video rankings. A compelling thumbnail that attracts clicks signals to YouTube that your content is valuable, leading to more impressions and higher search rankings."
      }
    },
    {
      "@type": "Question",
      "name": "How can I increase my CTR on YouTube?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To increase CTR: use high-contrast colors that pop against YouTube's white background, make text readable at small sizes, include expressive human faces when possible, create a curiosity gap, test multiple thumbnail variations, and study what successful creators in your niche are doing."
      }
    },
    {
      "@type": "Question",
      "name": "Can AI analyze my YouTube thumbnail?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our free AI thumbnail analyzer uses advanced computer vision technology to evaluate your thumbnail across 6 key dimensions: clarity, intrigue, emotion, contrast, text readability, and composition. Each receives a score from 0-100, plus you get specific suggestions for improvement."
      }
    },
    {
      "@type": "Question",
      "name": "What makes a good YouTube thumbnail?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A great thumbnail has: a clear, instantly recognizable subject, high contrast and saturated colors, readable text (if any), an emotional or intriguing element, clean composition without clutter, and consistency with your channel branding."
      }
    },
    {
      "@type": "Question",
      "name": "How do I test YouTube thumbnails for free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Upload your thumbnail to our free AI analyzer. You'll instantly receive scores for clarity, intrigue, emotion, contrast, readability, and composition—plus specific feedback on what's working and what to improve. No login required, completely free, unlimited uploads."
      }
    }
  ]
};

const exampleAnalyses = [
  {
    title: "Gaming Channel Thumbnail",
    image: "/api/files/thumbnail-gaming.png",
    grade: "B+",
    avgScore: 78,
    verdict: "Strong subject focus but text could be larger for mobile viewing.",
    strengths: ["Clear subject", "Good color contrast", "Expressive face"],
    improvements: ["Increase text size 20%", "Add subtle shadow behind text"],
  },
  {
    title: "Tutorial Video Thumbnail",
    image: "/api/files/thumbnail-tutorial.png",
    grade: "A-",
    avgScore: 85,
    verdict: "Excellent clarity and composition. Minor improvements possible.",
    strengths: ["Very readable text", "Clean composition", "Strong intrigue"],
    improvements: ["Add more emotion", "Consider bolder color scheme"],
  },
  {
    title: "Vlog Thumbnail",
    image: "/api/files/thumbnail-vlog.png",
    grade: "C+",
    avgScore: 62,
    verdict: "Background is too busy and competes with the subject.",
    strengths: ["Good facial expression", "Interesting concept"],
    improvements: ["Simplify background", "Add text overlay", "Increase contrast"],
  },
];

const features = [
  { name: "Thumbnail Clarity Score", description: "Measures if your message is instantly clear in 1 second" },
  { name: "Text Readability Analysis", description: "Tests if text is readable at mobile YouTube sizes" },
  { name: "Mobile Preview Testing", description: "Evaluates how your thumbnail appears on small screens" },
  { name: "CTR Prediction Insights", description: "AI-powered analysis of click-through potential" },
  { name: "Detailed Coaching Feedback", description: "Specific, actionable suggestions for improvement" },
  { name: "Emotion & Intrigue Scoring", description: "Measures the emotional impact and curiosity factor" },
  { name: "Composition Analysis", description: "Evaluates layout, balance, and visual hierarchy" },
  { name: "AI Chat Consultant", description: "Ask follow-up questions and get personalized advice" },
];

const faqs = [
  {
    q: "What is the ideal YouTube thumbnail size?",
    a: "The ideal YouTube thumbnail size is 1280 x 720 pixels with a 16:9 aspect ratio. YouTube recommends a minimum width of 640 pixels. Accepted formats include JPG, GIF, and PNG, with a maximum file size of 2MB. Our analyzer works with any common image format up to 5MB."
  },
  {
    q: "Does my thumbnail affect my YouTube ranking?",
    a: "Absolutely. YouTube's algorithm heavily weighs click-through rate (CTR) when determining video rankings. A compelling thumbnail that attracts clicks signals to YouTube that your content is valuable, leading to more impressions and higher search rankings. Even a 1-2% CTR improvement can significantly boost your video's performance."
  },
  {
    q: "How can I increase my CTR on YouTube?",
    a: "To increase CTR: 1) Use high-contrast colors that pop against YouTube's white background, 2) Make text readable at small sizes (think mobile), 3) Include expressive human faces when possible, 4) Create a curiosity gap that makes viewers want to click, 5) Test multiple thumbnail variations, and 6) Study what successful creators in your niche are doing."
  },
  {
    q: "Can AI analyze my YouTube thumbnail?",
    a: "Yes! Our free AI thumbnail analyzer uses advanced computer vision technology to evaluate your thumbnail across 6 key dimensions: clarity, intrigue, emotion, contrast, text readability, and composition. Each receives a score from 0-100, plus you get specific suggestions for improvement and can chat with the AI coach for deeper guidance."
  },
  {
    q: "What makes a good YouTube thumbnail?",
    a: "A great thumbnail has: 1) A clear, instantly recognizable subject, 2) High contrast and saturated colors, 3) Readable text (if any), 4) An emotional or intriguing element, 5) Clean composition without clutter, and 6) Consistency with your channel branding. It should tell a story and create curiosity in under 1 second."
  },
  {
    q: "How do I test YouTube thumbnails for free?",
    a: "Upload your thumbnail to our free AI analyzer above. You'll instantly receive scores for clarity, intrigue, emotion, contrast, readability, and composition—plus specific feedback on what's working and what to improve. No login required, completely free, and you can test unlimited thumbnails."
  },
  {
    q: "Is this better than VidIQ or TubeBuddy thumbnail tools?",
    a: "Our AI Thumbnail Analyzer offers several advantages: it's completely free (no paid tiers), requires no login or account, provides AI-powered analysis (not just templates), includes an AI chat consultant for follow-up questions, and offers unlimited uploads. VidIQ and TubeBuddy charge for their thumbnail features."
  },
  {
    q: "Do you store my uploaded thumbnails?",
    a: "No. Your thumbnails are processed in memory and immediately discarded after analysis. We do not store, save, or use your images for any purpose. Your creative work remains private and secure."
  },
];

export default function YouTubeThumbnailAnalyzerPage() {
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
              Free AI-Powered Thumbnail Analyzer
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              YouTube Thumbnail Analyzer
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your thumbnail and get instant AI analysis with actionable feedback. 
              Then chat with your AI coach for deeper optimization help.
            </p>
          </div>

          {/* The Tool */}
          <ThumbnailAnalyzerClient />

          {/* SECTION 1: Keyword-Rich Intro */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              The Free YouTube Thumbnail Analyzer That Actually Helps
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                Stop guessing whether your YouTube thumbnail will perform. Our free <strong>AI thumbnail analyzer</strong> gives you instant, 
                actionable feedback on every aspect of your thumbnail—from <strong>clarity and composition</strong> to <strong>text readability</strong> and 
                emotional impact. Whether you&apos;re a gaming creator, vlogger, educator, or business channel, this <strong>thumbnail checker</strong> helps 
                you optimize for maximum click-through rate (CTR).
              </p>
              <p>
                Unlike basic <strong>thumbnail template generators</strong> that give you cookie-cutter designs, our AI-powered <strong>thumbnail 
                evaluator</strong> analyzes YOUR specific thumbnail and tells you exactly what&apos;s working and what needs improvement. You get 
                scores for six critical metrics, plus a chat-based <strong>thumbnail coach</strong> who can answer your specific questions about 
                fonts, colors, layouts, and more.
              </p>
              <p>
                YouTube&apos;s algorithm rewards videos with high CTR—and your thumbnail is the #1 factor in getting those clicks. A compelling 
                thumbnail that&apos;s <strong>readable on mobile</strong>, emotionally engaging, and visually clear can double your views. Use our 
                <strong> free thumbnail analysis</strong> tool to test your designs before publishing, get <strong>thumbnail feedback</strong> instantly, 
                and iterate toward thumbnails that actually convert. No login required, no limits, completely free.
              </p>
            </div>
          </section>

          {/* SECTION 2: Example Analysis Previews */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              See How the Thumbnail Analyzer Works
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Here&apos;s what kind of feedback you can expect from our AI thumbnail checker. Each analysis includes scores, grades, and specific suggestions.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {exampleAnalyses.map((example, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                    <img 
                      src={example.image} 
                      alt={example.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{example.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-orange-600">{example.grade}</span>
                        <span className="text-sm text-gray-500">({example.avgScore}/100)</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{example.verdict}</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-green-600 uppercase">Strengths:</span>
                        <ul className="text-xs text-gray-600 mt-1">
                          {example.strengths.map((s, j) => (
                            <li key={j} className="flex items-center gap-1">
                              <span className="text-green-500">✓</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-orange-600 uppercase">Improve:</span>
                        <ul className="text-xs text-gray-600 mt-1">
                          {example.improvements.map((s, j) => (
                            <li key={j} className="flex items-center gap-1">
                              <span className="text-orange-500">→</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: How the AI Thumbnail Analyzer Works */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How the AI YouTube Thumbnail Analyzer Works
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How the AI Scores Clarity</h3>
                <p className="text-gray-700">
                  Clarity measures whether your thumbnail&apos;s main subject or message is instantly recognizable. Our AI vision model evaluates 
                  if a viewer can understand what your video is about within 1 second—the typical time someone spends glancing at a thumbnail 
                  in their feed. High clarity scores mean your subject stands out clearly against the background with no visual confusion.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How Mobile Readability Is Tested</h3>
                <p className="text-gray-700">
                  Over 70% of YouTube views happen on mobile devices, where thumbnails appear as small as 120 x 68 pixels. Our analyzer 
                  evaluates whether your text remains readable at these tiny sizes, checking font size, contrast against the background, 
                  and overall legibility. If your text can&apos;t be read on mobile, your CTR will suffer significantly.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How Composition Is Evaluated</h3>
                <p className="text-gray-700">
                  Composition analysis examines the visual hierarchy and balance of your thumbnail. The AI checks if elements are 
                  positioned effectively, if there&apos;s visual breathing room, and if the layout guides the eye toward the most important 
                  elements. Cluttered thumbnails with competing elements score lower; clean, focused compositions score higher.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Why Emotion and Intrigue Matter for CTR</h3>
                <p className="text-gray-700">
                  Humans are wired to respond to emotion. Thumbnails with expressive faces, dynamic energy, or emotional cues consistently 
                  outperform bland alternatives. The intrigue score measures whether your thumbnail creates a &quot;curiosity gap&quot;—making 
                  viewers want to click to satisfy their curiosity. Together, emotion and intrigue are often the difference between 
                  a 2% CTR and a 10% CTR.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How Contrast Affects Visibility</h3>
                <p className="text-gray-700">
                  YouTube displays thumbnails against a white background. Thumbnails with strong color contrast—bright colors, bold 
                  outlines, or dramatic lighting—pop off the page and grab attention. Our analyzer measures the visual separation 
                  between elements and evaluates whether your thumbnail will stand out in a crowded feed full of competing content.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Features Grid */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              What Our AI Thumbnail Analyzer Measures
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Comprehensive analysis covering every factor that affects your YouTube thumbnail performance.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: FAQ */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 hover:bg-gray-50">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Explore More Tools */}
          <div className="mt-20">
            <ExploreMoreTools currentTool="youtube-thumbnail-analyzer" />
          </div>
        </div>
      </div>
    </>
  );
}
