import { Metadata } from "next";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import UniversalShoppingCartClient from "./UniversalShoppingCartClient";

export const metadata: Metadata = {
  title: "Universal Shopping Cart (Save From Any Website) | Free Wishlist + Shopping Board",
  description:
    "Save products from any website into one universal shopping cart. Paste a link to capture product title, image, notes, tags, and price-at-save-time. Then click out to buy on the original store. Shareable lists included.",
  keywords: [
    "universal shopping cart",
    "save products from any website",
    "universal wishlist",
    "shopping board",
    "save product links",
    "wishlist maker",
    "shopping list app",
    "product bookmark tool",
    "save items to buy later",
    "shareable wishlist",
    "shopping cloud",
  ],
  openGraph: {
    title: "Universal Shopping Cart – Save Products From Any Website",
    description:
      "Paste any product link to save it into one cart with notes, tags, and price-at-save-time. Then open the merchant to buy on their site.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM Universal Shopping Cart",
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Universal shopping cart that saves products from any website using link metadata (OpenGraph). Add notes, tags, and price-at-save-time. Share lists and click out to merchants to purchase.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I buy directly inside the Universal Shopping Cart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. This tool is a universal save cart and shopping board. It stores product links and details so you can compare and organize items. When you're ready to buy, you click 'Open on merchant' to purchase on the original store.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work on any website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It works on most public product pages. If a site blocks metadata, you can still save the link and edit title, image, and price manually.",
      },
    },
    {
      "@type": "Question",
      name: "Do you track prices automatically?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not by default. You can save a price-at-save-time and update it manually. (Automatic tracking may be added later.)",
      },
    },
    {
      "@type": "Question",
      name: "Is my cart private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes by default. Sharing is optional. If you generate a share link, only people with that link can view the shared cart.",
      },
    },
    {
      "@type": "Question",
      name: "Do you store my shopping activity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The tool stores only what you choose to save: the URL and the fields you add (title, image, notes, tags, price). It does not track your browsing history.",
      },
    },
  ],
};

const exampleBoards = [
  {
    title: "Apartment Setup Board",
    items: 24,
    verdict: "One place for furniture + decor links across multiple stores.",
    tags: ["couch", "lamp", "rug", "kitchen"],
    useCase: "Perfect for comparing items across Ikea, Amazon, West Elm, etc.",
  },
  {
    title: "Gym Fits Wishlist",
    items: 18,
    verdict: "Save fits, track sizes/colors, and wait for sales.",
    tags: ["shoes", "shorts", "hoodie"],
    useCase: "Use price-at-save-time to know when a drop is actually a deal.",
  },
  {
    title: "Gift List",
    items: 15,
    verdict: "Share a clean list with friends/family for approvals.",
    tags: ["mom", "dad", "friends"],
    useCase: "Turn sharing on to send one link instead of 20 screenshots.",
  },
];

const features = [
  { name: "Save from any website", description: "Paste a link and save products across stores in one cart" },
  { name: "Auto product details", description: "Pulls title/image/description when sites expose metadata" },
  { name: "Notes + tags", description: "Add context and filter saved items instantly" },
  { name: "Price-at-save-time", description: "Track what you saw it for and update later" },
  { name: "Shareable cart link", description: "Send one clean link instead of screenshots" },
  { name: "Click-out purchasing", description: "Buy directly on the original merchant site" },
  { name: "Search + filtering", description: "Find items fast by text or tags" },
  { name: "Private by default", description: "Sharing is optional and controlled by you" },
];

const faqs = [
  {
    q: "Can I buy directly inside the Universal Shopping Cart?",
    a: "No. This is a universal save cart (shopping board). It centralizes product links and details. When you're ready, you click out to the original store to purchase.",
  },
  {
    q: "Does it work on any website?",
    a: "It works on most public product pages. If a site blocks metadata, you can still save the link and manually edit the title/image/price.",
  },
  {
    q: "Can I track prices automatically?",
    a: "Not by default. You can save a price-at-save-time and update it manually. If you want automated tracking later, that can be added as a premium feature.",
  },
  {
    q: "Is my cart private?",
    a: "Yes by default. You can optionally enable sharing to generate a public link. Anyone with the link can view, but they can't edit.",
  },
  {
    q: "Why use this instead of bookmarks?",
    a: "Bookmarks are messy and lose context. This tool keeps product images, notes, tags, and price-at-save-time so you can actually compare and decide.",
  },
  {
    q: "Can I make multiple lists?",
    a: "If your current build supports multiple carts/lists, yes. If not, the first version is typically one cart. Multiple lists is a clean next upgrade.",
  },
];

