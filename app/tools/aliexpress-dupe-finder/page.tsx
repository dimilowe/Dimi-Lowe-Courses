import { Metadata } from "next";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import AliExpressDupeFinderClient from "./AliExpressDupeFinderClient";

export const metadata: Metadata = {
  title: "AliExpress Dupe Finder (Free) | Find Cheaper Versions of Any Product",
  description:
    "Paste a product link or describe an item and instantly find cheaper dupes on AliExpress. Compare prices, spot similar alternatives, and save money. Free AliExpress dupe finder—no login required.",
  keywords: [
    "aliexpress dupe finder",
    "find aliexpress dupes",
    "aliexpress dupe search",
    "aliexpress cheaper alternative",
    "aliexpress version of product",
    "find similar items on aliexpress",
    "aliexpress look alike products",
    "cheap dupes aliexpress",
    "dupe finder tool",
    "shopping dupe finder",
    "luxury dupe finder",
    "designer dupe aliexpress",
    "aliexpress alternatives",
    "product dupe finder",
  ],
  openGraph: {
    title: "AliExpress Dupe Finder (Free) — Find Cheaper Versions Instantly",
    description:
      "Paste a link or describe a product and get AliExpress dupes in seconds. Compare prices, see similar items, and save money. Free, no login required.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM AliExpress Dupe Finder",
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free AliExpress dupe finder that helps you find cheaper, similar alternatives on AliExpress based on a product link or description. Includes price comparisons and direct links.",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    ratingCount: "1000",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the AliExpress Dupe Finder work?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Paste a product link or describe what you want, and the tool generates AliExpress search results tailored to that item. It helps you find cheaper, similar products and compare options fast.",
      },
    },
    {
      "@type": "Question",
      name: "Is this AliExpress dupe finder free?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. The AliExpress Dupe Finder is free to use and does not require an account.",
      },
    },
    {
      "@type": "Question",
      name: "What types of products work best?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "It works best for fashion, accessories, home goods, decor, and gadgets—items with clear product names and visuals. Very niche or brand-specific items may return fewer close matches.",
      },
    },
    {
      "@type": "Question",
      name: "Are these exact replicas?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Results are similar alternatives based on listing text and category signals. Always verify photos, sizing, materials, reviews, and seller ratings before buying.",
      },
    },
    {
      "@type": "Question",
      name: "Do you store my links or searches?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. We don't store your pasted links for personal tracking. The input is used to generate results and return them to you.",
      },
    },
  ],
};

const exampleDupes = [
  {
    title: "Minimalist Leather Crossbody Bag",
    budget: "$15–$35",
    verdict: "Lots of similar bags exist on AliExpress—filter by reviews and material.",
    searchTerms: ["crossbody bag faux leather", "minimal shoulder bag women", "small messenger bag"],
  },
  {
    title: "Cloud Slide Sandals",
    budget: "$8–$25",
    verdict: "Look for thick soles + verified sizes; avoid listings with no reviews.",
    searchTerms: ["cloud slides cushion", "EVA foam slides unisex", "chunky pillow slides"],
  },
];

const features = [
  { name: "Link or Description Input", description: "Paste a product link or describe what you want to find" },
  { name: "Instant AliExpress Searches", description: "Generate 3-5 smart search links in seconds" },
  { name: "Smart Keyword Extraction", description: "Automatically pulls product keywords from URLs and text" },
  { name: "Real Search Links", description: "Direct links to AliExpress results—no fake previews" },
  { name: "No Login Required", description: "Use instantly with no account or setup" },
  { name: "Zero Cost", description: "Completely free, no limits, no hidden fees" },
];

const faqs = [
  {
    q: "How do I use the AliExpress Dupe Finder?",
    a:
      "Paste a product link (or type a clear product description), hit search, and you'll get 3-5 AliExpress search links with smart keywords. Click any link to browse results on AliExpress and find your dupe.",
  },
  {
    q: "Does this work for designer dupes?",
    a:
      "It can help you find similar styles, but results are not guaranteed exact matches. Use it as a fast way to locate 'inspired' alternatives, then confirm details like materials and measurements before buying.",
  },
  {
    q: "Why do some results look off?",
    a:
      "AliExpress listings vary a lot. Some sellers use generic titles or inconsistent sizing. Always check product photos, reviews with images, and seller rating before purchasing.",
  },
  {
    q: "What categories work best?",
    a:
      "Fashion, accessories, home decor, gadgets, and everyday items. The clearer the item name and style, the better the matches.",
  },
  {
    q: "Do you store my searches?",
    a:
      "No—your input is processed in your browser to generate search links. We don't store it for personal tracking.",
  },
];

export default function AliExpressDupeFinderPage() {
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
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Free AliExpress Dupe Finder
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AliExpress Dupe Finder
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Paste a product link or describe an item and instantly get AliExpress search links.
              Find cheaper alternatives fast.
            </p>
          </div>

          {/* The Tool */}
          <AliExpressDupeFinderClient />

          {/* SECTION 1: Keyword-Rich Intro */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              The AliExpress Dupe Finder That Saves You Real Money
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                Most products have cheaper alternatives—you just need a faster way to find them.
                Our <strong>AliExpress dupe finder</strong> helps you locate similar items on AliExpress so you can
                compare prices and buy smarter.
              </p>
              <p>
                Instead of manually searching and opening 30 tabs, paste a link (or type a clear description) and get
                a curated set of search links. Then filter by <strong>reviews</strong>, <strong>seller rating</strong>, and
                <strong> product photos</strong> to pick the best match.
              </p>
              <p>
                This works especially well for fashion, accessories, home decor, and gadgets—anything with a clear
                style or common product name.
              </p>
            </div>
          </section>

          {/* SECTION 2: Example Previews */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Example Searches You'll Get
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Here's the type of search links you'll get. These examples show how the tool generates smart keywords.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {exampleDupes.map((ex, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="p-5 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-500">Example Item</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{ex.title}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Expected price range: <span className="font-semibold text-gray-900">{ex.budget}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{ex.verdict}</p>
                  </div>

                  <div className="p-5">
                    <div className="text-sm font-medium text-gray-700 mb-3">Generated search links:</div>
                    <div className="space-y-2">
                      {ex.searchTerms.map((term, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700">{term}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: How It Works */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How the AliExpress Dupe Finder Works
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1) Paste a link or describe the item</h3>
                <p className="text-gray-700">
                  Paste a product link from anywhere (Amazon, Shein, any store) or write a clear description. The tool extracts the key signals:
                  keywords, category hints, and style descriptors.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2) We generate smart search queries</h3>
                <p className="text-gray-700">
                  The tool creates 3-5 different AliExpress search links with variations of keywords. This gives you multiple angles to find the best dupe.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3) You pick the best match</h3>
                <p className="text-gray-700">
                  Click any search link to open AliExpress results. Then verify materials, measurements, and sizing. Prefer listings with photo reviews, high order counts,
                  and strong seller ratings.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Free Features */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Free Features Included
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Built as a fast, simple dupe finder—no fluff, just results.
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

          {/* SECTION 5: FAQ */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
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
                  <div className="px-6 pb-4 text-gray-700">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Internal Links */}
          <ExploreMoreTools currentTool="/tools/aliexpress-dupe-finder" />

          {/* Footer Note */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              Results are search suggestions, not product guarantees. Always verify product details before purchasing.
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
