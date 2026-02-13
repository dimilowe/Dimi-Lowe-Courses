"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Copy,
  Plus,
  Trash2,
  Save,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Calculator,
  Eye,
  Clipboard,
  HardDrive,
  Shield,
} from "lucide-react";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";

type LineItem = {
  id: string;
  name: string;
  amount: number;
};

type ReportState = {
  reportName: string;
  businessName: string;
  month: number;
  year: number;
  currency: string;
  revenue: LineItem[];
  cogsEnabled: boolean;
  cogs: LineItem[];
  expenses: LineItem[];
  otherEnabled: boolean;
  otherIncome: LineItem[];
  otherExpense: LineItem[];
  addBacks: LineItem[];
};

type SavedSetup = {
  reportName: string;
  businessName: string;
  currency: string;
  revenue: LineItem[];
  cogsEnabled: boolean;
  cogs: LineItem[];
  expenses: LineItem[];
  otherEnabled: boolean;
  otherIncome: LineItem[];
  otherExpense: LineItem[];
  addBacks: LineItem[];
  includeValues: boolean;
  savedAt: string;
};

type ReportCloudPreset = ToolPresetRecord<{
  state?: Partial<ReportState>;
  includeValuesInSave?: boolean;
}>;

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_EXPENSES: LineItem[] = [
  { id: "exp-1", name: "Payroll", amount: 0 },
  { id: "exp-2", name: "Contractors", amount: 0 },
  { id: "exp-3", name: "Rent", amount: 0 },
  { id: "exp-4", name: "Software & Tools", amount: 0 },
  { id: "exp-5", name: "Marketing & Ads", amount: 0 },
  { id: "exp-6", name: "Payment Processing Fees", amount: 0 },
  { id: "exp-7", name: "Shipping & Fulfillment", amount: 0 },
  { id: "exp-8", name: "Insurance", amount: 0 },
  { id: "exp-9", name: "Utilities", amount: 0 },
  { id: "exp-10", name: "Travel", amount: 0 },
  { id: "exp-11", name: "Legal & Accounting", amount: 0 },
  { id: "exp-12", name: "Miscellaneous", amount: 0 },
];

const DEFAULT_ADDBACKS: LineItem[] = [
  { id: "add-1", name: "Owner Salary / Draws", amount: 0 },
  { id: "add-2", name: "One-Time Expenses", amount: 0 },
  { id: "add-3", name: "Personal Expenses Run Through Business", amount: 0 },
  { id: "add-4", name: "Non-Recurring Legal/Accounting", amount: 0 },
  { id: "add-5", name: "Other Add-Backs", amount: 0 },
];

