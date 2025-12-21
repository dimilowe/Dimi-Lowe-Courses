import { Metadata } from "next";
import PLReportBuilderClient from "./PLReportBuilderClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import Link from "next/link";
import {
  Calculator,
  FileText,
  TrendingUp,
  Shield,
  Download,
  RefreshCw,
  Zap,
  PiggyBank,
  ChevronDown,
  BarChart3,
  DollarSign,
  Target,
  Clock,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free P&L Report Builder (Monthly Profit & Loss Statement Generator)",
  description:
    "Create a monthly profit and loss report in minutes. Build revenue, expenses, COGS, add-backs (SDE), and export CSV/TXT. Free, no login required.",
  keywords: [
    "p&l report",
    "p&l management",
    "profit and loss statement",
    "monthly p&l report",
    "p&l template",
    "p&l calculator",
    "how to make a profit and loss statement",
    "profit and loss report",
    "income statement generator",
    "SDE calculator",
    "seller discretionary earnings",
  ],
  openGraph: {
    title: "Free P&L Report Builder (Monthly Profit & Loss Statement Generator)",
    description:
      "Create a monthly profit and loss report in minutes. Build revenue, expenses, COGS, add-backs (SDE), and export CSV/TXT. Free, no login.",
    type: "website",
  },
};

const faqs = [
  {
    q: "What is a P&L report?",
    a: "A P&L (Profit and Loss) report, also called an income statement, summarizes your business's revenues, costs, and expenses during a specific period. It shows whether your business made a profit or loss by subtracting total expenses from total revenue.",
  },
  {
    q: "How often should I create a P&L report?",
    a: "Monthly P&L reports are recommended for active businesses. This frequency lets you spot trends, catch issues early, and make timely decisions. Quarterly and annual reports are useful for bigger-picture analysis and tax preparation.",
  },
  {
    q: "What is the difference between gross profit and net profit?",
    a: "Gross profit is revenue minus cost of goods sold (COGS) — it shows how much you make on products/services before operating costs. Net profit subtracts all operating expenses, taxes, and other costs from gross profit — it's your true bottom line.",
  },
  {
    q: "What is COGS (Cost of Goods Sold)?",
    a: "COGS includes direct costs tied to producing or delivering your products/services. For eCommerce, this includes product costs, packaging, and shipping. For service businesses, it might include contractor labor directly tied to client work.",
  },
  {
    q: "What are add-backs and SDE?",
    a: "Add-backs are owner-specific expenses added back to net profit to calculate Seller's Discretionary Earnings (SDE). These include owner salary, one-time costs, and personal expenses run through the business. SDE is the key metric for valuing small businesses.",
  },
  {
    q: "How can I use a P&L report to manage cash flow?",
    a: "While a P&L shows profitability, it doesn't equal cash flow (timing differs). Use your P&L to identify expense trends, margin changes, and profitability issues. Compare it to your bank balance to understand the gap between profit and cash.",
  },
  {
    q: "What's the difference between a P&L and a cash flow statement?",
    a: "A P&L shows revenue and expenses when they're earned/incurred (accrual basis). A cash flow statement shows actual cash moving in and out. You can be profitable on the P&L but cash-poor if customers pay late or you prepay expenses.",
  },
  {
    q: "What expenses should I track on my P&L?",
    a: "Track all business expenses: payroll, contractors, rent, software, marketing, payment processing fees, shipping, insurance, utilities, travel, and professional services. Avoid lumping too much into 'Miscellaneous' — detailed categories help analysis.",
  },
  {
    q: "How do I present a P&L to a buyer or lender?",
    a: "Present a clean, categorized P&L with clear revenue sources and expense breakdowns. Include SDE calculations for buyers. Use consistent formatting and provide 2-3 years of history if available. Export to PDF or CSV for professional sharing.",
  },
  {
    q: "Does this tool store my financial data?",
    a: "No. This P&L builder runs entirely in your browser. Your data is never sent to our servers. You can optionally save your category structure to your browser's local storage for reuse, but this stays on your device only.",
  },
];