export default function UniversalShoppingCartPage() {
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
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7H19M7 13h12M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              Save-From-Anywhere Shopping Cart
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Universal Shopping Cart
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Save products from <strong>any website</strong> into one cart with notes, tags, and price-at-save-time.
              When you're ready, click out and buy on the original store.
            </p>
          </div>

          {/* Tool UI */}
          <UniversalShoppingCartClient />

          {/* SECTION 1: Keyword-rich intro */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              A Universal Wishlist That Works Across Every Store
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                Bookmarks are chaos. Screenshots get lost. Store-specific wishlists lock you into one site.
                The <strong>Universal Shopping Cart</strong> is a single place to save any product link—across
                Amazon, Shopify stores, boutiques, marketplace listings, and more.
              </p>
              <p>
                Paste a URL and the tool captures the product's basic details (title, image, description when available).
                Add <strong>notes</strong> (size, color, "wait for sale"), <strong>tags</strong> ("gifts", "apartment", "gym fits"),
                and a <strong>price-at-save-time</strong> so you can compare items later.
              </p>
              <p>
                This is not checkout. It's a <strong>shopping board</strong> built for decision-making. When you're ready to buy,
                you click <strong>Open on merchant</strong> and purchase directly on the original store's site.
              </p>
            </div>
          </section>

          {/* SECTION 2: Example boards */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              What People Use a Universal Shopping Cart For
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Real use cases that are painful with bookmarks and impossible with store-only wishlists.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {exampleBoards.map((b, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{b.title}</h3>
                      <span className="text-sm text-gray-500">{b.items} items</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{b.verdict}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {b.tags.map((t, j) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">{b.useCase}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: How it works */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How the Universal Shopping Cart Works
            </h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1) Save any product link</h3>
                <p>
                  Copy a URL from a product page and paste it into the tool. We'll store the link and attempt to pull basic metadata
                  like title and image (when the site exposes it).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2) Add context (notes, tags, price)</h3>
                <p>
                  Tags let you filter fast. Notes help you remember why you saved it. Price-at-save-time makes comparisons and
                  "wait for sale" decisions actually doable.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3) Click out to buy</h3>
                <p>
                  When you're ready, click <strong>Open on merchant</strong> to purchase on the original store. Your payment,
                  shipping, returns, and checkout happen there—not inside VCM.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4) Share one clean link</h3>
                <p>
                  Enable sharing to generate a link others can view. This is perfect for gift lists, "help me choose," or collab boards.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Features grid */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Features Included
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Built to replace bookmarks with a real decision workflow.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
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

          {/* SECTION 5: Comparison table */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Universal Shopping Cart vs Bookmarks vs Store Wishlists
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Why a save-from-anywhere cart is better than fragmented saving.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center px-6 py-4 font-semibold text-emerald-700">Universal Shopping Cart</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-900">Bookmarks</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-900">Store Wishlists</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Works across any website</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-red-500">No</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-700">Saved images + clean list view</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-red-500">No</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Notes + tags + filtering</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-red-500">No</td>
                    <td className="px-6 py-4 text-center text-orange-500">Limited</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-700">Price-at-save-time</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-red-500">No</td>
                    <td className="px-6 py-4 text-center text-orange-500">Sometimes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Click-out purchasing (no lock-in)</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">Yes</td>
                    <td className="px-6 py-4 text-center text-red-500">No (site-only)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 6: FAQ */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-700">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <ExploreMoreTools currentTool="/tools/universal-shopping-cart" />

          {/* Footer */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              Save links. Organize decisions. Buy on the merchant site.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              VCM Suite.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
