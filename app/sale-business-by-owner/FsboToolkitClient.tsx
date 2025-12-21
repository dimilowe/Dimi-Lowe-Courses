"use client";

import { useState, useCallback } from "react";
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp, Copy, Download, 
  HelpCircle, AlertTriangle, DollarSign, FileText, Users, Handshake,
  ClipboardCheck, Calculator, PenTool, Shield, Scale
} from "lucide-react";

type TabId = "readiness" | "valuation" | "listing" | "vetting" | "deal";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  whyItMatters: string;
  completed: boolean;
}

interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

const INITIAL_CHECKLIST: ChecklistCategory[] = [
  {
    id: "financials",
    name: "Financials & Books",
    items: [
      { id: "f1", label: "3 years of P&L statements ready", description: "Profit and loss statements showing revenue, expenses, and net income", whyItMatters: "Buyers need financial history to verify earnings and project future performance", completed: false },
      { id: "f2", label: "Balance sheet prepared", description: "Current assets, liabilities, and owner's equity snapshot", whyItMatters: "Shows what assets transfer and any debts the buyer inherits", completed: false },
      { id: "f3", label: "Tax returns available (3 years)", description: "Business tax returns that match your P&L claims", whyItMatters: "Tax returns verify your reported income is accurate and legitimate", completed: false },
      { id: "f4", label: "SDE/Owner's benefit calculated", description: "Net profit + owner salary + add-backs documented", whyItMatters: "SDE is the primary metric buyers use to value and compare businesses", completed: false },
      { id: "f5", label: "Add-backs list documented", description: "Personal expenses, one-time costs, owner perks itemized", whyItMatters: "Proper add-backs can significantly increase your valuation", completed: false }
    ]
  },
  {
    id: "operations",
    name: "Operations & Transferability",
    items: [
      { id: "o1", label: "SOPs documented", description: "Standard operating procedures for key business functions", whyItMatters: "Documented processes reduce risk and make the business less dependent on you", completed: false },
      { id: "o2", label: "Key employee retention plan", description: "Strategy to keep critical team members through transition", whyItMatters: "Losing key staff during a sale can tank the deal or price", completed: false },
      { id: "o3", label: "Vendor/supplier relationships documented", description: "List of suppliers, terms, and relationship history", whyItMatters: "Buyers need to know these relationships will transfer smoothly", completed: false },
      { id: "o4", label: "Customer concentration analyzed", description: "No single customer represents more than 20-25% of revenue", whyItMatters: "High customer concentration is a major risk factor that reduces valuation", completed: false },
      { id: "o5", label: "Technology/systems list ready", description: "All software, tools, subscriptions, and login credentials", whyItMatters: "Clean handoff of systems speeds up transition and builds buyer confidence", completed: false }
    ]
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    items: [
      { id: "l1", label: "Business entity docs current", description: "Articles of incorporation, operating agreements up to date", whyItMatters: "Legal issues here can delay or kill deals in due diligence", completed: false },
      { id: "l2", label: "Contracts/leases reviewed", description: "All customer contracts, vendor agreements, lease terms", whyItMatters: "Assignability of contracts is critical for deal structure", completed: false },
      { id: "l3", label: "IP ownership confirmed", description: "Trademarks, patents, copyrights, domain names in your name", whyItMatters: "Unclear IP ownership creates legal risk buyers won't accept", completed: false },
      { id: "l4", label: "Licenses/permits transferable", description: "Business licenses, professional certifications, permits", whyItMatters: "Non-transferable licenses can be deal-breakers", completed: false },
      { id: "l5", label: "No pending litigation", description: "No lawsuits, disputes, or regulatory issues pending", whyItMatters: "Unresolved legal issues scare off serious buyers", completed: false }
    ]
  },
  {
    id: "marketing",
    name: "Marketing & Buyer Pipeline",
    items: [
      { id: "m1", label: "Listing description drafted", description: "Compelling summary of the business opportunity", whyItMatters: "First impressions determine which buyers reach out", completed: false },
      { id: "m2", label: "Confidentiality strategy set", description: "Plan to protect business info from competitors/employees", whyItMatters: "Leaks can damage your business and kill deals", completed: false },
      { id: "m3", label: "Target buyer profile defined", description: "Ideal buyer characteristics and qualifications", whyItMatters: "Knowing your buyer helps you screen and negotiate effectively", completed: false },
      { id: "m4", label: "Listing platforms identified", description: "Where you'll advertise: BizBuySell, brokers, industry sites", whyItMatters: "Right platforms reach right buyers faster", completed: false }
    ]
  },
  {
    id: "deal",
    name: "Deal Structure Prep",
    items: [
      { id: "d1", label: "Asking price range set", description: "Target price based on valuation analysis", whyItMatters: "Starting point for negotiations must be defensible", completed: false },
      { id: "d2", label: "Deal structure preferences defined", description: "Asset vs stock sale, seller financing terms, earn-out openness", whyItMatters: "Knowing what you'll accept speeds up negotiations", completed: false },
      { id: "d3", label: "Transition period planned", description: "How long you'll stay to train the buyer (30/60/90 days)", whyItMatters: "Transition support reduces buyer risk and can command premium pricing", completed: false },
      { id: "d4", label: "Non-compete terms considered", description: "Geographic and time boundaries you'll accept", whyItMatters: "Most buyers require non-compete agreements", completed: false },
      { id: "d5", label: "Exit timeline realistic", description: "Typical sale takes 6-12 months from listing to close", whyItMatters: "Rushed sellers get lower prices and worse terms", completed: false }
    ]
  }
];

