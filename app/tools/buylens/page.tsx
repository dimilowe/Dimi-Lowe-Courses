import { Metadata } from "next";
import BuyLensClient from "./BuyLensClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "BuyLens — Compare Prices & Find the Best Deal | VCM Suite",
  description: "BuyLens scans the public web to find and compare real shopping options. See prices, shipping costs, and tradeoffs to make confident buying decisions.",
  keywords: "price comparison, shopping comparison, best deal finder, price checker, buy smart, compare prices online, shopping helper, best value finder",
  openGraph: {
    title: "BuyLens — Compare Prices & Find the Best Deal | VCM Suite",
    description: "BuyLens scans the public web to find and compare real shopping options. See prices, shipping costs, and tradeoffs to make confident buying decisions.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "BuyLens",
        "applicationCategory": "ShoppingApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free tool"
        },
        "description": "Compare prices across retail and resale sites to find the best deal. BuyLens scans the public web and ranks options by price, shipping, and value.",
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
            "name": "What is BuyLens?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "BuyLens is a shopping comparison tool that scans the public web to find and rank real product listings. It shows you prices, shipping costs, and tradeoffs to help you make confident buying decisions."
            }
          },
          {
            "@type": "Question",
            "name": "Which sites does BuyLens check?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "BuyLens checks major retail sites like Best Buy, Walmart, and Target, as well as resale marketplaces like eBay, Grailed, Poshmark, Depop, StockX, and GOAT."
            }
          },
          {
            "@type": "Question",
            "name": "Does BuyLens store my data or scrape pages?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. BuyLens only extracts structured product data (prices, titles, shipping) from public pages. We never store raw HTML and we respect robots.txt."
            }
          },
          {
            "@type": "Question",
            "name": "How is BuyLens different from Google Shopping?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "BuyLens focuses on transparency. We show you exactly which sources we scanned, their status, and explain why each option ranks where it does. We also include resale marketplaces that Google Shopping doesn't cover."
            }
          }
        ]
      }
    ])
  }
};

export default async function BuyLensPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Shopping Cloud • Free Tool
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            BuyLens
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See every real option. Understand the tradeoffs. Buy with confidence.
          </p>
        </div>

        <BuyLensClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What is BuyLens?</h2>
          <p className="text-gray-600 mb-4">
            <strong>BuyLens</strong> is a smart shopping comparison tool that scans the public web to find real product listings across major retailers and resale marketplaces. Instead of manually checking multiple sites, BuyLens does the work for you—showing prices, shipping costs, conditions, and explaining the tradeoffs between options.
          </p>
          <p className="text-gray-600 mb-4">
            Whether you're looking for the <strong>cheapest price</strong>, the <strong>best value</strong>, or the <strong>fastest shipping</strong>, BuyLens ranks options based on your preferences and shows you exactly why each result appears where it does.
          </p>
          <p className="text-gray-600">
            We scan both <strong>retail sites</strong> (Best Buy, Walmart, Target) and <strong>resale marketplaces</strong> (eBay, Grailed, Poshmark, Depop, StockX, GOAT) to give you the complete picture. All from one search.
          </p>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How BuyLens Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Describe What You Want</h3>
              <p className="text-sm text-gray-600">Enter a natural language description of what you're looking to buy. Set optional filters like budget, condition, or market type.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">We Scan the Web</h3>
              <p className="text-sm text-gray-600">BuyLens visits public search pages on trusted sites, extracts structured product data, and respects each site's robots.txt.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Ranked Results</h3>
              <p className="text-sm text-gray-600">See a ranked list of options with prices, shipping, and clear explanations of why each option appears where it does.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">BuyLens Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Multi-Site Comparison", desc: "Scan retail and resale sites in one search" },
              { title: "Total Price Sorting", desc: "Include shipping in price comparisons" },
              { title: "Condition Filtering", desc: "Filter by new, used, or any condition" },
              { title: "Transparent Ranking", desc: "See exactly why each result ranks where it does" },
              { title: "Source Status Tracking", desc: "Know which sites were scanned successfully" },
              { title: "Budget Limits", desc: "Set a max budget to filter out expensive options" },
              { title: "Past Runs History", desc: "View your last 10 searches" },
              { title: "Privacy Focused", desc: "No raw HTML stored, robots.txt respected" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">BuyLens vs. Other Options</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Feature</th>
                  <th className="text-center py-3 px-2 font-medium text-orange-600">BuyLens</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Google Shopping</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Manual Search</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Checks resale marketplaces", buylens: true, google: false, manual: true },
                  { feature: "Shows shipping in total", buylens: true, google: "Sometimes", manual: true },
                  { feature: "Explains ranking logic", buylens: true, google: false, manual: "N/A" },
                  { feature: "Shows source status", buylens: true, google: false, manual: "N/A" },
                  { feature: "Saves time", buylens: true, google: true, manual: false },
                  { feature: "Condition filtering", buylens: true, google: "Limited", manual: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-gray-900">{row.feature}</td>
                    <td className="py-3 px-2 text-center">
                      {row.buylens === true ? "✓" : row.buylens === false ? "—" : row.buylens}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {row.google === true ? "✓" : row.google === false ? "—" : row.google}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {row.manual === true ? "✓" : row.manual === false ? "—" : row.manual}
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
            {[
              {
                q: "What is BuyLens?",
                a: "BuyLens is a shopping comparison tool that scans the public web to find and rank real product listings. It shows you prices, shipping costs, and tradeoffs to help you make confident buying decisions."
              },
              {
                q: "Which sites does BuyLens check?",
                a: "BuyLens checks major retail sites (Best Buy, Walmart, Target) and resale marketplaces (eBay, Grailed, Poshmark, Depop, StockX, GOAT)."
              },
              {
                q: "Does BuyLens store my data or scrape pages?",
                a: "No. BuyLens only extracts structured product data (prices, titles, shipping) from public pages. We never store raw HTML and we always respect robots.txt."
              },
              {
                q: "Why do some sources show 'blocked' or 'captcha' status?",
                a: "Some websites use bot detection. When we detect this, we stop immediately and record the status. We never attempt to bypass security measures."
              },
              {
                q: "How is total price calculated?",
                a: "When shipping info is available and you have 'Include shipping' enabled, we add item price + shipping to get the total. If shipping is unknown, we show the item price only and note that shipping is unknown."
              },
              {
                q: "What does the ranking mean?",
                a: "Ranking depends on your optimization choice. 'Cheapest' sorts by total price. 'Best value' considers data confidence and price. We always show what method was used."
              },
              {
                q: "Is BuyLens free?",
                a: "Yes. BuyLens is currently free to use."
              },
              {
                q: "How many searches can I run per day?",
                a: "Each signed-in account can run up to 10 BuyLens searches per day."
              },
              {
                q: "Can I see my past searches?",
                a: "Yes! Your last 10 runs are saved and displayed at the bottom of the tool."
              },
              {
                q: "Does BuyLens work on mobile?",
                a: "Yes, BuyLens is fully responsive and works on phones and tablets."
              }
            ].map((faq, idx) => (
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

        <ExploreMoreTools currentTool="/tools/buylens" />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Public web only. We don't store scraped pages. BuyLens respects robots.txt and site security measures.
            <br />
            <Link href="/pricing" className="text-orange-600 hover:text-orange-700">
              View pricing
            </Link>
            {" | "}
            <Link href="/tools" className="text-orange-600 hover:text-orange-700">
              All Tools
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
