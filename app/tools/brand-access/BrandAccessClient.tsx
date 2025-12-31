"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Lock, ExternalLink, Copy, Check, Send, Loader2, Globe, Sparkles, AlertCircle } from "lucide-react";

interface BrandEntry {
  id: string;
  brand_name: string;
  website_url: string | null;
  contact_url?: string;
  contact_type: string;
  tags: string[];
  notes: string | null;
  country: string | null;
  city: string | null;
  last_verified: string | null;
  locked?: boolean;
}

interface ListResponse {
  entries: BrandEntry[];
  totalCount: number;
  isPro: boolean;
  previewMode: boolean;
}

const CONTACT_TYPES = [
  { value: "", label: "All Types" },
  { value: "brand", label: "Brand" },
  { value: "agency", label: "Agency" },
  { value: "casting", label: "Casting" },
  { value: "partnerships", label: "Partnerships" },
  { value: "press", label: "Press" },
  { value: "support", label: "Support" },
  { value: "affiliate", label: "Affiliate" },
  { value: "influencer", label: "Influencer" },
];

export default function BrandAccessClient() {
  const [entries, setEntries] = useState<BrandEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [requestForm, setRequestForm] = useState({
    brand_name: "",
    website_url: "",
    reason: "",
    email: "",
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [finderForm, setFinderForm] = useState({
    brand_name: "",
    website_url: "",
    email: "",
  });
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResult, setFinderResult] = useState<{
    website_url: string;
    contact_url: string | null;
    confidence: string;
    method: string;
  } | null>(null);
  const [finderError, setFinderError] = useState<string | null>(null);
  const [finderSubmitting, setFinderSubmitting] = useState(false);
  const [finderSubmitted, setFinderSubmitted] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedType) params.set("type", selectedType);

      const res = await fetch(`/api/tools/brand-access/list?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data: ListResponse = await res.json();
      setEntries(data.entries);
      setTotalCount(data.totalCount);
      setIsPro(data.isPro);
      setPreviewMode(data.previewMode);
    } catch {
      setError("Failed to load entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.brand_name.trim()) return;

    setRequestLoading(true);
    setRequestError(null);
    setRequestSuccess(false);

    try {
      const res = await fetch("/api/tools/brand-access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_brand_name: requestForm.brand_name,
          requested_website_url: requestForm.website_url || undefined,
          request_reason: requestForm.reason || undefined,
          user_email: requestForm.email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setRequestSuccess(true);
      setRequestForm({ brand_name: "", website_url: "", reason: "", email: "" });
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setRequestLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const handleFinderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finderForm.website_url.trim() && !finderForm.email.trim()) return;

    setFinderLoading(true);
    setFinderError(null);
    setFinderResult(null);
    setFinderSubmitted(false);

    try {
      const res = await fetch("/api/tools/brand-access/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: finderForm.brand_name || undefined,
          website_url: finderForm.website_url || undefined,
          email: finderForm.email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve contact page");
      }

      const data = await res.json();
      setFinderResult(data);
    } catch (err) {
      setFinderError(err instanceof Error ? err.message : "Failed to resolve contact page");
    } finally {
      setFinderLoading(false);
    }
  };

  const handleSubmitToDirectory = async () => {
    if (!finderResult || finderSubmitting) return;

    setFinderSubmitting(true);

    try {
      const res = await fetch("/api/tools/brand-access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_brand_name: finderForm.brand_name || new URL(finderResult.website_url).hostname,
          requested_website_url: finderResult.website_url,
          resolved_website_url: finderResult.website_url,
          resolved_contact_url: finderResult.contact_url,
          resolve_confidence: finderResult.confidence,
          resolver_method: finderResult.method,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setFinderSubmitted(true);
    } catch (err) {
      setFinderError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setFinderSubmitting(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">High</span>;
      case "medium":
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Medium</span>;
      default:
        return <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-medium">Low</span>;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "homepage_links":
        return "Found on homepage";
      case "common_paths":
        return "Common contact path";
      default:
        return "Not found";
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Contact Page Finder</h3>
            <p className="text-sm text-zinc-400">Find contact pages for any brand</p>
          </div>
        </div>

        <form onSubmit={handleFinderSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Brand Name (optional)</label>
              <input
                type="text"
                value={finderForm.brand_name}
                onChange={(e) => setFinderForm({ ...finderForm, brand_name: e.target.value })}
                placeholder="e.g. Nike"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Website URL *</label>
              <input
                type="text"
                value={finderForm.website_url}
                onChange={(e) => setFinderForm({ ...finderForm, website_url: e.target.value })}
                placeholder="https://nike.com"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={500}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Or use email:</span>
            <input
              type="email"
              value={finderForm.email}
              onChange={(e) => setFinderForm({ ...finderForm, email: e.target.value })}
              placeholder="contact@company.com"
              className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={255}
            />
          </div>

          <button
            type="submit"
            disabled={finderLoading || (!finderForm.website_url.trim() && !finderForm.email.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finderLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find Contact Page
              </>
            )}
          </button>
        </form>

        {finderError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {finderError}
          </div>
        )}

        {finderResult && (
          <div className="mt-4 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Result</span>
              <div className="flex items-center gap-2">
                {getConfidenceBadge(finderResult.confidence)}
                <span className="text-xs text-zinc-500">{getMethodLabel(finderResult.method)}</span>
              </div>
            </div>

            {finderResult.contact_url ? (
              <div className="space-y-3">
                <a
                  href={finderResult.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-orange-400 hover:text-orange-300 break-all text-sm underline"
                >
                  {finderResult.contact_url}
                </a>
                
                {finderSubmitted ? (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Submitted for review. Thanks!
                  </p>
                ) : (
                  <button
                    onClick={handleSubmitToDirectory}
                    disabled={finderSubmitting}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
                  >
                    {finderSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit to Brand Access
                      </>
                    )}
                  </button>
                )}
                <p className="text-xs text-zinc-500">
                  Submissions are reviewed before being added to the directory.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Could not find a contact page. The site may block automated access.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          {CONTACT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {previewMode && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 mb-1">
                Unlock Full Access with Intelligence Pro
              </h3>
              <p className="text-sm text-zinc-600 mb-3">
                You&apos;re viewing a preview. Upgrade to reveal all {totalCount} contact paths.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Unlock Pro
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchEntries}
            className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No brands found matching your search.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Brand</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Website</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Contact Path</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Notes</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-700">Verified</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-3 px-4 font-medium text-zinc-900">{entry.brand_name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs capitalize">
                      {entry.contact_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {entry.website_url ? (
                      <a
                        href={entry.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {entry.locked ? (
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <Lock className="w-4 h-4" />
                        <span className="blur-sm select-none">https://...</span>
                      </span>
                    ) : entry.contact_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={entry.contact_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-orange-600 hover:underline"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleCopy(entry.contact_url!, entry.id)}
                          className="p-1 hover:bg-zinc-100 rounded transition-colors"
                          title="Copy link"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-zinc-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 max-w-[200px] truncate">
                    {entry.notes || "—"}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {formatDate(entry.last_verified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <p className="text-sm text-zinc-500 text-center">
          Showing {entries.length} of {totalCount} entries
          {previewMode && " (preview mode)"}
        </p>
      )}

      <div className="border-t border-zinc-200 pt-8">
        <div className="max-w-xl mx-auto bg-zinc-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Request a Brand</h3>
          <p className="text-sm text-zinc-600 mb-4">
            Can&apos;t find a brand? Request it and we&apos;ll add the contact path.
          </p>

          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={requestForm.brand_name}
                onChange={(e) => setRequestForm({ ...requestForm, brand_name: e.target.value })}
                placeholder="e.g. Nike, Sephora, Red Bull"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Website URL (optional)
              </label>
              <input
                type="url"
                value={requestForm.website_url}
                onChange={(e) => setRequestForm({ ...requestForm, website_url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Why do you need this? (optional)
              </label>
              <textarea
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                placeholder="e.g. Looking for their influencer partnerships page"
                rows={2}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                maxLength={1000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Your Email (optional, for updates)
              </label>
              <input
                type="email"
                value={requestForm.email}
                onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={255}
              />
            </div>

            {requestError && (
              <p className="text-sm text-red-600">{requestError}</p>
            )}
            {requestSuccess && (
              <p className="text-sm text-green-600">
                Request submitted! We&apos;ll review it soon.
              </p>
            )}

            <button
              type="submit"
              disabled={requestLoading || !requestForm.brand_name.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center">
        We link to public contact pages. No private emails. No scraping.
      </p>
    </div>
  );
}
