"use client";

import { useState, useEffect, useCallback } from "react";

interface BrokenTarget {
  target_url: string;
  status_code: number | null;
  error_type: string | null;
  is_soft_404: boolean;
  times_found: number;
  sources: { source_url: string; anchor_text: string | null }[];
}

interface SourcePage {
  source_url: string;
  broken_count: number;
  broken_links: {
    target_url: string;
    status_code: number | null;
    error_type: string | null;
    is_soft_404: boolean;
    anchor_text: string | null;
  }[];
}

interface ScanState {
  scanId: string | null;
  status: "idle" | "running" | "done" | "failed";
  pagesCrawled: number;
  linksChecked: number;
  error: string | null;
}

interface Results {
  brokenTargets: BrokenTarget[];
  sourcePages: SourcePage[];
}

export default function Site404ScannerClient() {
  const [url, setUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPages, setMaxPages] = useState(500);
  const [maxDepth, setMaxDepth] = useState(6);
  const [concurrency, setConcurrency] = useState(8);
  const [includeExternal, setIncludeExternal] = useState(false);
  const [stripQueryParams, setStripQueryParams] = useState(true);

  const [scanState, setScanState] = useState<ScanState>({
    scanId: null,
    status: "idle",
    pagesCrawled: 0,
    linksChecked: 0,
    error: null,
  });

  const [results, setResults] = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "sources">("issues");
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const startScan = async () => {
    if (!url.trim()) return;

    setScanState({
      scanId: null,
      status: "running",
      pagesCrawled: 0,
      linksChecked: 0,
      error: null,
    });
    setResults(null);

    try {
      const res = await fetch("/api/tools/site-404-scanner/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_url: url.trim(),
          max_pages: maxPages,
          max_depth: maxDepth,
          concurrency,
          include_external: includeExternal,
          strip_query_params: stripQueryParams,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScanState(prev => ({ ...prev, status: "failed", error: data.error || "Failed to start scan" }));
        return;
      }

      setScanState(prev => ({ ...prev, scanId: data.scan_id }));
    } catch (err) {
      setScanState(prev => ({ 
        ...prev, 
        status: "failed", 
        error: err instanceof Error ? err.message : "Failed to start scan" 
      }));
    }
  };

  const runTick = useCallback(async (scanId: string) => {
    try {
      const res = await fetch("/api/tools/site-404-scanner/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: scanId }),
      });

      const data = await res.json();

      setScanState(prev => ({
        ...prev,
        pagesCrawled: data.pages_crawled || prev.pagesCrawled,
        linksChecked: data.links_checked || prev.linksChecked,
        status: data.done ? (data.status === "failed" ? "failed" : "done") : "running",
        error: data.error || null,
      }));

      return data.done;
    } catch (err) {
      setScanState(prev => ({
        ...prev,
        status: "failed",
        error: err instanceof Error ? err.message : "Tick failed",
      }));
      return true;
    }
  }, []);

  useEffect(() => {
    if (!scanState.scanId || scanState.status !== "running") return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const done = await runTick(scanState.scanId!);
      if (!done && !cancelled) {
        setTimeout(tick, 1500);
      }
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [scanState.scanId, scanState.status, runTick]);

  useEffect(() => {
    if (scanState.status === "done" && scanState.scanId) {
      fetch(`/api/tools/site-404-scanner/results?scanId=${scanState.scanId}`)
        .then(res => res.json())
        .then(data => {
          setResults({
            brokenTargets: data.brokenTargets || [],
            sourcePages: data.sourcePages || [],
          });
        })
        .catch(console.error);
    }
  }, [scanState.status, scanState.scanId]);

  const toggleTarget = (url: string) => {
    setExpandedTargets(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSource = (url: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const getStatusBadge = (statusCode: number | null, errorType: string | null, isSoft404: boolean) => {
    if (isSoft404) return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Soft 404</span>;
    if (errorType) return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">{errorType}</span>;
    if (statusCode === 404) return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">404</span>;
    if (statusCode === 410) return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">410 Gone</span>;
    if (statusCode && statusCode >= 500) return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">{statusCode}</span>;
    return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">{statusCode || "?"}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Site 404 & Broken Link Scanner</h1>
      <p className="text-gray-400 mb-8">
        Scan a site for 404s, soft 404s, redirect problems, and broken links—then pinpoint the exact pages causing each issue.
      </p>

      <div className="bg-zinc-900 rounded-lg p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={scanState.status === "running"}
          />
          <button
            onClick={startScan}
            disabled={!url.trim() || scanState.status === "running"}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            {scanState.status === "running" ? "Scanning..." : "Start Scan"}
          </button>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
        >
          <span className={`transform transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
          Advanced Settings
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Pages</label>
              <input
                type="number"
                value={maxPages}
                onChange={e => setMaxPages(parseInt(e.target.value) || 500)}
                min={1}
                max={1000}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Depth</label>
              <input
                type="number"
                value={maxDepth}
                onChange={e => setMaxDepth(parseInt(e.target.value) || 6)}
                min={1}
                max={10}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Concurrency</label>
              <input
                type="number"
                value={concurrency}
                onChange={e => setConcurrency(parseInt(e.target.value) || 8)}
                min={1}
                max={16}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeExternal"
                checked={includeExternal}
                onChange={e => setIncludeExternal(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeExternal" className="text-gray-400 text-sm">Check external links</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="stripQueryParams"
                checked={stripQueryParams}
                onChange={e => setStripQueryParams(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="stripQueryParams" className="text-gray-400 text-sm">Strip query params</label>
            </div>
          </div>
        )}
      </div>

      {scanState.status === "running" && (
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-medium">Scanning...</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Pages crawled:</span>{" "}
              <span className="text-white">{scanState.pagesCrawled}</span>
            </div>
            <div>
              <span className="text-gray-400">Links checked:</span>{" "}
              <span className="text-white">{scanState.linksChecked}</span>
            </div>
          </div>
        </div>
      )}

      {scanState.status === "failed" && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{scanState.error || "Scan failed"}</p>
        </div>
      )}

      {scanState.status === "done" && results && (
        <div className="bg-zinc-900 rounded-lg overflow-hidden">
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-6 py-3 font-medium ${
                activeTab === "issues"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Issues ({results.brokenTargets.length})
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-6 py-3 font-medium ${
                activeTab === "sources"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sources ({results.sourcePages.length})
            </button>
            <div className="ml-auto px-4 py-3">
              <a
                href={`/api/tools/site-404-scanner/export?scanId=${scanState.scanId}`}
                className="text-sm text-orange-500 hover:text-orange-400"
              >
                Export CSV
              </a>
            </div>
          </div>

          <div className="p-4">
            {activeTab === "issues" && (
              <div>
                {results.brokenTargets.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No broken links found!</p>
                ) : (
                  <div className="space-y-2">
                    {results.brokenTargets.map((target, idx) => (
                      <div key={idx} className="bg-zinc-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTarget(target.target_url)}
                          className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-zinc-750"
                        >
                          <span className={`transform transition-transform ${expandedTargets.has(target.target_url) ? "rotate-90" : ""}`}>
                            ▶
                          </span>
                          {getStatusBadge(target.status_code, target.error_type, target.is_soft_404)}
                          <span className="text-white truncate flex-1">{target.target_url}</span>
                          <span className="text-gray-400 text-sm whitespace-nowrap">
                            Found on {target.times_found} page{target.times_found !== 1 ? "s" : ""}
                          </span>
                        </button>
                        {expandedTargets.has(target.target_url) && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-700">
                            <p className="text-gray-400 text-sm mb-2">Linked from:</p>
                            <ul className="space-y-1">
                              {target.sources.map((src, sidx) => (
                                <li key={sidx} className="text-sm">
                                  <a
                                    href={src.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline truncate block"
                                  >
                                    {src.source_url}
                                  </a>
                                  {src.anchor_text && (
                                    <span className="text-gray-500 text-xs ml-2">
                                      &quot;{src.anchor_text}&quot;
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sources" && (
              <div>
                {results.sourcePages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No pages with broken links found!</p>
                ) : (
                  <div className="space-y-2">
                    {results.sourcePages.map((page, idx) => (
                      <div key={idx} className="bg-zinc-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSource(page.source_url)}
                          className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-zinc-750"
                        >
                          <span className={`transform transition-transform ${expandedSources.has(page.source_url) ? "rotate-90" : ""}`}>
                            ▶
                          </span>
                          <span className="text-white truncate flex-1">{page.source_url}</span>
                          <span className="text-red-400 text-sm whitespace-nowrap">
                            {page.broken_count} broken link{page.broken_count !== 1 ? "s" : ""}
                          </span>
                        </button>
                        {expandedSources.has(page.source_url) && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-700">
                            <ul className="space-y-2">
                              {page.broken_links.map((link, lidx) => (
                                <li key={lidx} className="flex items-center gap-2 text-sm">
                                  {getStatusBadge(link.status_code, link.error_type, link.is_soft_404)}
                                  <span className="text-gray-300 truncate">{link.target_url}</span>
                                  {link.anchor_text && (
                                    <span className="text-gray-500 text-xs">
                                      &quot;{link.anchor_text}&quot;
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-12 bg-zinc-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-400">
          <li>Enter your site URL and configure scan options</li>
          <li>The crawler fetches HTML pages and extracts all links</li>
          <li>Internal links are crawled up to your depth/page limits</li>
          <li>Each link is checked for 404s, server errors, timeouts, and soft 404s</li>
          <li>Results show which pages contain broken links so you can fix them</li>
        </ol>
      </div>
    </div>
  );
}
