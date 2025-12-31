import { Metadata } from "next";
import BrandAccessClient from "./BrandAccessClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Brand Access | Curated Brand Contact Pages & Outreach Paths (Pro)",
  description:
    "Find the correct public contact paths for brands, agencies, partnerships, press, affiliates, and influencer programs. Built for deal-ready creators. Pro tool inside VCM Suite.",
  keywords: [
    "brand contact page finder",
    "influencer outreach",
    "brand partnerships contacts",
    "PR contact page",
    "affiliate program contact",
    "sponsorship inquiry page",
    "brand deals",
    "creator partnerships",
    "agency contacts",
    "press contact page",
  ],
  openGraph: {
    title: "Brand Access | Curated Brand Contact Pages",
    description:
      "Find verified public contact paths for brands, agencies, and partnership programs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Access | Curated Brand Contact Pages",
    description:
      "Find verified public contact paths for brands, agencies, and partnership programs.",
  },
};

const faqs = [
  {
    question: "Is this scraping email addresses?",
    answer:
      "No. We do not scrape, extract, or store any private email addresses. Brand Access links only to publicly available contact pages that brands have created for external inquiries.",
  },
  {
    question: "What counts as a 'contact path'?",
    answer:
      "A contact path is a public-facing URL where brands receive inquiries—partnership forms, press pages, influencer program applications, affiliate signups, or general contact pages. We never link to private emails.",
  },
  {
    question: "How often are entries verified?",
    answer:
      "We periodically review entries to ensure contact pages are still active. The 'Verified' date shows when an entry was last confirmed. If you find a broken link, let us know via the request form.",
  },
  {
    question: "Can I request a brand to be added?",
    answer:
      "Yes. Use the 'Request a Brand' form at the bottom of the page. We review requests regularly and add entries when we can verify a public contact path exists.",
  },
  {
    question: "Can I submit a brand to add?",
    answer:
      "Yes. Use the Contact Page Finder at the top of the page to find a brand's contact page, then submit the result for review. Submissions are reviewed by our team before being added to the directory.",
  },
  {
    question: "Why do I need Pro to see contact paths?",
    answer:
      "Brand Access is a Pro-tier tool inside Intelligence Cloud. Free users can preview entries and see brand names, but full contact URLs require an active Pro subscription.",
  },
  {
    question: "Do you have all brands?",
    answer:
      "No. This is a curated directory, not a comprehensive database. We focus on brands that creators frequently seek for partnerships, sponsorships, and affiliate deals.",
  },
];

function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VCM Brand Access",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A curated directory of verified public contact paths for brands, agencies, and partnership programs. Built for deal-ready creators.",
    featureList: [
      "Search brands by name",
      "Filter by contact type",
      "Verified contact paths",
      "Copy link with one click",
      "Request missing brands",
      "Pro-tier gated access",
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

export default function BrandAccessPage() {
  return (
    <>
      <SoftwareApplicationSchema />
      <FAQSchema />

      <main className="min-h-screen bg-white">
        <section className="py-12 md:py-16 bg-gradient-to-b from-zinc-50 to-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
              <span>Pro Tool</span>
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <span>Intelligence Cloud</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Brand Access
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Curated contact paths for brands, agencies, and opportunities—for deal-ready creators.
            </p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-4">
            <BrandAccessClient />
          </div>
        </section>

        <section className="py-12 bg-zinc-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-zinc-900 mb-2">{faq.question}</h3>
                  <p className="text-zinc-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <ExploreMoreTools currentTool="brand-access" />
          </div>
        </section>
      </main>
    </>
  );
}