const INDUSTRY_PRESETS: Record<string, { revenue: LineItem[]; expenses: LineItem[]; cogs: LineItem[] }> = {
  creator: {
    revenue: [
      { id: "rev-1", name: "Sponsorships", amount: 0 },
      { id: "rev-2", name: "Ad Revenue (YouTube/Podcast)", amount: 0 },
      { id: "rev-3", name: "Affiliate Commissions", amount: 0 },
      { id: "rev-4", name: "Digital Products", amount: 0 },
      { id: "rev-5", name: "Memberships / Patreon", amount: 0 },
      { id: "rev-6", name: "Coaching / Consulting", amount: 0 },
    ],
    expenses: [
      { id: "exp-1", name: "Video Editor / Production", amount: 0 },
      { id: "exp-2", name: "Thumbnail Designer", amount: 0 },
      { id: "exp-3", name: "Software & Subscriptions", amount: 0 },
      { id: "exp-4", name: "Equipment & Gear", amount: 0 },
      { id: "exp-5", name: "Marketing & Promotion", amount: 0 },
      { id: "exp-6", name: "Virtual Assistant", amount: 0 },
      { id: "exp-7", name: "Travel & Content Trips", amount: 0 },
      { id: "exp-8", name: "Legal & Accounting", amount: 0 },
      { id: "exp-9", name: "Miscellaneous", amount: 0 },
    ],
    cogs: [],
  },
  agency: {
    revenue: [
      { id: "rev-1", name: "Retainer Clients", amount: 0 },
      { id: "rev-2", name: "Project-Based Work", amount: 0 },
      { id: "rev-3", name: "Strategy Consulting", amount: 0 },
      { id: "rev-4", name: "Ad Spend Management Fees", amount: 0 },
    ],
    expenses: [
      { id: "exp-1", name: "Payroll (Employees)", amount: 0 },
      { id: "exp-2", name: "Contractors / Freelancers", amount: 0 },
      { id: "exp-3", name: "Office / Coworking", amount: 0 },
      { id: "exp-4", name: "Software & Tools", amount: 0 },
      { id: "exp-5", name: "Marketing & Lead Gen", amount: 0 },
      { id: "exp-6", name: "Client Entertainment", amount: 0 },
      { id: "exp-7", name: "Insurance", amount: 0 },
      { id: "exp-8", name: "Legal & Accounting", amount: 0 },
      { id: "exp-9", name: "Miscellaneous", amount: 0 },
    ],
    cogs: [],
  },
  ecommerce: {
    revenue: [
      { id: "rev-1", name: "Product Sales", amount: 0 },
      { id: "rev-2", name: "Shipping Revenue", amount: 0 },
      { id: "rev-3", name: "Returns/Refunds (negative)", amount: 0 },
    ],
    expenses: [
      { id: "exp-1", name: "Marketing & Ads", amount: 0 },
      { id: "exp-2", name: "Payment Processing", amount: 0 },
      { id: "exp-3", name: "Platform Fees (Shopify, etc.)", amount: 0 },
      { id: "exp-4", name: "Customer Service", amount: 0 },
      { id: "exp-5", name: "Software & Tools", amount: 0 },
      { id: "exp-6", name: "Insurance", amount: 0 },
      { id: "exp-7", name: "Miscellaneous", amount: 0 },
    ],
    cogs: [
      { id: "cogs-1", name: "Product Cost", amount: 0 },
      { id: "cogs-2", name: "Shipping & Fulfillment", amount: 0 },
      { id: "cogs-3", name: "Packaging", amount: 0 },
      { id: "cogs-4", name: "Warehouse / Storage", amount: 0 },
    ],
  },
  localservice: {
    revenue: [
      { id: "rev-1", name: "Service Revenue", amount: 0 },
      { id: "rev-2", name: "Recurring Contracts", amount: 0 },
      { id: "rev-3", name: "Parts / Materials Markup", amount: 0 },
    ],
    expenses: [
      { id: "exp-1", name: "Payroll / Labor", amount: 0 },
      { id: "exp-2", name: "Vehicle / Fuel", amount: 0 },
      { id: "exp-3", name: "Tools & Equipment", amount: 0 },
      { id: "exp-4", name: "Insurance", amount: 0 },
      { id: "exp-5", name: "Marketing / Local Ads", amount: 0 },
      { id: "exp-6", name: "Office / Admin", amount: 0 },
      { id: "exp-7", name: "Supplies", amount: 0 },
      { id: "exp-8", name: "Miscellaneous", amount: 0 },
    ],
    cogs: [
      { id: "cogs-1", name: "Parts / Materials", amount: 0 },
      { id: "cogs-2", name: "Subcontractor Labor", amount: 0 },
    ],
  },
};

