"use client";

import { useState, useRef } from "react";
import { 
  Search, 
  ExternalLink, 
  Loader2, 
  ShoppingBag, 
  Tag, 
  AlertCircle,
  Sparkles,
  Copy,
  Check
} from "lucide-react";

interface SearchLink {
  keywords: string;
  focus: string;
  url: string;
}

interface AnalyzeResponse {
  product: {
    label: string;
    description: string;
    category: string;
  };
  searchLinks: SearchLink[];
  shoppingTips: string[];
}

export default function AliExpressDupeFinderClient() {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeProduct = async () => {
    if (!input.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/tools/aliexpress-dupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze product");
      }

      const data: AnalyzeResponse = await response.json();
      setResults(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnalyzing) {
      analyzeProduct();
    }
  };

  const handleCopy = async (url: string, index: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearResults = () => {
    setInput("");
    setResults(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-orange-500" />
          Find AliExpress Dupes
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste a product link or describe what you're looking for
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., https://oldnavy.gap.com/... or 'mid rise baggy jeans women blue'"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                disabled={isAnalyzing}
              />
              <button
                onClick={analyzeProduct}
                disabled={!input.trim() || isAnalyzing}
                className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Find Dupes</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Works with any product URL (Amazon, Shein, Old Navy, Zara) or just describe what you want.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Analyzing your product...</p>
          <p className="text-gray-500 text-sm mt-1">Generating AliExpress search links</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">{results.product.label}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">{results.product.description}</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                <Tag className="w-3 h-3" />
                {results.product.category}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Click any link to search AliExpress:
              </h4>
              
              <div className="grid gap-3">
                {results.searchLinks.map((link, index) => (
                  <div
                    key={index}
                    className="group bg-gray-50 rounded-xl p-4 hover:bg-orange-50 transition-all border border-gray-200 hover:border-orange-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-1">"{link.keywords}"</p>
                        <p className="text-sm text-gray-500">{link.focus}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleCopy(link.url, index)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                          title="Copy link"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-all"
                        >
                          <span>Search</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {results.shoppingTips && results.shoppingTips.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <div className="text-sm font-medium text-amber-800 mb-2">Pro tips for finding the best dupe:</div>
              <ul className="text-sm text-amber-700 space-y-1">
                {results.shoppingTips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={clearResults}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Search for another product
            </button>
          </div>
        </div>
      )}

      {!results && !isAnalyzing && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            Find cheaper alternatives in seconds
          </p>
          <p className="text-gray-500 text-sm">
            Our AI analyzes your product and generates smart AliExpress search links
          </p>
        </div>
      )}
    </div>
  );
}
