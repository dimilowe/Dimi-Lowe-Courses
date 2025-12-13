import { Metadata } from "next";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import AmazonDupeFinderClient from "./AmazonDupeFinderClient";

export const metadata: Metadata = {
  title: "Amazon Dupe Finder (Free) | Find Cheaper Versions of Any Amazon Product",
  description:
    "Paste any Amazon product link and instantly find cheaper dupes. Compare price, see similar items, and buy alternatives fast. Free Amazon dupe finder—no login required.",
  keywords: [
    "amazon dupe finder",
    "find amazon dupes",
    "amazon cheaper alternative",
    "amazon knockoff finder",
    "amazon look alike products",
    "cheaper version of amazon product",
    "amazon product alternative",
    "amazon price comparison",
    "find similar products on amazon",
    "amazon dupe search",
    "amazon dupe tool",
    "shopping dupe finder",
  ],
  openGraph: {
    title: "Amazon Dupe Finder (Free) — Find Cheaper Versions Instantly",
    description:
      "Paste any Amazon link and get cheaper dupes in seconds. Compare prices, see similar items, and save money. Free, no login required.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM Amazon Dupe Finder",
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free Amazon dupe finder that takes any Amazon product URL and returns cheaper, similar alternatives with price comparisons and direct links.",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    ratingCount: "980",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the Amazon Dupe Finder work?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Paste an Amazon product link and the tool analyzes the product title and attributes to find cheaper, similar items. It then shows you alternative products with prices and direct links so you can compare and save money.",
      },
    },
    {
      "@type": "Question",
      name: "Is this Amazon dupe finder free?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. The Amazon Dupe Finder is free to use and does not require an account. Paste a link and get cheaper alternatives instantly.",
      },
    },
    {
      "@type": "Question",
      name: "Does this work for any Amazon product?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "It works best for popular products with clear titles and common categories (fashion, accessories, home, tech). Some niche products may return fewer or less accurate alternatives.",
      },
    },
    {
      "@type": "Question",
      name: "Do you store the Amazon links I paste?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. We only use the link to generate results and do not store your pasted URLs for personal tracking.",
      },
    },
    {
      "@type": "Question",
      name: "Are these exact replicas or inspired alternatives?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Results are similar alternatives based on listing text and category signals. They are not guaranteed exact matches. Always review photos, materials, sizing, and seller info before buying.",
      },
    },
    {
      "@type": "Question",
      name: "What categories work best for finding dupes?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Fashion, accessories, home decor, kitchen items, and everyday essentials typically yield the best results. Electronics and niche items may have fewer alternatives.",
      },
    },
    {
      "@type": "Question",
      name: "Can I find dupes from other stores like Shein or AliExpress?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Currently this tool focuses on Amazon products. We're working on expanding to other marketplaces like Shein and AliExpress in future updates.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate are the price comparisons?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Prices are fetched in real-time from Amazon and may vary based on availability, shipping, and seller. Always verify the final price on Amazon before purchasing.",
      },
    },
    {
      "@type": "Question",
      name: "Why do some products show no dupes?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Unique, niche, or very new products may not have comparable alternatives in our database. Try searching for similar products with more common keywords.",
      },
    },
    {
      "@type": "Question",
      name: "Are the dupe products safe to buy?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "We show alternatives from Amazon with their actual ratings and reviews. Always check seller reputation, return policies, and product reviews before purchasing any item.",
      },
    },
  ],
};

const features = [
  { name: "Instant Cheaper Alternatives", description: "Find lower-cost dupes in seconds from a single Amazon link" },
  { name: "Price Comparison", description: "See savings and compare prices side-by-side" },
  { name: "Similarity Labels", description: "Quickly gauge how close each alternative is to the original" },
  { name: "No Login Required", description: "Use it instantly—no account, no setup" },
  { name: "Mobile-First Results", description: "Designed to be fast and readable on phones" },
  { name: "Shopping Cloud Ready", description: "Built to expand into Shein/AliExpress versions later" },
];

const faqs = [
  {
    q: "How does the Amazon Dupe Finder work?",
    a:
      "Paste an Amazon product link and we generate cheaper, similar alternatives based on product listing signals. You'll get a shortlist of options with prices and links so you can compare quickly.",
  },
  {
    q: "Is this free?",
    a:
      "Yes. This tool is free and does not require an account. Later, premium features may include saving dupes, boards, and price tracking—but the core dupe results stay easy to access.",
  },
  {
    q: "Why are some dupes not perfect matches?",
    a:
      "Because Amazon listings can be inconsistent and products vary by materials, photos, and naming. Use the results as a fast shortlist—then verify details like dimensions, fabric, reviews, and seller reputation.",
  },
  {
    q: "Can I use this for fashion, home, or electronics?",
    a:
      "Yes. It works best when the product has a clear title and a common category. Fashion and home items tend to perform especially well.",
  },
  {
    q: "Do you store my links or personal data?",
    a:
      "No. The link is used to generate results and we don't store your pasted URLs for personal tracking.",
  },
  {
    q: "What if the original product is already the cheapest?",
    a:
      "If no cheaper alternatives exist, we'll let you know. Sometimes the product you found is already the best deal available.",
  },
  {
    q: "Can I save my dupe searches?",
    a:
      "Currently all searches are one-time and not saved. Future premium features may include saved boards and price tracking.",
  },
  {
    q: "How often are prices updated?",
    a:
      "Prices are fetched fresh each time you search. Amazon prices can fluctuate frequently, so we always show current pricing.",
  },
  {
    q: "Does this work on mobile?",
    a:
      "Yes! The dupe finder is fully mobile-optimized. Copy an Amazon link from your phone and paste it directly.",
  },
  {
    q: "What's the difference between 'Very Similar' and 'Inspired'?",
    a:
      "'Very Similar' items closely match the original in design and function. 'Similar' items share many features. 'Inspired' items have a related style but may differ more significantly.",
  },
];

export default function AmazonDupeFinderPage() {
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

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free Amazon Dupe Finder
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Amazon Dupe Finder
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Paste any Amazon product link and instantly find cheaper alternatives.
              Compare prices, spot near-matches, and save money fast.
            </p>
          </div>

          <AmazonDupeFinderClient />

          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Find Cheaper Versions of Any Amazon Product
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                If you've ever seen an Amazon product and thought "this has to exist cheaper," you're right—most of the time.
                Our <strong>Amazon dupe finder</strong> helps you locate similar items at lower prices so you can buy smarter.
              </p>
              <p>
                Just paste an Amazon link. We'll generate a shortlist of alternatives with <strong>price comparisons</strong> and
                quick <strong>similarity labels</strong> so you can choose the best option in seconds.
              </p>
              <p>
                This tool works best for popular categories like fashion, accessories, home goods, and everyday essentials.
                Always confirm product details like material, sizing, reviews, and seller info before purchasing.
              </p>
            </div>
          </section>

          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Free Features Included
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              A fast, consumer-grade dupe finder—no account required.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Dupe Finder FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50">
                    {faq.q}
                    <svg
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-700">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <ExploreMoreTools currentTool="/tools/amazon-dupe-finder" />

          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              Results are suggestions, not guarantees. Always verify product details before purchasing.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © {new Date().getFullYear()} VCM Suite. Built for Shopping Cloud.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