const INDUSTRY_MULTIPLES: Record<string, { low: number; high: number; label: string }> = {
  saas: { low: 3.0, high: 6.0, label: "SaaS / Subscription" },
  agency: { low: 2.0, high: 4.0, label: "Agency / Services" },
  ecom: { low: 2.0, high: 4.5, label: "E-Commerce" },
  local: { low: 2.0, high: 3.5, label: "Local Service Business" },
  content: { low: 1.5, high: 3.5, label: "Content / Media" },
  other: { low: 2.0, high: 4.0, label: "Other" }
};

const GROWTH_ADJUSTMENTS = { declining: -0.5, flat: 0, growing: 0.5 };
const DEPENDENCY_ADJUSTMENTS = { high: -0.5, medium: 0, low: 0.25 };

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

export default function FsboToolkitClient() {
  const [activeTab, setActiveTab] = useState<TabId>("readiness");
  const [checklist, setChecklist] = useState<ChecklistCategory[]>(INITIAL_CHECKLIST);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["financials"]));
  
  const [revenue, setRevenue] = useState<string>("");
  const [sde, setSde] = useState<string>("");
  const [industry, setIndustry] = useState<string>("other");
  const [growth, setGrowth] = useState<"declining" | "flat" | "growing">("flat");
  const [dependency, setDependency] = useState<"high" | "medium" | "low">("medium");
  
  const [businessType, setBusinessType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [yearsInBusiness, setYearsInBusiness] = useState<string>("");
  const [assetsIncluded, setAssetsIncluded] = useState<string>("");
  const [reasonForSelling, setReasonForSelling] = useState<string>("");
  const [askingPriceInput, setAskingPriceInput] = useState<string>("");
  const [showAskingPrice, setShowAskingPrice] = useState<boolean>(true);
  const [sellerFinancing, setSellerFinancing] = useState<boolean>(false);
  
  const [dealType, setDealType] = useState<"asset" | "stock">("asset");
  const [hasSellerFinancing, setHasSellerFinancing] = useState<boolean>(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>("50");
  const [financingTerm, setFinancingTerm] = useState<string>("3");
  const [financingRate, setFinancingRate] = useState<string>("6");
  const [hasEarnout, setHasEarnout] = useState<boolean>(false);
  const [earnoutMetric, setEarnoutMetric] = useState<string>("revenue");
  const [earnoutDuration, setEarnoutDuration] = useState<string>("12");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleItem = (categoryId: string, itemId: string) => {
    setChecklist(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
    }));
  };

  const totalItems = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checklist.reduce((sum, cat) => sum + cat.items.filter(i => i.completed).length, 0);
  const readinessScore = Math.round((completedItems / totalItems) * 100);

  const calculateValuation = useCallback(() => {
    const sdeValue = parseFloat(sde.replace(/[^0-9.]/g, ""));
    if (!sdeValue || sdeValue <= 0) return null;

    const baseMultiple = INDUSTRY_MULTIPLES[industry] || INDUSTRY_MULTIPLES.other;
    const growthAdj = GROWTH_ADJUSTMENTS[growth];
    const depAdj = DEPENDENCY_ADJUSTMENTS[dependency];

    let lowMultiple = Math.max(1.0, baseMultiple.low + growthAdj + depAdj);
    let highMultiple = Math.max(1.5, baseMultiple.high + growthAdj + depAdj);

    const askingLow = sdeValue * lowMultiple;
    const askingHigh = sdeValue * highMultiple;
    const quickSaleLow = askingLow * 0.85;
    const quickSaleHigh = askingHigh * 0.9;

    return {
      sdeValue,
      baseMultiple,
      lowMultiple,
      highMultiple,
      askingLow,
      askingHigh,
      quickSaleLow,
      quickSaleHigh,
      growthAdj,
      depAdj
    };
  }, [sde, industry, growth, dependency]);

  const valuation = calculateValuation();

  const generateListings = useCallback(() => {
    if (!businessType.trim()) return null;

    const loc = location.trim() || "Remote/Online";
    const years = yearsInBusiness ? `${yearsInBusiness} years` : "Established";
    const assets = assetsIncluded.trim() || "All business assets, customer list, and IP";
    const financing = sellerFinancing ? "Seller financing available for qualified buyers." : "";
    const price = showAskingPrice && askingPriceInput ? `Asking: ${askingPriceInput}` : "Asking price available upon NDA.";
    const reason = reasonForSelling.trim() ? `Reason for sale: ${reasonForSelling.trim()}` : "";

    const direct = `FOR SALE BY OWNER: ${businessType}

Location: ${loc}
Established: ${years} in business
${price}

What's Included:
${assets}

${reason}

${financing}

Serious inquiries only. Proof of funds required. Contact owner directly for information package.`.trim();

    const anonymous = `Confidential Business Opportunity — ${businessType}

A well-established ${businessType.toLowerCase()} is available for acquisition. This is a direct sale by owner (no broker).

Location: ${loc}
Operating History: ${years}
${showAskingPrice && askingPriceInput ? `Price Range: ${askingPriceInput}` : "Price: Available after NDA"}

Opportunity includes: ${assets}

${financing}

To receive the full information package:
1. Sign our standard NDA
2. Provide proof of funds or financing
3. Brief background on your experience

Reply with your qualifications to begin the process.`.trim();

    const highTrust = `${businessType} — Direct Sale by Owner (No Broker Fees)

${years} | ${loc}

I'm the owner and I'm selling this business directly. Here's what I can offer:

✓ Full financials available (3 years P&L, tax returns, SDE calculation)
✓ Clean books — accountant-prepared statements
✓ 60-90 day transition support included
✓ All documentation ready for due diligence

What Transfers:
${assets}

${showAskingPrice && askingPriceInput ? `Asking: ${askingPriceInput} — priced for a fair, clean deal.` : "Pricing discussed after qualification."}

${financing}

${reason}

Process:
1. Initial call to verify fit (15 min)
2. NDA + proof of funds
3. Full info package + Q&A
4. Due diligence period
5. Close

I'm looking for a qualified buyer who can close within 90 days. Tire-kickers and brokers soliciting listings need not apply.

Reply with a brief intro and your timeline.`.trim();

    return { direct, anonymous, highTrust };
  }, [businessType, location, yearsInBusiness, assetsIncluded, reasonForSelling, askingPriceInput, showAskingPrice, sellerFinancing]);

  const listings = generateListings();

  const vettingQuestions = [
    "What is your background in this industry or similar businesses?",
    "Do you have proof of funds or pre-approved financing? (We require this before sharing detailed financials.)",
    "What is your timeline for acquiring and taking over a business?",
    "Are you looking to operate this business yourself or hire management?",
    "Have you purchased a business before? If so, briefly describe that experience."
  ];

  const firstCallScript = [
    "Thank them for their interest and confirm they received the initial info",
    "Ask about their background and why this business interests them",
    "Verify their timeline and funding situation",
    "Explain your transition support and what's included in the sale",
    "Outline next steps: NDA → detailed financials → due diligence → LOI",
    "Set expectations: you're looking for a serious buyer who can move efficiently",
    "Answer their initial questions but save detailed financials for after NDA"
  ];

  const ndaTemplate = `MUTUAL NON-DISCLOSURE AGREEMENT

This Agreement is entered into as of [DATE] between:

Disclosing Party (Seller): ________________________
Receiving Party (Prospective Buyer): ________________________

1. PURPOSE: The Receiving Party wishes to evaluate the potential acquisition of [Business Name] ("the Business").

2. CONFIDENTIAL INFORMATION includes all financial records, customer lists, supplier information, operating procedures, pricing, and any other business information disclosed.

3. OBLIGATIONS: Receiving Party agrees to:
   - Keep all information strictly confidential
   - Not disclose to third parties without written consent
   - Use information solely for evaluating the acquisition
   - Return or destroy all materials upon request

4. TERM: This agreement remains in effect for 2 years from the date above.

5. EXCLUSIONS: Information that is publicly available, already known, or independently developed is excluded.

SIGNATURES:

Seller: ______________________ Date: __________

Buyer: ______________________ Date: __________

[TEMPLATE ONLY — NOT LEGAL ADVICE. CONSULT AN ATTORNEY BEFORE USE.]`;

  const dealSummary = useCallback(() => {
    const parts: string[] = [];
    
    if (dealType === "asset") {
      parts.push("This would be structured as an ASSET SALE, meaning the buyer purchases specific business assets (equipment, inventory, customer contracts, IP, goodwill) rather than the legal entity itself. You retain the business entity and any liabilities not explicitly transferred.");
    } else {
      parts.push("This would be structured as a STOCK SALE, meaning the buyer purchases your ownership stake in the business entity. They inherit everything — assets AND liabilities. This is simpler but carries more risk for the buyer.");
    }

    if (hasSellerFinancing) {
      const down = parseInt(downPaymentPercent) || 50;
      const term = parseInt(financingTerm) || 3;
      const rate = parseFloat(financingRate) || 6;
      parts.push(`You're offering SELLER FINANCING: ${down}% down payment at closing, with the remaining ${100 - down}% paid over ${term} years at ${rate}% annual interest. Payments would be monthly, secured by the business assets.`);
    }

    if (hasEarnout) {
      const months = parseInt(earnoutDuration) || 12;
      parts.push(`You're proposing an EARN-OUT: A portion of the purchase price will be contingent on the business achieving ${earnoutMetric} targets over ${months} months post-sale. This bridges valuation gaps but adds complexity.`);
    }

    return parts.join("\n\n");
  }, [dealType, hasSellerFinancing, downPaymentPercent, financingTerm, financingRate, hasEarnout, earnoutMetric, earnoutDuration]);

  const dealRisks = useCallback(() => {
    const risks: string[] = [];

    if (dealType === "stock") {
      risks.push("Stock sales expose buyers to unknown liabilities — expect more due diligence and possible price reduction requests");
      risks.push("Tax treatment differs: stock sales may be less favorable for you tax-wise compared to asset sales");
    }

    if (hasSellerFinancing) {
      risks.push("You become a creditor: if the buyer fails, you may have to foreclose or lose remaining payments");
      risks.push("Ensure you have proper security (UCC filing, personal guarantee) and clear default terms");
      risks.push("Interest income is taxable as ordinary income, not capital gains");
    }

    if (hasEarnout) {
      risks.push("Earn-outs frequently lead to disputes over how targets are calculated");
      risks.push("The buyer controls the business post-sale — they can influence whether earn-out targets are met");
      risks.push("Define clear, objective metrics and have an accountant verify calculations");
    }

    if (!hasSellerFinancing && !hasEarnout) {
      risks.push("All-cash deals are cleanest but limit your buyer pool to those with full liquidity");
    }

    return risks;
  }, [dealType, hasSellerFinancing, hasEarnout]);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportAllAsTxt = () => {
    let content = "FSBO BUSINESS SALE TOOLKIT — EXPORT\n";
    content += "Generated: " + new Date().toLocaleDateString() + "\n";
    content += "=".repeat(50) + "\n\n";

    content += "SECTION 1: READINESS CHECKLIST\n";
    content += "-".repeat(30) + "\n";
    content += `Overall Score: ${readinessScore}% (${completedItems}/${totalItems} items completed)\n\n`;
    
    checklist.forEach(cat => {
      content += `${cat.name}:\n`;
      cat.items.forEach(item => {
        content += `  [${item.completed ? "X" : " "}] ${item.label}\n`;
      });
      content += "\n";
    });

    if (valuation) {
      content += "\nSECTION 2: VALUATION ESTIMATE\n";
      content += "-".repeat(30) + "\n";
      content += `Industry: ${INDUSTRY_MULTIPLES[industry]?.label || "Other"}\n`;
      content += `SDE (Seller's Discretionary Earnings): ${formatCurrency(valuation.sdeValue)}\n`;
      content += `Base Multiple Range: ${valuation.baseMultiple.low.toFixed(1)}x – ${valuation.baseMultiple.high.toFixed(1)}x\n`;
      content += `Growth Trend Adjustment: ${valuation.growthAdj > 0 ? "+" : ""}${valuation.growthAdj.toFixed(2)}x\n`;
      content += `Owner Dependency Adjustment: ${valuation.depAdj > 0 ? "+" : ""}${valuation.depAdj.toFixed(2)}x\n`;
      content += `Final Multiple Range: ${valuation.lowMultiple.toFixed(2)}x – ${valuation.highMultiple.toFixed(2)}x\n\n`;
      content += `Suggested Asking Range: ${formatCurrency(valuation.askingLow)} – ${formatCurrency(valuation.askingHigh)}\n`;
      content += `Quick Sale Range: ${formatCurrency(valuation.quickSaleLow)} – ${formatCurrency(valuation.quickSaleHigh)}\n\n`;
      content += "DISCLAIMER: These are rough estimates only. Actual valuations depend on many factors. Consult a CPA, business broker, or M&A advisor for professional guidance.\n";
    }

    if (listings) {
      content += "\n\nSECTION 3: LISTING DRAFTS\n";
      content += "-".repeat(30) + "\n\n";
      content += "VARIANT 1 — Direct Buyer Friendly:\n";
      content += listings.direct + "\n\n";
      content += "VARIANT 2 — Anonymous / Private:\n";
      content += listings.anonymous + "\n\n";
      content += "VARIANT 3 — High-Trust:\n";
      content += listings.highTrust + "\n";
    }

    content += "\n\nSECTION 4: BUYER VETTING\n";
    content += "-".repeat(30) + "\n\n";
    content += "First Message Filter Questions:\n";
    vettingQuestions.forEach((q, i) => {
      content += `${i + 1}. ${q}\n`;
    });
    content += "\nFirst Call Script Points:\n";
    firstCallScript.forEach((point, i) => {
      content += `${i + 1}. ${point}\n`;
    });
    content += "\nNDA Template:\n";
    content += ndaTemplate + "\n";

    content += "\n\nSECTION 5: DEAL STRUCTURE\n";
    content += "-".repeat(30) + "\n\n";
    content += dealSummary() + "\n\n";
    content += "Key Risks:\n";
    dealRisks().forEach((risk, i) => {
      content += `• ${risk}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fsbo-toolkit-export.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "readiness", label: "Readiness", icon: ClipboardCheck },
    { id: "valuation", label: "Valuation", icon: Calculator },
    { id: "listing", label: "Listing", icon: PenTool },
    { id: "vetting", label: "Vetting", icon: Shield },
    { id: "deal", label: "Deal Structure", icon: Scale }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "readiness" && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Sale Readiness Score</h3>
                  <span className="text-2xl font-bold text-blue-600">{readinessScore}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      readinessScore >= 80 ? "bg-green-500" : 
                      readinessScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{completedItems} of {totalItems} items completed</p>
              </div>

              <div className="space-y-3">
                {checklist.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          {category.items.filter(i => i.completed).length}/{category.items.length}
                        </span>
                      </div>
                      {expandedCategories.has(category.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedCategories.has(category.id) && (
                      <div className="divide-y divide-gray-100">
                        {category.items.map(item => (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleItem(category.id, item.id)}
                                className="mt-0.5 flex-shrink-0"
                              >
                                {item.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${item.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                  {item.label}
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                                <details className="mt-1">
                                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3" />
                                    Why it matters
                                  </summary>
                                  <p className="text-xs text-gray-600 mt-1 pl-4 border-l-2 border-blue-100">
                                    {item.whyItMatters}
                                  </p>
                                </details>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "valuation" && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Disclaimer:</strong> This is a rough estimate only. Actual business valuations depend on many factors including market conditions, buyer pool, deal structure, and more. Always consult with a CPA, business broker, or M&A advisor for professional guidance.
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trailing 12-Month Revenue
                  </label>
                  <input
                    type="text"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="e.g., $500,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SDE (Seller&apos;s Discretionary Earnings) *
                  </label>
                  <input
                    type="text"
                    value={sde}
                    onChange={(e) => setSde(e.target.value)}
                    placeholder="e.g., $150,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Net profit + owner salary + add-backs</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(INDUSTRY_MULTIPLES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Growth Trend</label>
                  <select
                    value={growth}
                    onChange={(e) => setGrowth(e.target.value as "declining" | "flat" | "growing")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="declining">Declining</option>
                    <option value="flat">Flat</option>
                    <option value="growing">Growing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Dependency</label>
                  <select
                    value={dependency}
                    onChange={(e) => setDependency(e.target.value as "high" | "medium" | "low")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High (business relies heavily on you)</option>
                    <option value="medium">Medium (some owner involvement needed)</option>
                    <option value="low">Low (runs mostly independently)</option>
                  </select>
                </div>
              </div>

              {valuation && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Valuation Estimate
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Suggested Asking Range</p>
                      <p className="text-xl font-bold text-green-700">
                        {formatCurrency(valuation.askingLow)} – {formatCurrency(valuation.askingHigh)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <p className="text-sm text-gray-600 mb-1">Quick Sale Range</p>
                      <p className="text-xl font-bold text-amber-700">
                        {formatCurrency(valuation.quickSaleLow)} – {formatCurrency(valuation.quickSaleHigh)}
                      </p>
                      <p className="text-xs text-gray-500">~10-15% below asking for faster close</p>
                    </div>
                  </div>

                  <details className="bg-white rounded-lg p-4 border border-gray-200">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      Show the math
                    </summary>
                    <div className="mt-3 text-sm text-gray-600 space-y-2">
                      <p><strong>SDE:</strong> {formatCurrency(valuation.sdeValue)}</p>
                      <p><strong>Base Multiple ({INDUSTRY_MULTIPLES[industry]?.label}):</strong> {valuation.baseMultiple.low.toFixed(1)}x – {valuation.baseMultiple.high.toFixed(1)}x</p>
                      <p><strong>Growth Adjustment ({growth}):</strong> {valuation.growthAdj > 0 ? "+" : ""}{valuation.growthAdj.toFixed(1)}x</p>
                      <p><strong>Dependency Adjustment ({dependency}):</strong> {valuation.depAdj > 0 ? "+" : ""}{valuation.depAdj.toFixed(2)}x</p>
                      <p><strong>Final Multiple:</strong> {valuation.lowMultiple.toFixed(2)}x – {valuation.highMultiple.toFixed(2)}x</p>
                      <p className="pt-2 border-t"><strong>Calculation:</strong> {formatCurrency(valuation.sdeValue)} × {valuation.lowMultiple.toFixed(2)} to {valuation.highMultiple.toFixed(2)}</p>
                    </div>
                  </details>
                </div>
              )}

              {!valuation && sde === "" && (
                <div className="text-center py-8 text-gray-500">
                  Enter your SDE above to see valuation estimates
                </div>
              )}
            </div>
          )}

          {activeTab === "listing" && (
            <div>
              <p className="text-gray-600 mb-6">
                Generate three listing variants optimized for different buyer types and confidentiality levels.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g., Digital Marketing Agency"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Austin, TX or Remote"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years in Business</label>
                  <input
                    type="text"
                    value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={askingPriceInput}
                      onChange={(e) => setAskingPriceInput(e.target.value)}
                      placeholder="e.g., $450,000"
                      disabled={!showAskingPrice}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={() => setShowAskingPrice(!showAskingPrice)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        showAskingPrice ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {showAskingPrice ? "Show" : "Hide"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s Included</label>
                <textarea
                  value={assetsIncluded}
                  onChange={(e) => setAssetsIncluded(e.target.value)}
                  placeholder="e.g., All client contracts, SOPs, brand assets, website, social accounts, email list (5,000 subscribers)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Selling (optional)</label>
                <input
                  type="text"
                  value={reasonForSelling}
                  onChange={(e) => setReasonForSelling(e.target.value)}
                  placeholder="e.g., Pursuing new venture, Retirement"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellerFinancing}
                    onChange={(e) => setSellerFinancing(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Seller financing available</span>
                </label>
              </div>

              {listings ? (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Red Flags: Don&apos;t Say This
                    </h5>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• &quot;Desperate to sell&quot; or &quot;Must sell quickly&quot; — signals weakness</li>
                      <li>• Specific client names without permission — breaks confidentiality</li>
                      <li>• Unrealistic growth claims without data — destroys trust in due diligence</li>
                      <li>• &quot;Easy money&quot; or &quot;runs itself&quot; — buyers know better</li>
                      <li>• Negative reasons for selling — keep it neutral or positive</li>
                    </ul>
                  </div>

                  {[
                    { title: "Variant 1: Direct Buyer Friendly", content: listings.direct, id: "direct" },
                    { title: "Variant 2: Anonymous / Private", content: listings.anonymous, id: "anonymous" },
                    { title: "Variant 3: High-Trust", content: listings.highTrust, id: "highTrust" }
                  ].map(variant => (
                    <div key={variant.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <h5 className="font-medium text-gray-900">{variant.title}</h5>
                        <button
                          onClick={() => handleCopy(variant.content, variant.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedId === variant.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans bg-white">
                        {variant.content}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Enter your business type above to generate listings
                </div>
              )}
            </div>
          )}

          {activeTab === "vetting" && (
            <div>
              <p className="text-gray-600 mb-6">
                Scripts and templates to qualify buyers and protect yourself during the sale process.
              </p>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      First Message Filter Questions
                    </h5>
                    <button
                      onClick={() => handleCopy(vettingQuestions.join("\n\n"), "vetting")}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === "vetting" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {vettingQuestions.map((q, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <p className="text-gray-700">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      First Call Script
                    </h5>
                    <button
                      onClick={() => handleCopy(firstCallScript.map((p, i) => `${i + 1}. ${p}`).join("\n"), "script")}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === "script" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {firstCallScript.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-gray-700 text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      NDA Starter Template
                    </h5>
                    <button
                      onClick={() => handleCopy(ndaTemplate, "nda")}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === "nda" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Important:</strong> This is a basic template for reference only. 
                        It is NOT a substitute for legal advice. Have an attorney review and customize 
                        any NDA before use in an actual transaction.
                      </p>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                      {ndaTemplate}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deal" && (
            <div>
              <p className="text-gray-600 mb-6">
                Configure your preferred deal structure to generate a plain-English summary you can share with buyers.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sale Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dealType"
                        checked={dealType === "asset"}
                        onChange={() => setDealType("asset")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Asset Sale</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dealType"
                        checked={dealType === "stock"}
                        onChange={() => setDealType("stock")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Stock Sale</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={hasSellerFinancing}
                      onChange={(e) => setHasSellerFinancing(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-medium text-gray-900">Offer Seller Financing</span>
                  </label>

                  {hasSellerFinancing && (
                    <div className="grid md:grid-cols-3 gap-4 ml-6">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Down Payment %</label>
                        <input
                          type="number"
                          value={downPaymentPercent}
                          onChange={(e) => setDownPaymentPercent(e.target.value)}
                          min="10"
                          max="90"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Term (years)</label>
                        <input
                          type="number"
                          value={financingTerm}
                          onChange={(e) => setFinancingTerm(e.target.value)}
                          min="1"
                          max="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Interest Rate %</label>
                        <input
                          type="number"
                          value={financingRate}
                          onChange={(e) => setFinancingRate(e.target.value)}
                          step="0.5"
                          min="0"
                          max="20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={hasEarnout}
                      onChange={(e) => setHasEarnout(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-medium text-gray-900">Include Earn-Out</span>
                  </label>

                  {hasEarnout && (
                    <div className="grid md:grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Performance Metric</label>
                        <select
                          value={earnoutMetric}
                          onChange={(e) => setEarnoutMetric(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="revenue">Revenue</option>
                          <option value="profit">Net Profit</option>
                          <option value="customers">Customer Retention</option>
                          <option value="growth">Growth Rate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Duration (months)</label>
                        <input
                          type="number"
                          value={earnoutDuration}
                          onChange={(e) => setEarnoutDuration(e.target.value)}
                          min="6"
                          max="36"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Handshake className="w-5 h-5 text-blue-600" />
                      Deal Structure Summary
                    </h5>
                    <button
                      onClick={() => handleCopy(dealSummary(), "deal")}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === "deal" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{dealSummary()}</p>
                  </div>

                  {dealRisks().length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h6 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Key Risks to Consider
                      </h6>
                      <ul className="space-y-1">
                        {dealRisks().map((risk, i) => (
                          <li key={i} className="text-sm text-amber-800 flex gap-2">
                            <span>•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={exportAllAsTxt}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Download All as TXT
          </button>
        </div>
      </div>
    </div>
  );
}
