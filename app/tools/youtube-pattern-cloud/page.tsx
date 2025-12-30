import { Metadata } from "next";
import YouTubePatternCloudClient from "./YouTubePatternCloudClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "YouTube Pattern Cloud (YPC) | Outlier Gate for Viral Formats",
  description:
    "A fiduciary gate that rejects risky video ideas by detecting outlier geometry, retention contract integrity, and semantic density. No dashboards. Just REJECT or GREEN-LIGHT.",
  keywords: [
    "youtube outlier videos",
    "retention contract",
    "semantic resets",
    "youtube pattern analysis",
    "viral format gate",
    "youtube video validator",
    "outlier detection youtube",
    "video idea validator",
    "youtube content strategy",
    "viral video patterns",
  ],
  openGraph: {
    title: "YouTube Pattern Cloud (YPC) | Outlier Gate",
    description:
      "Fiduciary gate that rejects risky video ideas. REJECT or GREEN-LIGHT.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Pattern Cloud (YPC) | Outlier Gate",
    description:
      "Fiduciary gate that rejects risky video ideas. REJECT or GREEN-LIGHT.",
  },
};

const faqs = [
  {
    question: "What is an outlier video?",
    answer:
      "An outlier video is one that significantly outperforms the channel's typical content—specifically, at least 5x the median view count of the creator's last 20 uploads. This indicates the video escaped the existing audience and reached new viewers.",
  },
  {
    question: "What does REJECT mean?",
    answer:
      "REJECT means the video pattern failed a critical gate. The data suggests this format has a high probability of underperforming. Do not invest production time in this video.",
  },
  {
    question: "Why no optimization tips?",
    answer:
      "This tool is a fiduciary gate, not a coach. Its job is to say no when the risk is too high. If you receive REJECT, the correct action is to find a different video idea—not to optimize a fundamentally weak pattern.",
  },
  {
    question: "Does this guarantee virality?",
    answer:
      "No. A GREEN-LIGHT means the investment is rational based on pattern geometry. It does not guarantee success. Many factors outside pattern analysis affect performance.",
  },
  {
    question: "Do you store transcripts?",
    answer:
      "No. Transcripts are processed in memory and immediately discarded. We do not store, log, or retain your script content.",
  },
];

function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "YouTube Pattern Cloud (YPC)",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A fiduciary gate that rejects risky video ideas by detecting outlier geometry, retention contract integrity, and semantic density.",
    featureList: [
      "Outlier validation (5x median threshold)",
      "Click motive sharpness detection",
      "Retention contract analysis",
      "Semantic density scoring",
      "No LLM—deterministic gates",
      "REJECT / STOP / GREEN-LIGHT verdicts",
    ],
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
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function YouTubePatternCloudPage() {
  return (
    <>
      <SoftwareApplicationSchema />
      <FAQSchema />

      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-full mb-4">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Outlier Gate
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              YouTube Pattern Cloud
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Validate video ideas before production. This gate detects outlier
              geometry, retention contract integrity, and semantic density.
            </p>
          </div>

          <YouTubePatternCloudClient />

          <section className="mt-12 text-center">
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              This tool runs 4 hard gates: Outlier Validation, Click Motive
              Sharpness, Retention Contract Check, and Semantic Density. No LLM.
              Deterministic. Cheap.
            </p>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <ExploreMoreTools currentTool="/tools/youtube-pattern-cloud" />
        </div>
      </main>
    </>
  );
}