const features = [
  {
    icon: Calculator,
    title: "Monthly P&L Statement Generator",
    description: "Build professional profit and loss reports for any month",
  },
  {
    icon: Layers,
    title: "Revenue & Expense Categories",
    description: "Organize income and costs with detailed line items",
  },
  {
    icon: Target,
    title: "Optional COGS Section",
    description: "Track cost of goods sold for product-based businesses",
  },
  {
    icon: TrendingUp,
    title: "Gross & Net Margin Auto-Calculation",
    description: "See margins update in real-time as you enter data",
  },
  {
    icon: PiggyBank,
    title: "Owner Add-Backs (SDE)",
    description: "Calculate Seller's Discretionary Earnings for valuation",
  },
  {
    icon: BarChart3,
    title: "P&L Health Score",
    description: "Get a 0-100 score with actionable improvement tips",
  },
  {
    icon: Download,
    title: "CSV & TXT Export",
    description: "Download spreadsheet-ready or CPA-friendly formats",
  },
  {
    icon: RefreshCw,
    title: "Save/Load Categories",
    description: "Reuse your setup each month with browser storage",
  },
  {
    icon: Zap,
    title: "Industry Presets",
    description: "Quick-start with Creator, Agency, eCom, or Service presets",
  },
  {
    icon: Shield,
    title: "100% Privacy",
    description: "Runs in your browser — data never leaves your device",
  },
  {
    icon: Clock,
    title: "No Login Required",
    description: "Start building your P&L immediately, no signup",
  },
  {
    icon: DollarSign,
    title: "Multi-Currency Support",
    description: "USD, EUR, GBP, CAD, AUD currency options",
  },
];

