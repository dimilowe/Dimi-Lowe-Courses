"use client";

import { useState } from "react";

interface OriginalProduct {
  title: string;
  price: number | null;
  image: string | null;
  asin: string;
  category: string;
  url: string;
}

interface DupeProduct {
  title: string;
  price: number;
  image: string;
  similarity: "Very Similar" | "Similar" | "Inspired";
  similarityScore: number;
  url: string;
  savings: number;
  savingsPercent: number;
}

interface DupeResult {
  original: OriginalProduct;
  dupes: DupeProduct[];
}

function validateAmazonUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: "Please enter an Amazon product URL" };
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!hostname.includes("amazon.")) {
      return { valid: false, error: "Please enter a valid Amazon URL (e.g., amazon.com, amazon.co.uk)" };
    }

    const asinMatch = url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i) ||
                      url.match(/[?&]asin=([A-Z0-9]{10})/i);

    if (!asinMatch) {
      return { valid: false, error: "Could not find a product ID (ASIN) in this URL. Make sure you're linking to a specific product page." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Please enter a valid URL" };
  }
}

export default function AmazonDupeFinderClient() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DupeResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const validation = validateAmazonUrl(url);
    if (!validation.valid) {
      setError(validation.error || "Invalid URL");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/dupes/amazon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find dupes");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSimilarityColor = (similarity: string) => {
    switch (similarity) {
      case "Very Similar":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      case "Similar":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Inspired":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-4">
          <label htmlFor="amazon-url" className="text-lg font-semibold text-gray-900">
            Paste an Amazon Product Link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="amazon-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/B0..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 min-w-[160px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Finding Dupes...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Cheaper Dupes
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Tip: Copy the URL from any Amazon product page and paste it above.
          </p>
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-start gap-4">
                {result.original.image ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={result.original.image}
                      alt={result.original.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-500 mb-1">Original Product</div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{result.original.title}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    {result.original.price !== null ? (
                      <span className="text-xl font-bold text-gray-900">${result.original.price.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-500">Price unavailable</span>
                    )}
                    <a
                      href={result.original.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View on Amazon →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {result.dupes.length > 0
                  ? `Found ${result.dupes.length} Cheaper Alternative${result.dupes.length > 1 ? "s" : ""}`
                  : "No Cheaper Alternatives Found"}
              </h4>

              {result.dupes.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.dupes.map((dupe, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={dupe.image}
                          alt={dupe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className={`text-xs font-semibold inline-flex px-2 py-1 rounded-full border ${getSimilarityColor(dupe.similarity)}`}>
                          {dupe.similarity}
                        </div>
                        <div className="mt-2 font-semibold text-gray-900 line-clamp-2 text-sm">
                          {dupe.title}
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <div className="text-lg font-bold text-gray-900">${dupe.price.toFixed(2)}</div>
                          <div className="text-sm text-emerald-700 font-semibold">
                            Save ${dupe.savings.toFixed(2)} ({dupe.savingsPercent}%)
                          </div>
                        </div>
                        <a
                          href={dupe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block w-full rounded-lg bg-gray-900 text-white py-2 text-sm font-semibold hover:bg-gray-800 transition-colors text-center"
                        >
                          View Dupe
                        </a>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          Verify details before buying
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">This product appears to be the best deal already!</p>
                  <p className="text-sm mt-1">Try a different product or check back later for new alternatives.</p>
                </div>
              )}
            </div>
          </div>

          {result.dupes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Shopping Tip:</strong> Always verify product specifications, materials, reviews, and seller reputation before purchasing. Prices and availability may change.
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Dupes</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Paste any Amazon product URL above and we'll find cheaper alternatives instantly. 
            Works best with fashion, accessories, home goods, and everyday items.
          </p>
        </div>
      )}
    </div>
  );
}
