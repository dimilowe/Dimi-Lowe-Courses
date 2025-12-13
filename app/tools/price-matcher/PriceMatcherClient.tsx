'use client';

import { useState } from 'react';
import { Search, ExternalLink, Loader2, AlertCircle, CheckCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface PriceResult {
  title: string;
  price: number;
  currency: string;
  url: string;
  retailer: string;
  matchType: 'exact' | 'variant';
  confidence: number;
}

interface ProductInfo {
  title: string;
  brand: string;
  price: number | null;
  currency: string;
  model: string | null;
  url: string;
}

interface SearchResults {
  product: ProductInfo;
  results: PriceResult[];
  bestDeal: PriceResult | null;
  verdict: 'overpaying' | 'fair' | 'best-price' | 'unknown';
  savings: number | null;
}

export default function PriceMatcherClient() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!url.trim()) {
      setError('Please enter a product URL');
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/tools/price-matcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search for prices');
      }

      setResults(data);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case 'overpaying':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          label: 'You may be overpaying',
          color: 'text-red-600 bg-red-50 border-red-200',
        };
      case 'fair':
        return {
          icon: <Minus className="w-5 h-5" />,
          label: 'Price looks fair',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        };
      case 'best-price':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          label: 'This is a great price!',
          color: 'text-green-600 bg-green-50 border-green-200',
        };
      default:
        return {
          icon: <Minus className="w-5 h-5" />,
          label: 'Unable to determine',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  };

  const getMatchTypeBadge = (matchType: string) => {
    if (matchType === 'exact') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Exact Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        Variant Match
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
            Product URL <span className="text-red-500">*</span>
          </label>
          <input
            id="productUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/B09V3KXJPB or any product page..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Supported: Amazon, Walmart, Target, Best Buy, Costco, Lowes, Home Depot, eBay, Newegg, and more
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={isLoading || !url.trim()}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
            isLoading || !url.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching for better prices...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Find Best Price
            </>
          )}
        </button>

        {remaining !== null && (
          <p className="text-center text-xs text-gray-500">
            {remaining} searches remaining today
          </p>
        )}
      </div>

      {results && (
        <div className="mt-8 space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Product</h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="font-medium text-gray-900 mb-1">{results.product.title}</p>
              {results.product.brand && (
                <p className="text-sm text-gray-600">Brand: {results.product.brand}</p>
              )}
              {results.product.model && (
                <p className="text-sm text-gray-600">Model: {results.product.model}</p>
              )}
              {results.product.price && (
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {formatPrice(results.product.price, results.product.currency)}
                </p>
              )}
            </div>
          </div>

          {results.verdict !== 'unknown' && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${getVerdictInfo(results.verdict).color}`}>
              {getVerdictInfo(results.verdict).icon}
              <div>
                <p className="font-semibold">{getVerdictInfo(results.verdict).label}</p>
                {results.savings !== null && results.savings > 0 && (
                  <p className="text-sm">
                    Potential savings: {formatPrice(results.savings, results.product.currency)}
                  </p>
                )}
              </div>
            </div>
          )}

          {results.bestDeal && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Best Price Found
              </h3>
              <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{results.bestDeal.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{results.bestDeal.retailer}</p>
                    <div className="mt-2">
                      {getMatchTypeBadge(results.bestDeal.matchType)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPrice(results.bestDeal.price, results.bestDeal.currency)}
                    </p>
                    <a
                      href={results.bestDeal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      View Deal
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {results.results.length > 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Other Options</h3>
              <div className="space-y-3">
                {results.results.slice(1, 5).map((result, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{result.retailer}</p>
                        <div className="mt-2">
                          {getMatchTypeBadge(result.matchType)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(result.price, result.currency)}
                        </p>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-all"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.results.length === 0 && !results.bestDeal && (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-600">
                No alternative prices found for this product. This could mean it&apos;s already at a competitive price or it&apos;s a unique/exclusive item.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
