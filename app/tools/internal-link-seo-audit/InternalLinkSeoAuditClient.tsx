'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Link2, AlertTriangle, TrendingUp, Loader2, ExternalLink, CheckCircle, XCircle, Target } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface PageData {
  url: string;
  title: string | null;
  outboundInternalLinks: number;
  inboundInternalLinks: number;
}

interface AuditResult {
  pagesScanned: number;
  pagesSkipped: number;
  orphanPages: PageData[];
  weakPages: PageData[];
  topLinkedPages: PageData[];
  averageLinksPerPage: number;
}

export default function InternalLinkSeoAuditClient() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/internal-link-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to audit site');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const truncateUrl = (url: string, maxLength = 60) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium mb-6">
            <Link2 className="w-4 h-4" />
            Free SEO Audit Tool
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Internal Link in SEO: Free Audit Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analyze your website&apos;s <strong>internal link in SEO</strong> structure. Find orphan pages, 
            weak links, and get actionable recommendations to boost your search rankings.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Enter Your Site</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain or Sitemap URL <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com or https://example.com/sitemap.xml"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll automatically detect your sitemap, or you can paste a direct sitemap URL
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-track-output="true"
                disabled={loading || !url.trim()}
                className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning Your Internal Links...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Run Internal Link Audit
                  </>
                )}
              </button>
            </form>

            {loading && (
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700">
                  <strong>Scanning in progress...</strong> We&apos;re crawling up to 150 pages from your sitemap. 
                  This can take 1-2 minutes depending on your site size.
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col justify-center">
            {!result ? (
              <div className="text-center text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Enter your domain to get started</p>
                <p className="text-sm">
                  We&apos;ll analyze your <strong>internal link in SEO</strong> structure and show you exactly 
                  where to add links for maximum impact.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Audit Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{result.pagesScanned}</div>
                    <div className="text-sm text-gray-600">Pages Scanned</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-orange-600">{result.orphanPages.length}</div>
                    <div className="text-sm text-gray-600">Orphan Pages</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{result.weakPages.length}</div>
                    <div className="text-sm text-gray-600">Weak Pages</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{result.averageLinksPerPage}</div>
                    <div className="text-sm text-gray-600">Avg Links/Page</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                  <strong>Insight:</strong> Improving your <strong>internal link in SEO</strong> strategy starts 
                  with fixing orphan pages and boosting links to under-connected content.
                </p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-8 mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Orphan Pages ({result.orphanPages.length})
                    </h3>
                    <p className="text-sm text-gray-600">
                      These pages have 0 internal links pointing to them. Search engines may have trouble finding them.
                    </p>
                  </div>
                </div>
              </div>
              
              {result.orphanPages.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">Good news — no orphan pages were detected!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Inbound</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Outbound</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.orphanPages.slice(0, 20).map((page, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4">
                            <a 
                              href={page.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                            >
                              {truncateUrl(page.url)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {page.title || '(No title)'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {page.inboundInternalLinks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {page.outboundInternalLinks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.orphanPages.length > 20 && (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                      Showing 20 of {result.orphanPages.length} orphan pages
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Weak Pages ({result.weakPages.length})
                    </h3>
                    <p className="text-sm text-gray-600">
                      These pages only have 1-2 internal links. Adding more internal links to them is an easy SEO win.
                    </p>
                  </div>
                </div>
              </div>
              
              {result.weakPages.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">No weakly-linked pages found!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Inbound</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Outbound</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.weakPages.slice(0, 20).map((page, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4">
                            <a 
                              href={page.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                            >
                              {truncateUrl(page.url)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {page.title || '(No title)'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              {page.inboundInternalLinks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {page.outboundInternalLinks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.weakPages.length > 20 && (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                      Showing 20 of {result.weakPages.length} weak pages
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-green-50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Top Linked Pages (Top 10)
                    </h3>
                    <p className="text-sm text-gray-600">
                      These are your most connected pages. Use them as hubs to link to orphan and weak pages.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Inbound</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Outbound</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.topLinkedPages.map((page, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4">
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                          >
                            {truncateUrl(page.url)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {page.title || '(No title)'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {page.inboundInternalLinks}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {page.outboundInternalLinks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Actionable Suggestions
              </h3>
              <ul className="space-y-3 text-gray-700">
                {result.orphanPages.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">1.</span>
                    <span>
                      Start by adding internal links from your top {Math.min(5, result.topLinkedPages.length)} most linked pages 
                      to your {Math.min(5, result.orphanPages.length)} orphan pages.
                    </span>
                  </li>
                )}
                {result.weakPages.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">2.</span>
                    <span>
                      Add at least 2-3 more internal links to each of your {result.weakPages.length} weak pages 
                      from relevant content on your site.
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">3.</span>
                  <span>
                    Consider turning your best-linked pages into pillar content and clustering related articles around them.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">4.</span>
                  <span>
                    Review pages with high outbound but low inbound links — they may be giving away link equity without receiving any.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">5.</span>
                  <span>
                    A strong <strong>internal link in SEO</strong> strategy means every important page should have at least 3-5 internal links pointing to it.
                  </span>
                </li>
              </ul>
            </div>
            
            <PostResultUpsell />
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What is an Internal Link in SEO?
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              An <strong>internal link in SEO</strong> is a hyperlink that points from one page on your website 
              to another page on the same website. Unlike external links (which point to other domains), 
              internal links help search engines understand your site structure and distribute &quot;link equity&quot; 
              across your pages.
            </p>
            <p className="text-gray-600 mb-4">
              When you strategically use <strong>internal link in SEO</strong> best practices, you help Google 
              discover new pages faster, understand which pages are most important, and pass authority from 
              your strongest pages to pages that need a ranking boost.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Why Internal Links Matter for Rankings
            </h3>
            <p className="text-gray-600 mb-4">
              Search engines use internal links to crawl and index your site. Pages with more internal links 
              pointing to them are seen as more important. Orphan pages (pages with zero internal links) 
              may never get indexed or may rank poorly because search engines don&apos;t know they exist.
            </p>
            <p className="text-gray-600">
              This tool analyzes your <strong>internal link in SEO</strong> structure by crawling your sitemap, 
              mapping all the internal links between pages, and identifying opportunities to strengthen 
              your linking strategy.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is an internal link in SEO?
              </h3>
              <p className="text-gray-600">
                An internal link is a link from one page on your website to another page on the same website. 
                In SEO, internal links help search engines crawl your site, understand your content hierarchy, 
                and distribute page authority throughout your site.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do internal links help SEO rankings?
              </h3>
              <p className="text-gray-600">
                Yes, internal links are a significant ranking factor. They help Google understand which pages 
                are most important on your site and pass &quot;link equity&quot; from high-authority pages to other pages. 
                Sites with strong internal linking structures typically rank better than those without.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How many internal links should I use per page?
              </h3>
              <p className="text-gray-600">
                There&apos;s no strict limit, but aim for quality over quantity. Most pages should have 3-10 
                relevant internal links in the content, plus navigation links. Every important page should 
                receive at least 3-5 internal links from other pages on your site.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What are orphan pages?
              </h3>
              <p className="text-gray-600">
                Orphan pages are pages on your site that have zero internal links pointing to them. 
                Search engines may have difficulty finding and indexing these pages, which can hurt 
                their rankings. This tool identifies orphan pages so you can fix them.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does this tool work?
              </h3>
              <p className="text-gray-600">
                This tool fetches your sitemap, crawls up to 150 pages, extracts all internal links, 
                and builds a map of your site&apos;s linking structure. It then identifies orphan pages, 
                weakly-linked pages, and your top-linked content to help you improve your internal 
                linking strategy.
              </p>
            </div>
          </div>
        </div>

        <ExploreMoreTools currentTool="/tools/internal-link-seo-audit" />

        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Part of the VCM creator tool stack. Build, monetize, and grow with APE & VCM OS.
          </p>
        </div>
      </div>
    </div>
  );
}