const STORAGE_KEY = "vcm-pl-report-setup";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${currency.symbol}${formatted}` : `${currency.symbol}${formatted}`;
}

function sumLineItems(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

function computeHealthScore(state: ReportState): { score: number; grade: string; suggestions: string[] } {
  let score = 100;
  const suggestions: string[] = [];

  const totalRevenue = sumLineItems(state.revenue);
  const totalExpenses = sumLineItems(state.expenses);
  const miscExpense = state.expenses.find(e => e.name.toLowerCase().includes("misc"))?.amount || 0;
  const filledExpenseCategories = state.expenses.filter(e => e.amount > 0).length;

  if (totalRevenue === 0) {
    score -= 30;
    suggestions.push("Add at least one revenue line with a value");
  }

  if (!state.month || !state.year) {
    score -= 10;
    suggestions.push("Select the report month and year");
  }

  if (state.cogsEnabled && sumLineItems(state.cogs) === 0) {
    score -= 10;
    suggestions.push("Add COGS values since you enabled cost of goods sold");
  }

  if (totalExpenses > 0 && miscExpense / totalExpenses > 0.15) {
    score -= 15;
    suggestions.push("Break down 'Miscellaneous' into specific categories (should be <15% of expenses)");
  }

  if (filledExpenseCategories < 5) {
    score -= 10;
    suggestions.push("Add more expense detail (at least 5 categories) for a complete picture");
  }

  if (state.revenue.filter(r => r.amount > 0).length < 1) {
    score -= 10;
    suggestions.push("Specify at least one revenue source");
  }

  const totalAddBacks = sumLineItems(state.addBacks);
  if (totalAddBacks === 0) {
    suggestions.push("Consider adding owner add-backs to calculate SDE for valuation");
  }

  if (!state.businessName) {
    suggestions.push("Add your business name for professional exports");
  }

  score = Math.max(0, Math.min(100, score));

  let grade = "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return { score, grade, suggestions };
}

export default function PLReportBuilderClient() {
  const [activeTab, setActiveTab] = useState<"inputs" | "preview" | "export">("inputs");
  const [inputSection, setInputSection] = useState<"revenue" | "cogs" | "expenses" | "other" | "addbacks">("revenue");
  const [includeValuesInSave, setIncludeValuesInSave] = useState(false);
  const [hasSavedSetup, setHasSavedSetup] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [cloudPresetName, setCloudPresetName] = useState("");
  const { presets: cloudPresets, savingPreset: savingCloudPreset, savePreset } = useToolPresets<{
    state?: Partial<ReportState>;
    includeValuesInSave?: boolean;
  }>({
    toolId: "pl-report-builder",
    originCloudId: "monetization",
  });

  const currentDate = new Date();
  const [state, setState] = useState<ReportState>({
    reportName: "Monthly Profit & Loss Report",
    businessName: "",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    currency: "USD",
    revenue: [{ id: "rev-1", name: "Product/Service Revenue", amount: 0 }],
    cogsEnabled: false,
    cogs: [{ id: "cogs-1", name: "Direct Costs", amount: 0 }],
    expenses: [...DEFAULT_EXPENSES],
    otherEnabled: false,
    otherIncome: [{ id: "oi-1", name: "Other Income", amount: 0 }],
    otherExpense: [{ id: "oe-1", name: "Other Expense", amount: 0 }],
    addBacks: [...DEFAULT_ADDBACKS],
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedSetup = JSON.parse(saved);
        setHasSavedSetup(true);
        setSavedAt(parsed.savedAt);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadSavedSetup = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedSetup = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          reportName: parsed.reportName || prev.reportName,
          businessName: parsed.businessName || "",
          currency: parsed.currency || "USD",
          revenue: parsed.includeValues ? parsed.revenue : parsed.revenue.map(r => ({ ...r, amount: 0 })),
          cogsEnabled: parsed.cogsEnabled,
          cogs: parsed.includeValues ? parsed.cogs : parsed.cogs.map(c => ({ ...c, amount: 0 })),
          expenses: parsed.includeValues ? parsed.expenses : parsed.expenses.map(e => ({ ...e, amount: 0 })),
          otherEnabled: parsed.otherEnabled,
          otherIncome: parsed.includeValues ? parsed.otherIncome : parsed.otherIncome.map(o => ({ ...o, amount: 0 })),
          otherExpense: parsed.includeValues ? parsed.otherExpense : parsed.otherExpense.map(o => ({ ...o, amount: 0 })),
          addBacks: parsed.includeValues ? parsed.addBacks : parsed.addBacks.map(a => ({ ...a, amount: 0 })),
        }));
        setIncludeValuesInSave(parsed.includeValues);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSetup = useCallback(() => {
    const setup: SavedSetup = {
      reportName: state.reportName,
      businessName: state.businessName,
      currency: state.currency,
      revenue: state.revenue,
      cogsEnabled: state.cogsEnabled,
      cogs: state.cogs,
      expenses: state.expenses,
      otherEnabled: state.otherEnabled,
      otherIncome: state.otherIncome,
      otherExpense: state.otherExpense,
      addBacks: state.addBacks,
      includeValues: includeValuesInSave,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
    setHasSavedSetup(true);
    setSavedAt(setup.savedAt);
  }, [state, includeValuesInSave]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedSetup(false);
    setSavedAt(null);
  }, []);

  const applyPreset = (presetKey: string) => {
    const preset = INDUSTRY_PRESETS[presetKey];
    if (preset) {
      setState(prev => ({
        ...prev,
        revenue: preset.revenue.map(r => ({ ...r, id: generateId() })),
        expenses: preset.expenses.map(e => ({ ...e, id: generateId() })),
        cogs: preset.cogs.length > 0 ? preset.cogs.map(c => ({ ...c, id: generateId() })) : prev.cogs,
        cogsEnabled: preset.cogs.length > 0,
      }));
    }
    setShowPresetDropdown(false);
  };

  const handleSaveCloudPreset = useCallback(async () => {
    const didSave = await savePreset(cloudPresetName, {
      state,
      includeValuesInSave,
    });
    if (didSave) {
      setCloudPresetName("");
    }
  }, [cloudPresetName, state, includeValuesInSave, savePreset]);

  const applyCloudPreset = useCallback((preset: ReportCloudPreset) => {
    const presetState = preset.preset_json?.state;
    if (presetState) {
      setState((prev) => ({
        ...prev,
        ...presetState,
      }));
    }
    if (typeof preset.preset_json?.includeValuesInSave === "boolean") {
      setIncludeValuesInSave(preset.preset_json.includeValuesInSave);
    }
  }, []);

  const updateLineItem = (
    section: "revenue" | "cogs" | "expenses" | "otherIncome" | "otherExpense" | "addBacks",
    id: string,
    field: "name" | "amount",
    value: string | number
  ) => {
    setState(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id
          ? { ...item, [field]: field === "amount" ? (parseFloat(String(value)) || 0) : value }
          : item
      ),
    }));
  };

  const addLineItem = (section: "revenue" | "cogs" | "expenses" | "otherIncome" | "otherExpense" | "addBacks") => {
    const newItem: LineItem = { id: generateId(), name: "", amount: 0 };
    setState(prev => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }));
  };

  const removeLineItem = (section: "revenue" | "cogs" | "expenses" | "otherIncome" | "otherExpense" | "addBacks", id: string) => {
    setState(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id),
    }));
  };

  const totalRevenue = sumLineItems(state.revenue);
  const totalCogs = state.cogsEnabled ? sumLineItems(state.cogs) : 0;
  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalExpenses = sumLineItems(state.expenses);
  const totalOtherIncome = state.otherEnabled ? sumLineItems(state.otherIncome) : 0;
  const totalOtherExpense = state.otherEnabled ? sumLineItems(state.otherExpense) : 0;
  const netProfit = grossProfit - totalExpenses + totalOtherIncome - totalOtherExpense;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const totalAddBacks = sumLineItems(state.addBacks);
  const sde = netProfit + totalAddBacks;
  const sdeMargin = totalRevenue > 0 ? (sde / totalRevenue) * 100 : 0;

  const healthScore = computeHealthScore(state);

  const generateCsv = (): string => {
    const lines: string[] = [];
    lines.push("Section,Line Item,Amount");

    state.revenue.forEach(item => {
      if (item.name) lines.push(`Revenue,"${item.name}",${item.amount}`);
    });
    lines.push(`Revenue,Total Revenue,${totalRevenue}`);

    if (state.cogsEnabled) {
      state.cogs.forEach(item => {
        if (item.name) lines.push(`COGS,"${item.name}",${item.amount}`);
      });
      lines.push(`COGS,Total COGS,${totalCogs}`);
      lines.push(`Gross Profit,Gross Profit,${grossProfit}`);
    }

    state.expenses.forEach(item => {
      if (item.name && item.amount > 0) lines.push(`Operating Expenses,"${item.name}",${item.amount}`);
    });
    lines.push(`Operating Expenses,Total Operating Expenses,${totalExpenses}`);

    if (state.otherEnabled) {
      state.otherIncome.forEach(item => {
        if (item.name) lines.push(`Other Income,"${item.name}",${item.amount}`);
      });
      state.otherExpense.forEach(item => {
        if (item.name) lines.push(`Other Expense,"${item.name}",${item.amount}`);
      });
    }

    lines.push(`Net Profit,Net Profit,${netProfit}`);

    state.addBacks.forEach(item => {
      if (item.name && item.amount > 0) lines.push(`Add-Backs (SDE),"${item.name}",${item.amount}`);
    });
    if (totalAddBacks > 0) {
      lines.push(`Add-Backs (SDE),Total Add-Backs,${totalAddBacks}`);
    }
    lines.push(`SDE,Seller's Discretionary Earnings,${sde}`);

    return lines.join("\n");
  };

  const generateTxt = (): string => {
    const curr = CURRENCIES.find(c => c.code === state.currency) || CURRENCIES[0];
    const monthName = MONTHS[state.month - 1] || "";
    const lines: string[] = [];

    lines.push("═".repeat(60));
    lines.push(state.reportName.toUpperCase());
    lines.push("═".repeat(60));
    lines.push("");
    if (state.businessName) lines.push(`Business: ${state.businessName}`);
    lines.push(`Period: ${monthName} ${state.year}`);
    lines.push(`Currency: ${state.currency}`);
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("REVENUE");
    lines.push("─".repeat(60));
    state.revenue.forEach(item => {
      if (item.name) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(item.amount, state.currency).padStart(15)}`);
    });
    lines.push(`${"Total Revenue".padEnd(42)} ${formatCurrency(totalRevenue, state.currency).padStart(15)}`);
    lines.push("");

    if (state.cogsEnabled) {
      lines.push("─".repeat(60));
      lines.push("COST OF GOODS SOLD");
      lines.push("─".repeat(60));
      state.cogs.forEach(item => {
        if (item.name) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(item.amount, state.currency).padStart(15)}`);
      });
      lines.push(`${"Total COGS".padEnd(42)} ${formatCurrency(totalCogs, state.currency).padStart(15)}`);
      lines.push("");
      lines.push(`${"GROSS PROFIT".padEnd(42)} ${formatCurrency(grossProfit, state.currency).padStart(15)}`);
      lines.push(`${"Gross Margin".padEnd(42)} ${grossMargin.toFixed(1).padStart(14)}%`);
      lines.push("");
    }

    lines.push("─".repeat(60));
    lines.push("OPERATING EXPENSES");
    lines.push("─".repeat(60));
    state.expenses.forEach(item => {
      if (item.name && item.amount > 0) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(item.amount, state.currency).padStart(15)}`);
    });
    lines.push(`${"Total Operating Expenses".padEnd(42)} ${formatCurrency(totalExpenses, state.currency).padStart(15)}`);
    lines.push("");

    if (state.otherEnabled && (totalOtherIncome > 0 || totalOtherExpense > 0)) {
      lines.push("─".repeat(60));
      lines.push("OTHER INCOME / EXPENSE");
      lines.push("─".repeat(60));
      if (totalOtherIncome > 0) {
        state.otherIncome.forEach(item => {
          if (item.name && item.amount > 0) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(item.amount, state.currency).padStart(15)}`);
        });
      }
      if (totalOtherExpense > 0) {
        state.otherExpense.forEach(item => {
          if (item.name && item.amount > 0) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(-item.amount, state.currency).padStart(15)}`);
        });
      }
      lines.push("");
    }

    lines.push("═".repeat(60));
    lines.push(`${"NET PROFIT".padEnd(42)} ${formatCurrency(netProfit, state.currency).padStart(15)}`);
    lines.push(`${"Net Margin".padEnd(42)} ${netMargin.toFixed(1).padStart(14)}%`);
    lines.push("═".repeat(60));
    lines.push("");

    if (totalAddBacks > 0 || state.addBacks.some(a => a.amount > 0)) {
      lines.push("─".repeat(60));
      lines.push("OWNER ADD-BACKS (FOR SDE CALCULATION)");
      lines.push("─".repeat(60));
      state.addBacks.forEach(item => {
        if (item.name && item.amount > 0) lines.push(`  ${item.name.padEnd(40)} ${formatCurrency(item.amount, state.currency).padStart(15)}`);
      });
      lines.push(`${"Total Add-Backs".padEnd(42)} ${formatCurrency(totalAddBacks, state.currency).padStart(15)}`);
      lines.push("");
      lines.push("═".repeat(60));
      lines.push(`${"SELLER'S DISCRETIONARY EARNINGS (SDE)".padEnd(42)} ${formatCurrency(sde, state.currency).padStart(15)}`);
      lines.push(`${"SDE Margin".padEnd(42)} ${sdeMargin.toFixed(1).padStart(14)}%`);
      lines.push("═".repeat(60));
      lines.push("");
    }

    lines.push("─".repeat(60));
    lines.push(`P&L HEALTH SCORE: ${healthScore.score}/100 (Grade: ${healthScore.grade})`);
    lines.push("─".repeat(60));
    if (healthScore.suggestions.length > 0) {
      lines.push("Suggestions:");
      healthScore.suggestions.forEach(s => lines.push(`  • ${s}`));
    }
    lines.push("");
    lines.push("Generated by VCM Suite P&L Report Builder");
    lines.push("https://vcmsuite.com/p-and-l-report");

    return lines.join("\n");
  };

  const generateClipboardSummary = (): string => {
    const monthName = MONTHS[state.month - 1] || "";
    const lines: string[] = [];
    
    lines.push(`P&L Summary: ${state.businessName || "Business"} - ${monthName} ${state.year}`);
    lines.push("");
    lines.push(`Revenue: ${formatCurrency(totalRevenue, state.currency)}`);
    if (state.cogsEnabled) {
      lines.push(`COGS: ${formatCurrency(totalCogs, state.currency)}`);
      lines.push(`Gross Profit: ${formatCurrency(grossProfit, state.currency)} (${grossMargin.toFixed(1)}% margin)`);
    }
    lines.push(`Operating Expenses: ${formatCurrency(totalExpenses, state.currency)}`);
    lines.push(`Net Profit: ${formatCurrency(netProfit, state.currency)} (${netMargin.toFixed(1)}% margin)`);
    if (totalAddBacks > 0) {
      lines.push(`SDE: ${formatCurrency(sde, state.currency)} (${sdeMargin.toFixed(1)}% margin)`);
    }

    return lines.join("\n");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateClipboardSummary());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback
    }
  };

  const LineItemEditor = ({
    items,
    section,
    canRemove = true,
  }: {
    items: LineItem[];
    section: "revenue" | "cogs" | "expenses" | "otherIncome" | "otherExpense" | "addBacks";
    canRemove?: boolean;
  }) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-2 items-center">
          <input
            type="text"
            value={item.name}
            onChange={(e) => updateLineItem(section, item.id, "name", e.target.value)}
            placeholder="Line item name"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {CURRENCIES.find(c => c.code === state.currency)?.symbol}
            </span>
            <input
              type="number"
              value={item.amount || ""}
              onChange={(e) => updateLineItem(section, item.id, "amount", e.target.value)}
              placeholder="0.00"
              className="w-32 pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {canRemove && items.length > 1 && (
            <button
              onClick={() => removeLineItem(section, item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => addLineItem(section)}
        className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
      >
        <Plus className="w-4 h-4" /> Add Line
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Privacy Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg py-2 px-4">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Runs in your browser. No data stored on our servers.</span>
      </div>

      {/* Report Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
            <input
              type="text"
              value={state.reportName}
              onChange={(e) => setState(prev => ({ ...prev, reportName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={state.businessName}
              onChange={(e) => setState(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={state.month}
                onChange={(e) => setState(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={state.year}
                onChange={(e) => setState(prev => ({ ...prev, year: parseInt(e.target.value) || currentDate.getFullYear() }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={state.currency}
              onChange={(e) => setState(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Industry Preset */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="relative inline-block">
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Load Industry Preset
              <ChevronDown className="w-4 h-4" />
            </button>
            {showPresetDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => applyPreset("creator")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Creator / Media
                </button>
                <button
                  onClick={() => applyPreset("agency")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Agency
                </button>
                <button
                  onClick={() => applyPreset("ecommerce")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  eCommerce
                </button>
                <button
                  onClick={() => applyPreset("localservice")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Local Service
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ToolPresetBar
            presetName={cloudPresetName}
            onPresetNameChange={setCloudPresetName}
            onSave={handleSaveCloudPreset}
            saving={savingCloudPreset}
            presets={cloudPresets}
            onApply={applyCloudPreset}
          />
        </div>
      </div>

      {/* Main Tool Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("inputs")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "inputs"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calculator className="w-4 h-4" /> Inputs
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Eye className="w-4 h-4" /> Report Preview
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "export"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {activeTab === "inputs" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Input Section Tabs */}
              <div className="flex flex-wrap border-b border-gray-100">
                {[
                  { key: "revenue", label: "Revenue" },
                  { key: "cogs", label: "COGS" },
                  { key: "expenses", label: "Expenses" },
                  { key: "other", label: "Other" },
                  { key: "addbacks", label: "Add-Backs" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setInputSection(tab.key as typeof inputSection)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      inputSection === tab.key
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {inputSection === "revenue" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Revenue</h4>
                    <p className="text-sm text-gray-500 mb-4">Add all revenue sources for this period.</p>
                    <LineItemEditor items={state.revenue} section="revenue" />
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Revenue</span>
                      <span className="font-semibold text-lg text-gray-900">{formatCurrency(totalRevenue, state.currency)}</span>
                    </div>
                  </div>
                )}

                {inputSection === "cogs" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Cost of Goods Sold (COGS)</h4>
                        <p className="text-sm text-gray-500">Direct costs tied to products/services sold.</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.cogsEnabled}
                          onChange={(e) => setState(prev => ({ ...prev, cogsEnabled: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-600">Enable COGS</span>
                      </label>
                    </div>
                    {state.cogsEnabled ? (
                      <>
                        <LineItemEditor items={state.cogs} section="cogs" />
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Total COGS</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(totalCogs, state.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Gross Profit</span>
                            <span className="font-semibold text-lg text-green-600">{formatCurrency(grossProfit, state.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Gross Margin</span>
                            <span>{grossMargin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                        Enable COGS if your business sells physical products or has direct costs tied to each sale.
                      </div>
                    )}
                  </div>
                )}

                {inputSection === "expenses" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Operating Expenses</h4>
                    <p className="text-sm text-gray-500 mb-4">Regular business expenses that keep operations running.</p>
                    <LineItemEditor items={state.expenses} section="expenses" />
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Operating Expenses</span>
                      <span className="font-semibold text-lg text-gray-900">{formatCurrency(totalExpenses, state.currency)}</span>
                    </div>
                  </div>
                )}

                {inputSection === "other" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Other Income / Expense</h4>
                        <p className="text-sm text-gray-500">Non-operating income and expenses.</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.otherEnabled}
                          onChange={(e) => setState(prev => ({ ...prev, otherEnabled: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-600">Enable</span>
                      </label>
                    </div>
                    {state.otherEnabled ? (
                      <>
                        <div className="mb-6">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Other Income</h5>
                          <LineItemEditor items={state.otherIncome} section="otherIncome" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Other Expense</h5>
                          <LineItemEditor items={state.otherExpense} section="otherExpense" />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                        Enable this for interest income, investment gains/losses, or one-time non-operating items.
                      </div>
                    )}
                  </div>
                )}

                {inputSection === "addbacks" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Owner Add-Backs (SDE Calculation)</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Add back owner-specific expenses to calculate Seller&apos;s Discretionary Earnings — the key metric for business valuation.
                    </p>
                    <LineItemEditor items={state.addBacks} section="addBacks" />
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Add-Backs</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalAddBacks, state.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">SDE (Net Profit + Add-Backs)</span>
                        <span className="font-semibold text-lg text-green-600">{formatCurrency(sde, state.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>SDE Margin</span>
                        <span>{sdeMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900">{state.reportName}</h2>
                  {state.businessName && <p className="text-gray-600">{state.businessName}</p>}
                  <p className="text-sm text-gray-500">{MONTHS[state.month - 1]} {state.year}</p>
                </div>

                {/* Revenue Section */}
                <div className="mb-4">
                  <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-800">REVENUE</div>
                  {state.revenue.filter(r => r.name).map(item => (
                    <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.name}</span>
                      <span>{formatCurrency(item.amount, state.currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 font-semibold border-t border-gray-200">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(totalRevenue, state.currency)}</span>
                  </div>
                </div>

                {/* COGS Section */}
                {state.cogsEnabled && (
                  <div className="mb-4">
                    <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-800">COST OF GOODS SOLD</div>
                    {state.cogs.filter(c => c.name).map(item => (
                      <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span>{formatCurrency(item.amount, state.currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-3 py-2 font-semibold border-t border-gray-200">
                      <span>Total COGS</span>
                      <span>{formatCurrency(totalCogs, state.currency)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold text-green-700 bg-green-50 border-t border-green-200">
                      <span>GROSS PROFIT</span>
                      <span>{formatCurrency(grossProfit, state.currency)} ({grossMargin.toFixed(1)}%)</span>
                    </div>
                  </div>
                )}

                {/* Expenses Section */}
                <div className="mb-4">
                  <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-800">OPERATING EXPENSES</div>
                  {state.expenses.filter(e => e.name && e.amount > 0).map(item => (
                    <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.name}</span>
                      <span>{formatCurrency(item.amount, state.currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 font-semibold border-t border-gray-200">
                    <span>Total Operating Expenses</span>
                    <span>{formatCurrency(totalExpenses, state.currency)}</span>
                  </div>
                </div>

                {/* Other Income/Expense */}
                {state.otherEnabled && (totalOtherIncome > 0 || totalOtherExpense > 0) && (
                  <div className="mb-4">
                    <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-800">OTHER INCOME / EXPENSE</div>
                    {state.otherIncome.filter(o => o.amount > 0).map(item => (
                      <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="text-green-600">{formatCurrency(item.amount, state.currency)}</span>
                      </div>
                    ))}
                    {state.otherExpense.filter(o => o.amount > 0).map(item => (
                      <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="text-red-600">({formatCurrency(item.amount, state.currency)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Net Profit */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between font-bold text-lg text-blue-800">
                    <span>NET PROFIT</span>
                    <span>{formatCurrency(netProfit, state.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Net Margin</span>
                    <span>{netMargin.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Add-Backs & SDE */}
                {totalAddBacks > 0 && (
                  <>
                    <div className="mb-4">
                      <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-800">OWNER ADD-BACKS</div>
                      {state.addBacks.filter(a => a.amount > 0).map(item => (
                        <div key={item.id} className="flex justify-between px-3 py-1 text-sm">
                          <span className="text-gray-600 pl-4">{item.name}</span>
                          <span>{formatCurrency(item.amount, state.currency)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-3 py-2 font-semibold border-t border-gray-200">
                        <span>Total Add-Backs</span>
                        <span>{formatCurrency(totalAddBacks, state.currency)}</span>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex justify-between font-bold text-lg text-orange-800">
                        <span>SELLER&apos;S DISCRETIONARY EARNINGS (SDE)</span>
                        <span>{formatCurrency(sde, state.currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>SDE Margin</span>
                        <span>{sdeMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Export Options</h4>
                <p className="text-sm text-gray-500">Download your P&L report in different formats for sharing, record-keeping, or analysis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    const monthName = MONTHS[state.month - 1]?.toLowerCase() || "report";
                    downloadFile(generateCsv(), `pl-report-${monthName}-${state.year}.csv`, "text/csv");
                  }}
                  className="flex flex-col items-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-orange-600" />
                  <span className="font-medium text-gray-900">Download CSV</span>
                  <span className="text-xs text-gray-500 text-center">Spreadsheet-ready format</span>
                </button>

                <button
                  onClick={() => {
                    const monthName = MONTHS[state.month - 1]?.toLowerCase() || "report";
                    downloadFile(generateTxt(), `pl-report-${monthName}-${state.year}.txt`, "text/plain");
                  }}
                  className="flex flex-col items-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <Download className="w-8 h-8 text-orange-600" />
                  <span className="font-medium text-gray-900">Download TXT</span>
                  <span className="text-xs text-gray-500 text-center">CPA/buyer-ready summary</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex flex-col items-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  {copySuccess ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Clipboard className="w-8 h-8 text-orange-600" />
                  )}
                  <span className="font-medium text-gray-900">{copySuccess ? "Copied!" : "Copy Summary"}</span>
                  <span className="text-xs text-gray-500 text-center">Quick paste for emails</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">CSV Format Preview</h5>
                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto text-gray-600">
                  Section,Line Item,Amount{"\n"}
                  Revenue,&quot;Product Sales&quot;,10000{"\n"}
                  Revenue,Total Revenue,10000{"\n"}
                  Operating Expenses,&quot;Payroll&quot;,3000{"\n"}
                  ...
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Summary + Health Score + Save/Load */}
        <div className="space-y-4">
          {/* Live Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-semibold text-gray-900 mb-4">Live Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">{formatCurrency(totalRevenue, state.currency)}</span>
              </div>
              {state.cogsEnabled && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">COGS</span>
                    <span className="font-medium text-red-600">-{formatCurrency(totalCogs, state.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="text-gray-600">Gross Profit</span>
                    <span className="font-medium">{formatCurrency(grossProfit, state.currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Operating Expenses</span>
                <span className="font-medium text-red-600">-{formatCurrency(totalExpenses, state.currency)}</span>
              </div>
              {state.otherEnabled && (totalOtherIncome > 0 || totalOtherExpense > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other (Net)</span>
                  <span className="font-medium">{formatCurrency(totalOtherIncome - totalOtherExpense, state.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-3">
                <span className="text-gray-800">Net Profit</span>
                <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(netProfit, state.currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Net Margin</span>
                <span>{netMargin.toFixed(1)}%</span>
              </div>
              {totalAddBacks > 0 && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-600">+ Add-Backs</span>
                    <span className="font-medium text-green-600">+{formatCurrency(totalAddBacks, state.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-orange-600">
                    <span>SDE</span>
                    <span>{formatCurrency(sde, state.currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-semibold text-gray-900 mb-3">P&L Health Score</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl font-bold ${
                healthScore.score >= 80 ? "text-green-600" :
                healthScore.score >= 60 ? "text-yellow-600" : "text-red-600"
              }`}>
                {healthScore.score}
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  healthScore.score >= 80 ? "text-green-600" :
                  healthScore.score >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {healthScore.grade}
                </div>
                <div className="text-xs text-gray-500">out of 100</div>
              </div>
            </div>
            {healthScore.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">To Improve:</p>
                {healthScore.suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save/Load Setup */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Save Setup to Device</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Save your category structure to reuse next month. Saved only in your browser — not uploaded anywhere.
              <br /><span className="text-amber-600">Clearing browser data removes saved setups.</span>
            </p>

            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeValuesInSave}
                onChange={(e) => setIncludeValuesInSave(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Also save dollar values</span>
            </label>

            <div className="flex flex-col gap-2">
              <button
                onClick={saveSetup}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save This Setup
              </button>

              {hasSavedSetup && (
                <>
                  <button
                    onClick={loadSavedSetup}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Load Last Setup
                  </button>
                  <button
                    onClick={clearSavedData}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear saved data
                  </button>
                  {savedAt && (
                    <p className="text-xs text-gray-400 text-center">
                      Last saved: {new Date(savedAt).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
