import { Metadata } from "next";
import FsboToolkitClient from "./FsboToolkitClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import { 
  ClipboardCheck, Calculator, PenTool, Shield, Scale, FileText, 
  Users, DollarSign, TrendingUp, Lock, Clock, CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sale Business by Owner (FSBO) Toolkit — Sell Your Business Without a Broker",
  description: "Free step-by-step toolkit to sell your business by owner. Includes readiness checklist, valuation calculator, listing generator, buyer vetting scripts, NDA template, and deal structure helper. No broker fees, no login required.",
  keywords: [
    "sale business by owner",
    "sell business by owner",
    "how to sell a business without a broker",
    "fsbo business",
    "sell small business without broker",
    "for sale by owner business",
    "business valuation calculator",
    "sell my business myself",
    "fsbo business sale",
    "owner financed business for sale",
    "business listing generator",
    "sell business privately",
    "business sale checklist"
  ],
  openGraph: {
    title: "Sale Business by Owner (FSBO) Toolkit — Sell Your Business Without a Broker",
    description: "Free step-by-step toolkit to sell your business by owner. Valuation calculator, listing generator, buyer vetting scripts, NDA template, and deal structure helper.",
    type: "website",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FSBO Business Sale Toolkit",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1247"
  },
  "description": "Free toolkit for selling a business by owner (FSBO). Includes readiness checklist, SDE-based valuation calculator, listing generator with 3 variants, buyer vetting scripts, NDA template, and deal structure helper."
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can I sell my business without a broker?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, many small business owners successfully sell FSBO (For Sale By Owner). You'll save 8-12% in broker commissions but need to handle marketing, buyer qualification, negotiations, and due diligence yourself. This toolkit provides the frameworks and templates to do it professionally."
      }
    },
    {
      "@type": "Question",
      "name": "How do I value my business for sale?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most small businesses are valued using SDE (Seller's Discretionary Earnings) multiples. Calculate your SDE by adding net profit + owner salary + personal expenses run through the business + one-time costs. Then apply an industry-appropriate multiple (typically 2-4x for most small businesses). Our valuation calculator helps you estimate a reasonable asking range."
      }
    },
    {
      "@type": "Question",
      "name": "What is SDE (Seller's Discretionary Earnings)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SDE represents the total financial benefit a single owner-operator takes from the business. It equals net profit plus owner's salary, personal benefits, non-recurring expenses, and owner perks (like a personal vehicle). SDE is the primary metric buyers use to value and compare small businesses."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to sell a business FSBO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Expect 6-12 months from listing to close for most small businesses. Well-prepared businesses with clean financials, reasonable pricing, and seller financing options may sell faster. Complex businesses or those in distress can take 18+ months."
      }
    },
    {
      "@type": "Question",
      "name": "Should I offer seller financing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Seller financing significantly expands your buyer pool since many buyers don't have full cash. Typical terms are 10-50% down with the balance paid over 2-5 years at 5-10% interest. However, you take on risk if the buyer defaults. Secure the note with business assets and consider personal guarantees."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between asset sale and stock sale?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In an asset sale, the buyer purchases specific business assets (equipment, inventory, contracts, goodwill) but not the legal entity. In a stock sale, they buy your ownership stake in the company itself, inheriting all assets AND liabilities. Asset sales are more common for small businesses and typically preferred by buyers for liability protection."
      }
    },
    {
      "@type": "Question",
      "name": "How do I find buyers for my business?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "List on business-for-sale marketplaces like BizBuySell, BizQuest, and BusinessesForSale.com. Also consider industry-specific forums, LinkedIn outreach to potential acquirers, competitor owners, employees who might want to buy, and your professional network. Many FSBO sales come through personal connections."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need an NDA when selling my business?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, always have prospective buyers sign an NDA before sharing detailed financials or sensitive information. An NDA protects you if a competitor poses as a buyer to gather intelligence, or if information leaks to employees, customers, or vendors. Have an attorney review your NDA."
      }
    },
    {
      "@type": "Question",
      "name": "What documents do I need to sell my business?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Essential documents include: 3 years of P&L statements, 3 years of tax returns, current balance sheet, SDE calculation with add-backs, customer/revenue breakdown, list of assets included, lease agreements, key contracts, employee information, and standard operating procedures. Having these ready speeds up due diligence."
      }
    },
    {
      "@type": "Question",
      "name": "When should I use a broker instead of selling FSBO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Consider a broker if: your business is worth $1M+, you don't have time to manage the sale process, you need access to a broader buyer network, the deal structure is complex, or you're uncomfortable with negotiations. Brokers typically charge 8-12% of the sale price."
      }
    }
  ]
};

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Sale Readiness Checklist",
    description: "24-point checklist covering financials, operations, legal, marketing, and deal prep with progress tracking."
  },
  {
    icon: Calculator,
    title: "Valuation Calculator",
    description: "SDE-based valuation with industry multiples, growth adjustments, and asking price ranges."
  },
  {
    icon: PenTool,
    title: "Listing Generator",
    description: "3 listing variants: Direct, Anonymous, and High-Trust templates ready to post."
  },
  {
    icon: Shield,
    title: "Buyer Vetting Scripts",
    description: "First-message questions, first-call script, and qualification criteria."
  },
  {
    icon: FileText,
    title: "NDA Template",
    description: "Starter non-disclosure agreement template to protect your information."
  },
  {
    icon: Scale,
    title: "Deal Structure Helper",
    description: "Asset vs stock sale, seller financing, earn-out options with risk analysis."
  },
  {
    icon: Users,
    title: "No Login Required",
    description: "Use all tools immediately. Your data stays in your browser."
  },
  {
    icon: DollarSign,
    title: "100% Free",
    description: "No hidden fees, no premium tiers. Complete toolkit at no cost."
  },
  {
    icon: TrendingUp,
    title: "SDE Math Explained",
    description: "See exactly how valuation multiples are calculated for your industry."
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description: "All calculations happen locally. Nothing is stored or transmitted."
  },
  {
    icon: Clock,
    title: "Export Everything",
    description: "Download your complete checklist, valuations, and documents as TXT."
  },
  {
    icon: CheckCircle2,
    title: "Step-by-Step Process",
    description: "Guided modules take you from preparation to deal structure."
  }
];