export default function PLReportPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Monthly P&L Report Builder",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free monthly profit and loss report builder with revenue, expenses, COGS, SDE add-backs, health score, and CSV/TXT export.",
    featureList: [
      "Monthly P&L statement generator",
      "Revenue and expense tracking",
      "Cost of goods sold (COGS)",
      "Gross and net profit margins",
      "Owner add-backs and SDE calculation",
      "P&L health score",
      "CSV and TXT export",
      "Industry presets",
      "Save/load categories locally",
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

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

      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="pt-16 pb-8 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              100% Free P&L Builder
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Monthly P&L Report Builder
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
              Create a clean profit and loss statement in minutes. Track revenue, expenses, COGS,
              and SDE — then export for your records or share with a buyer or CPA.
            </p>
            <p className="text-sm text-gray-500">
              P&L management starts with a clean monthly P&L. Build yours now — no login required.
            </p>
          </div>
        </section>

        {/* Tool Section */}
        <section className="pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <PLReportBuilderClient />
          </div>
        </section>

        {/* SEO Content Section 1: What is a P&L Report */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What Is a P&L Report and Why It Matters
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-4">
                A <strong>P&L report</strong> (profit and loss report), also known as an income statement, is a
                financial document that summarizes your business&apos;s revenues, costs, and expenses over a specific
                period. It&apos;s the clearest picture of whether your business is making money or losing it.
              </p>
              <p className="text-gray-600 mb-4">
                For small business owners, creators, and agency operators, monthly <strong>P&L management</strong> is
                essential. It helps you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Understand where your money is going each month</li>
                <li>Identify profit leaks and expense creep before they become problems</li>
                <li>Track margin trends to make better pricing decisions</li>
                <li>Prepare for tax season with organized records</li>
                <li>Present professional financials to buyers, investors, or lenders</li>
              </ul>
              <p className="text-gray-600">
                Whether you&apos;re running a lean creator business or managing a growing agency, a monthly P&L ritual
                keeps you in control of your finances.
              </p>
            </div>
          </div>
        </section>

        {/* SEO Content Section 2: What a P&L Report Includes */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What a P&L Report Includes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Revenue</h3>
                <p className="text-gray-600 text-sm">
                  All income sources — product sales, service fees, sponsorships, affiliate commissions, and more.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Cost of Goods Sold (COGS)</h3>
                <p className="text-gray-600 text-sm">
                  Direct costs tied to delivering products/services: inventory, shipping, contractor labor for projects.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Gross Profit</h3>
                <p className="text-gray-600 text-sm">
                  Revenue minus COGS. Shows how much you earn before operating expenses.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Operating Expenses</h3>
                <p className="text-gray-600 text-sm">
                  Regular business costs: payroll, rent, software, marketing, insurance, professional services.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Net Profit</h3>
                <p className="text-gray-600 text-sm">
                  Your bottom line after all expenses. The true measure of business profitability.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Add-Backs & SDE</h3>
                <p className="text-gray-600 text-sm">
                  Owner-specific expenses added back to calculate Seller&apos;s Discretionary Earnings — key for business valuation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section 3: How to Create a Monthly P&L */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How to Create a Monthly P&L Report (Step by Step)
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Categorize Your Revenue",
                  desc: "List all income sources separately. Don't lump everything together — you need to see which revenue streams are growing or shrinking.",
                },
                {
                  step: 2,
                  title: "Separate COGS (If Applicable)",
                  desc: "If you sell products or have direct delivery costs, track COGS separately from operating expenses to see your true gross margin.",
                },
                {
                  step: 3,
                  title: "Reconcile All Expenses",
                  desc: "Go through bank statements and categorize every expense. Minimize 'Miscellaneous' — detailed categories reveal optimization opportunities.",
                },
                {
                  step: 4,
                  title: "Review Margins",
                  desc: "Calculate gross margin (gross profit / revenue) and net margin (net profit / revenue). Compare to previous months and industry benchmarks.",
                },
                {
                  step: 5,
                  title: "Flag Anomalies",
                  desc: "Look for unusual spikes or drops. One-time expenses should be noted. Recurring issues need action plans.",
                },
                {
                  step: 6,
                  title: "Save and Export",
                  desc: "Save your category setup for next month. Export to CSV for spreadsheets or TXT for sharing with accountants or potential buyers.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content Section 4: Common P&L Mistakes */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Common P&L Mistakes to Avoid
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  mistake: "Mixing Personal and Business Expenses",
                  fix: "Keep accounts separate. Personal expenses distort your true profit margins.",
                },
                {
                  mistake: "Dumping Everything into Miscellaneous",
                  fix: "Break out expenses into specific categories for better analysis and tax prep.",
                },
                {
                  mistake: "Forgetting Processing Fees",
                  fix: "Stripe, PayPal, and platform fees add up. Track them as a separate line item.",
                },
                {
                  mistake: "Confusing Profit with Cash",
                  fix: "A profitable P&L doesn't mean cash in the bank. Invoice timing and prepayments create gaps.",
                },
                {
                  mistake: "Not Tracking Marketing ROI",
                  fix: "Separate ad spend from other marketing. You need to see what's driving revenue.",
                },
                {
                  mistake: "Inconsistent Categorization",
                  fix: "Use the same categories month over month. Save your setup to maintain consistency.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-red-600 mb-1">{item.mistake}</h3>
                  <p className="text-gray-600 text-sm">{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content Section 5: P&L Management Tips */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              P&L Management Tips for Business Owners
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Effective <strong>P&L management</strong> goes beyond just creating reports. Here&apos;s how to use your
                monthly P&L as a decision-making tool:
              </p>
              <div className="space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Set Margin Targets</h3>
                  <p className="text-gray-600 text-sm">
                    Define target gross and net margins for your business. Use the P&L Health Score to track progress.
                  </p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Establish Budget Caps</h3>
                  <p className="text-gray-600 text-sm">
                    Set spending limits for categories like software, marketing, and contractors. Review monthly to stay on track.
                  </p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Track Marketing Efficiency</h3>
                  <p className="text-gray-600 text-sm">
                    Compare ad spend to revenue growth. Calculate customer acquisition cost and adjust campaigns accordingly.
                  </p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Watch for Trends</h3>
                  <p className="text-gray-600 text-sm">
                    Compare month-over-month. Rising expenses as a percentage of revenue is a warning sign. Declining margins need investigation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Free P&L Builder Features
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Everything you need to create professional monthly P&L reports — without the complexity or cost.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-center mb-10">
              Common questions about P&L reports, profit margins, and this free tool.
            </p>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl">
                  <summary className="flex items-center justify-between cursor-pointer p-5">
                    <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 text-sm">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Internal CTA to FSBO */}
        <section className="py-12 px-4 bg-orange-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Thinking About Selling Your Business?
            </h2>
            <p className="text-gray-600 mb-6">
              Your P&L report is the foundation of your business valuation. Use our free FSBO toolkit
              to prepare your business for sale — from valuation to buyer vetting.
            </p>
            <Link
              href="/tools/sale-business-by-owner"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Use the For Sale By Owner Toolkit
            </Link>
          </div>
        </section>

        {/* Explore More Tools */}
        <section className="py-16 px-4 bg-white">
          <ExploreMoreTools currentTool="/p-and-l-report" />
        </section>
      </main>
    </>
  );
}
