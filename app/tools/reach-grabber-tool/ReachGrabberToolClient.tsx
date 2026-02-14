'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Check, Loader2, AlertCircle, Target, FileText, BarChart3 } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

export default function ReachGrabberToolClient() {
  const [keyword, setKeyword] = useState('');
  const [content, setContent] = useState('');
  const [optimizedText, setOptimizedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [seoStats, setSeoStats] = useState<{
    wordCount: number;
    keywordCount: number;
    density: number;
  } | null>(null);

  useEffect(() => {
    if (optimizedText && keyword) {
      const words = optimizedText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const keywordLower = keyword.toLowerCase().trim();
      const keywordWords = keywordLower.split(/\s+/);
      
      let keywordCount = 0;
      if (keywordWords.length === 1) {
        keywordCount = words.filter(w => w.includes(keywordLower)).length;
      } else {
        const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = optimizedText.match(regex);
        keywordCount = matches ? matches.length : 0;
      }
      
      const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
      
      setSeoStats({
        wordCount,
        keywordCount,
        density: Math.round(density * 100) / 100
      });
    } else {
      setSeoStats(null);
    }
  }, [optimizedText, keyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('Please enter a target keyword phrase');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter your content to optimize');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOptimizedText('');
    setSeoStats(null);

    try {
      const response = await fetch('/api/reach-grabber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize content');
      }

      setOptimizedText(data.optimizedText);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(optimizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
              ← Back to VCM Suite
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <section className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Free AI-Powered SEO Optimizer
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Reach Grabber Tool
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The <strong>reach grabber tool</strong> helps you instantly optimize your blog posts for better search engine rankings. 
              Paste your article, enter your target keyword phrase, and let AI rewrite your content for maximum SEO impact while maintaining readability.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="keyword" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-2" />
                  Target Keyword Phrase
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., reach grabber tool"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Original Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your blog post or article content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {content.length.toLocaleString()} / 50,000 characters
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !keyword.trim() || !content.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing your content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Optimize Content
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                This reach grabber tool uses AI to rewrite your content for SEO and readability.
                {remaining !== null && ` (${remaining} optimizations remaining this hour)`}
              </p>
            </form>
          </section>

          {optimizedText && (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Optimized Article
                </h2>
                <button
                  onClick={copyToClipboard}
                  data-track-output="true"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={optimizedText}
                rows={16}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 resize-y focus:outline-none"
              />

              {seoStats && (
                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    SEO Snapshot
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{seoStats.wordCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Word Count</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{seoStats.keywordCount}</p>
                      <p className="text-xs text-gray-600">Keyword Mentions</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${seoStats.density <= 2 ? 'text-green-600' : 'text-orange-600'}`}>
                        {seoStats.density}%
                      </p>
                      <p className="text-xs text-gray-600">Keyword Density</p>
                    </div>
                  </div>
                </div>
              )}
              
              <PostResultUpsell />
            </section>
          )}

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How the Reach Grabber Tool Works
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                The <strong>reach grabber tool</strong> uses advanced AI to analyze your content and strategically 
                incorporate your target keyword phrase throughout your article. Here's what it does:
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">1.</span>
                  <span>Analyzes your original content structure and meaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">2.</span>
                  <span>Naturally weaves your keyword into the title, intro, headings, and conclusion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">3.</span>
                  <span>Maintains optimal keyword density (1-2%) to avoid penalties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">4.</span>
                  <span>Improves readability and flow while preserving your voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">5.</span>
                  <span>Adds semantic variations and related terms for topical relevance</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How to Use This SEO Optimizer
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enter Your Keyword</h3>
                <p className="text-sm text-gray-600">
                  Type the exact keyword phrase you want to rank for in search engines.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Paste Your Content</h3>
                <p className="text-sm text-gray-600">
                  Copy and paste your existing blog post or article into the text area.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Optimized Content</h3>
                <p className="text-sm text-gray-600">
                  Click optimize and receive SEO-enhanced content ready to publish.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Use the Reach Grabber Tool?
            </h2>
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Save Hours of Manual Work</h3>
                  <p className="text-sm text-gray-600">
                    Instead of manually editing your content to include keywords, let AI handle the optimization in seconds.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Avoid Keyword Stuffing</h3>
                  <p className="text-sm text-gray-600">
                    The reach grabber tool maintains natural readability while hitting optimal keyword density.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Improve Your Rankings</h3>
                  <p className="text-sm text-gray-600">
                    Properly optimized content has a better chance of ranking on the first page of search results.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Keep Your Voice</h3>
                  <p className="text-sm text-gray-600">
                    The AI preserves your unique writing style while enhancing SEO elements.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is the reach grabber tool free?</h3>
                <p className="text-sm text-gray-600">
                  Yes! You can optimize up to 10 articles per hour completely free. No signup required.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What's the ideal keyword density?</h3>
                <p className="text-sm text-gray-600">
                  Most SEO experts recommend 1-2% keyword density. The tool automatically aims for this range to avoid over-optimization penalties.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I use this for any type of content?</h3>
                <p className="text-sm text-gray-600">
                  The reach grabber tool works best with blog posts, articles, and long-form content. It's designed to help content rank in search engines.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gray-100 rounded-2xl p-6 md:p-8 mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Explore More Free Creator Tools in VCM Suite
            </h2>
            <p className="text-gray-600 mb-6">
              The reach grabber tool is just one of many free tools designed to help creators succeed online.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/tools/keyword-finder" 
                className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Keyword Finder →
              </Link>
              <Link 
                href="/tools/ai-thumbnail-coach" 
                className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                AI Thumbnail Coach →
              </Link>
              <Link 
                href="/tools/logo-generator" 
                className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Logo Generator →
              </Link>
            </div>
          </section>

          <ExploreMoreTools currentTool="reach-grabber-tool" />
        </main>

        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} VCM Suite. All rights reserved.</p>
            <p className="mt-2">
              The reach grabber tool is part of the VCM Suite creator ecosystem.
            </p>
          </div>
        </footer>
      </div>
  );
}