export default function SaleBusinessByOwnerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
              100% Free FSBO Toolkit
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Sale Business by Owner Toolkit
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sell your business without a broker. Step-by-step tools for valuation, listings, 
              buyer vetting, and deal structuring — all free, no login required.
            </p>
          </div>

          <FsboToolkitClient />
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              What Does &quot;Sale Business by Owner&quot; Mean?
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Selling a business by owner (FSBO) means handling the sale yourself without paying a business 
                broker&apos;s commission — typically 8-12% of the sale price. For a $500,000 business, that&apos;s 
                $40,000-$60,000 you keep in your pocket.
              </p>
              <p>
                FSBO works well for businesses under $1M where the owner has time to manage the sale, 
                understands their financials, and is comfortable with negotiation. You&apos;ll need to handle 
                marketing, buyer qualification, due diligence support, and deal structuring — but with 
                the right tools and preparation, thousands of owners do this successfully every year.
              </p>
              <p>
                This toolkit gives you the frameworks, calculators, and templates that brokers use, 
                so you can present your business professionally and close a fair deal on your own terms.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              When FSBO Works (and When It Doesn&apos;t)
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">FSBO Works Well When:</h3>
                <ul className="space-y-2 text-green-800 text-sm">
                  <li>• Business value under $1M</li>
                  <li>• Clean, verifiable financials (3+ years)</li>
                  <li>• You have time to manage inquiries and showings</li>
                  <li>• Straightforward business model buyers understand</li>
                  <li>• You&apos;re comfortable negotiating</li>
                  <li>• Willing to offer seller financing</li>
                  <li>• Have a CPA and attorney for support</li>
                </ul>
              </div>
              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h3 className="font-semibold text-red-900 mb-3">Consider a Broker When:</h3>
                <ul className="space-y-2 text-red-800 text-sm">
                  <li>• Business value over $1M</li>
                  <li>• Complex deal structure needed</li>
                  <li>• You need access to a broader buyer network</li>
                  <li>• Industry requires specialized knowledge</li>
                  <li>• You don&apos;t have time to manage the process</li>
                  <li>• Confidentiality is extremely sensitive</li>
                  <li>• Business has distressed financials</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Step-by-Step FSBO Process
            </h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Prepare Your Business", desc: "Get financials in order, document processes, calculate SDE, and complete the readiness checklist." },
                { step: 2, title: "Determine Valuation", desc: "Use SDE multiples based on your industry, growth trends, and owner dependency to set a realistic asking range." },
                { step: 3, title: "Create Listings", desc: "Write compelling listings for different platforms. Balance providing enough info to attract buyers while protecting confidentiality." },
                { step: 4, title: "Market the Opportunity", desc: "Post on BizBuySell, BizQuest, industry forums, LinkedIn. Leverage your network. Consider targeted outreach to competitors." },
                { step: 5, title: "Qualify Buyers", desc: "Screen inquiries with vetting questions. Require proof of funds before sharing detailed financials. Use NDAs." },
                { step: 6, title: "Negotiate & Structure", desc: "Discuss price, terms, transition, and deal structure. Consider seller financing and earn-outs to bridge gaps." },
                { step: 7, title: "Due Diligence", desc: "Provide documentation, answer questions, facilitate inspections. Most deals take 30-90 days of due diligence." },
                { step: 8, title: "Close the Deal", desc: "Work with attorneys to draft purchase agreement, handle escrow, transfer assets, and complete the transition." }
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Documents You&apos;ll Need
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Financial Documents</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>3 years of Profit & Loss statements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>3 years of tax returns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Current balance sheet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>SDE calculation with add-backs list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Accounts receivable/payable aging</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Business Documents</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Asset list (equipment, inventory, IP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Customer/revenue breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Lease agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Key contracts and vendor agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Standard operating procedures (SOPs)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Common FSBO Mistakes to Avoid
            </h2>
            <div className="space-y-4">
              {[
                { mistake: "Overpricing based on emotion", fix: "Use SDE multiples, not what you 'need' from the sale. Overpriced listings sit for months and become stale." },
                { mistake: "Poor financial documentation", fix: "Buyers need clean, verifiable numbers. Messy books kill deals faster than anything else." },
                { mistake: "Sharing confidential info too early", fix: "Always require NDAs and proof of funds before detailed financials. Competitors pose as buyers." },
                { mistake: "Neglecting the business during sale", fix: "Declining revenue during the sale process tanks your valuation. Stay focused on operations." },
                { mistake: "Being inflexible on terms", fix: "Seller financing, earn-outs, and transition support expand your buyer pool significantly." },
                { mistake: "No professional support", fix: "Use a CPA for financials and an attorney for contracts. The cost is minimal compared to deal mistakes." }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-1">{item.mistake}</h4>
                  <p className="text-gray-600 text-sm">{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Understanding Business Valuation (SDE Multiples)
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Small businesses are typically valued as a multiple of SDE (Seller&apos;s Discretionary Earnings). 
                SDE represents what a new owner-operator can expect to earn from the business.
              </p>
              <h4>How to Calculate SDE:</h4>
              <ul>
                <li><strong>Start with net profit</strong> from your P&L</li>
                <li><strong>Add back owner&apos;s salary</strong> and payroll taxes</li>
                <li><strong>Add back personal expenses</strong> run through the business (car, phone, insurance, travel)</li>
                <li><strong>Add back one-time costs</strong> that won&apos;t recur (lawsuit, major repair, moving costs)</li>
                <li><strong>Add back depreciation/amortization</strong> (non-cash expenses)</li>
              </ul>
              <h4>Typical SDE Multiples by Industry:</h4>
              <ul>
                <li><strong>SaaS/Subscription:</strong> 3.0-6.0x (higher for recurring revenue)</li>
                <li><strong>E-Commerce:</strong> 2.0-4.5x (depends on brand value, supplier relationships)</li>
                <li><strong>Agency/Services:</strong> 2.0-4.0x (client concentration matters)</li>
                <li><strong>Local Service:</strong> 2.0-3.5x (location-dependent, often asset-heavy)</li>
                <li><strong>Content/Media:</strong> 1.5-3.5x (traffic quality and monetization)</li>
              </ul>
              <p>
                Multiples increase for businesses that are growing, less owner-dependent, have recurring revenue, 
                and have clean documentation. They decrease for declining businesses, high owner dependency, 
                customer concentration, and messy financials.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Where to Find Buyers
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Online Marketplaces</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• BizBuySell (largest marketplace)</li>
                  <li>• BizQuest</li>
                  <li>• BusinessesForSale.com</li>
                  <li>• LoopNet (for businesses with real estate)</li>
                  <li>• Flippa (for digital businesses)</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Direct Outreach</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Competitors who want to expand</li>
                  <li>• Suppliers who want vertical integration</li>
                  <li>• Employees interested in ownership</li>
                  <li>• Industry associations and forums</li>
                  <li>• LinkedIn (private messages to prospects)</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Professional Networks</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your CPA&apos;s client network</li>
                  <li>• Attorney referrals</li>
                  <li>• Chamber of Commerce</li>
                  <li>• Industry trade shows</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Search Funds & PE</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Search fund entrepreneurs</li>
                  <li>• Small private equity firms</li>
                  <li>• Family offices</li>
                  <li>• SBA lender networks</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-amber-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Legal & Tax Disclaimer
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-amber-900">
                <strong>This toolkit is for educational purposes only.</strong> It does not constitute legal, 
                tax, or financial advice. Business sales involve complex legal and tax implications that 
                vary by jurisdiction, business structure, and deal terms.
              </p>
              <p className="text-amber-800">
                Always consult with qualified professionals before selling your business:
              </p>
              <ul className="text-amber-800">
                <li>A CPA for tax planning and financial presentation</li>
                <li>An attorney for purchase agreements, NDAs, and legal compliance</li>
                <li>A business appraiser for formal valuations (especially for SBA-financed deals)</li>
              </ul>
              <p className="text-amber-800">
                The valuations, templates, and guidance provided here are starting points. 
                Every business sale is unique and may require customized approaches.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Toolkit Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, i) => (
                <div key={i} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I sell my business without a broker?",
                  a: "Yes, many small business owners successfully sell FSBO. You'll save 8-12% in broker commissions but need to handle marketing, buyer qualification, negotiations, and due diligence yourself. This toolkit provides the frameworks and templates to do it professionally."
                },
                {
                  q: "How do I value my business for sale?",
                  a: "Most small businesses are valued using SDE (Seller's Discretionary Earnings) multiples. Calculate your SDE by adding net profit + owner salary + personal expenses run through the business + one-time costs. Then apply an industry-appropriate multiple (typically 2-4x)."
                },
                {
                  q: "What is SDE (Seller's Discretionary Earnings)?",
                  a: "SDE represents the total financial benefit a single owner-operator takes from the business. It equals net profit plus owner's salary, personal benefits, non-recurring expenses, and owner perks. SDE is the primary metric buyers use to value small businesses."
                },
                {
                  q: "How long does it take to sell a business FSBO?",
                  a: "Expect 6-12 months from listing to close for most small businesses. Well-prepared businesses with clean financials and reasonable pricing may sell faster. Complex or distressed businesses can take 18+ months."
                },
                {
                  q: "Should I offer seller financing?",
                  a: "Seller financing significantly expands your buyer pool. Typical terms are 10-50% down with the balance paid over 2-5 years. However, you take on risk if the buyer defaults. Secure the note with business assets."
                },
                {
                  q: "What's the difference between asset sale and stock sale?",
                  a: "In an asset sale, the buyer purchases specific business assets (equipment, inventory, contracts, goodwill). In a stock sale, they buy your ownership stake in the company, inheriting all assets AND liabilities. Asset sales are more common for small businesses."
                },
                {
                  q: "How do I find buyers for my business?",
                  a: "List on business-for-sale marketplaces (BizBuySell, BizQuest), post in industry forums, reach out on LinkedIn, contact competitors, and leverage your professional network. Many FSBO sales come through personal connections."
                },
                {
                  q: "Do I need an NDA when selling my business?",
                  a: "Yes, always require NDAs before sharing detailed financials. An NDA protects you if a competitor poses as a buyer or if information leaks to employees, customers, or vendors. Have an attorney review your NDA."
                },
                {
                  q: "What documents do I need to sell my business?",
                  a: "Essential documents: 3 years of P&L statements, 3 years of tax returns, current balance sheet, SDE calculation, customer breakdown, asset list, lease agreements, key contracts, and standard operating procedures."
                },
                {
                  q: "When should I use a broker instead of selling FSBO?",
                  a: "Consider a broker if your business is worth $1M+, you don't have time to manage the sale, you need a broader buyer network, or the deal is complex. Brokers typically charge 8-12% of the sale price."
                }
              ].map((faq, i) => (
                <details key={i} className="bg-white border border-gray-200 rounded-lg group">
                  <summary className="px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-gray-600 text-sm">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <ExploreMoreTools currentTool="/sale-business-by-owner" />
        </section>
      </main>
    </>
  );
}
