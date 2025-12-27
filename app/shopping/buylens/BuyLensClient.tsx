"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  ShieldAlert,
  History,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface BuyLensResult {
  rank: number;
  title?: string;
  url: string;
  domain: string;
  price_usd?: number;
  shipping_usd?: number;
  total_usd?: number;
  condition?: string;
  seller?: string;
  confidence: number;
  why?: string;
  tradeoff?: string;
}

interface BuyLensSource {
  domain: string;
  url: string;
  status: string;
  error_message?: string;
  visited_at: string;
}

interface BuyLensRunResponse {
  runId: string;
  status: "success" | "partial" | "failed";
  intent: any;
  results: BuyLensResult[];
  sources: BuyLensSource[];
  duration_ms: number;
  summary?: string;
  sort_explanation?: string;
}

interface PastRun {
  id: string;
  query_text: string;
  status: string;
  created_at: string;
  duration_ms: number;
  result_count: string;
}

interface BuyLensClientProps {
  isEntitled: boolean;
}

export default function BuyLensClient({ isEntitled }: BuyLensClientProps) {
  const [queryText, setQueryText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxBudget, setMaxBudget] = useState("");
  const [market, setMarket] = useState<"both" | "retail" | "resale">("both");
  const [condition, setCondition] = useState<"any" | "new" | "used">("any");
  const [includeShipping, setIncludeShipping] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuyLensRunResponse | null>(null);
  
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  const [loadingPastRuns, setLoadingPastRuns] = useState(false);

  useEffect(() => {
    if (isEntitled) {
      fetchPastRuns();
    }
  }, [isEntitled]);

  const fetchPastRuns = async () => {
    setLoadingPastRuns(true);
    try {
      const res = await fetch("/api/shopping/buylens/runs");
      const data = await res.json();
      if (data.runs) {
        setPastRuns(data.runs);
      }
    } catch (e) {
      console.error("Failed to fetch past runs:", e);
    } finally {
      setLoadingPastRuns(false);
    }
  };

  const handleRun = async () => {
    if (!queryText.trim()) {
      setError("Please enter what you're looking to buy.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    const steps = [
      "Parsing your request...",
      "Scanning sources...",
      "Extracting prices...",
      "Ranking options...",
    ];
    
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setLoadingStep(steps[stepIndex]);
    }, 3000);

    try {
      const res = await fetch("/api/shopping/buylens/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryText: queryText.trim(),
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
          market,
          condition,
          includeShippingTotal: includeShipping,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setError("Please sign in to use BuyLens.");
        } else if (data.error === "UPGRADE_REQUIRED") {
          setError("BuyLens requires a Shopping Cloud Pro subscription.");
        } else if (data.error === "RATE_LIMIT") {
          setError(data.message || "Daily limit reached. Try again tomorrow.");
        } else {
          setError(data.message || "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data);
      fetchPastRuns();

    } catch (e: any) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  if (!isEntitled) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Shopping Cloud Pro Required</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          BuyLens is a premium tool that requires a Shopping Cloud Pro subscription. 
          Upgrade to scan the web and find the best deals.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          View Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you thinking about buying?
            </label>
            <div className="relative">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g., Sony WH-1000XM5 headphones"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                maxLength={300}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleRun()}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{queryText.length}/300 characters</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="both">Retail & Resale</option>
                  <option value="retail">Retail Only</option>
                  <option value="resale">Resale Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="any">Any</option>
                  <option value="new">New Only</option>
                  <option value="used">Used Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeShipping"
                  checked={includeShipping}
                  onChange={(e) => setIncludeShipping(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="includeShipping" className="text-sm text-gray-700">
                  Include shipping in total price
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={isLoading || !queryText.trim()}
            className="w-full py-3 px-6 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {loadingStep}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Run BuyLens
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Results</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {(result.duration_ms / 1000).toFixed(1)}s
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  result.status === "success" ? "bg-green-100 text-green-700" :
                  result.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {result.status}
                </span>
              </div>
            </div>

            {result.summary && (
              <p className="text-gray-600 mb-4">{result.summary}</p>
            )}

            {result.sort_explanation && (
              <p className="text-sm text-gray-500 mb-4 italic">{result.sort_explanation}</p>
            )}

            {result.results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No results found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.results.map((item) => (
                  <div key={`${item.rank}-${item.url}`} className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {item.rank}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.domain}</span>
                          {item.condition && item.condition !== "unknown" && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.condition === "new" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {item.condition}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          {item.title || "Untitled listing"}
                        </h4>
                        {item.why && (
                          <p className="text-sm text-gray-600 mt-1">{item.why}</p>
                        )}
                        {item.tradeoff && (
                          <p className="text-xs text-gray-500 mt-1 italic">{item.tradeoff}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.total_usd !== undefined || item.price_usd !== undefined ? (
                          <>
                            <div className="text-xl font-bold text-gray-900">
                              ${(item.total_usd ?? item.price_usd)?.toFixed(2)}
                            </div>
                            {item.shipping_usd !== undefined && (
                              <div className="text-xs text-gray-500">
                                +${item.shipping_usd.toFixed(2)} shipping
                              </div>
                            )}
                            {item.shipping_usd === undefined && item.price_usd !== undefined && (
                              <div className="text-xs text-gray-400">shipping unknown</div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">Price not visible</div>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 mt-2"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sources Scanned</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Domain</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sources.map((source, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-gray-900">{source.domain}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          source.status === "ok" ? "bg-green-100 text-green-700" :
                          source.status === "robots_blocked" ? "bg-gray-100 text-gray-600" :
                          source.status === "captcha" ? "bg-yellow-100 text-yellow-700" :
                          source.status === "timeout" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {source.status === "ok" && <CheckCircle className="w-3 h-3" />}
                          {source.status !== "ok" && <XCircle className="w-3 h-3" />}
                          {source.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-500 text-xs">
                        {source.error_message || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Past Runs
          </h3>
          <button
            onClick={fetchPastRuns}
            disabled={loadingPastRuns}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPastRuns ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        
        {pastRuns.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No past runs yet. Run your first search above!</p>
        ) : (
          <div className="space-y-2">
            {pastRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">{run.query_text}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(run.created_at).toLocaleDateString()} - {run.result_count} results
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  run.status === "success" ? "bg-green-100 text-green-700" :
                  run.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-400 mt-8">
        Public web only. We don't store scraped pages. BuyLens respects robots.txt.
      </div>
    </div>
  );
}
