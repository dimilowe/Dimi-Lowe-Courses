'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Download, Copy, ArrowUpDown, AlertCircle, Loader2, Check, Sparkles } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface KeywordIdea {
  keyword: string;
  difficulty: number;
  searchVolume: number;
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational';
  contentAngle: string;
  notes: string;
}

type SortField = 'difficulty' | 'searchVolume';
type SortOrder = 'asc' | 'desc';

export default function KeywordFinderClient() {
  const [seed, setSeed] = useState('');
  const [maxDifficulty, setMaxDifficulty] = useState(30);
  const [maxResults, setMaxResults] = useState(50);
  const [language, setLanguage] = useState('English');
  const [keywords, setKeywords] = useState<KeywordIdea[]>([]);
  const [searchedSeed, setSearchedSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sortField, setSortField] = useState<SortField>('difficulty');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [remaining, setRemaining] = useState<number | null>(null);

  const findKeywords = async () => {
    if (!seed.trim()) {
      setError('Please enter a seed keyword or topic');
      return;
    }

    setIsLoading(true);
    setError(null);
    setKeywords([]);
    setSearchedSeed('');

    try {
      const response = await fetch('/api/keyword-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: seed.trim(),
          maxResults,
          maxDifficulty,
          language,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to find keywords');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'meta') {
                setSearchedSeed(data.seed);
                setRemaining(data.remaining);
              } else if (data.type === 'keyword') {
                setKeywords(prev => [...prev, data.keyword]);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                continue;
              }
              throw parseError;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const copyKeywords = async () => {
    const text = keywords.map(k => k.keyword).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    const headers = ['Keyword', 'Difficulty', 'Search Volume', 'Intent', 'Content Angle', 'Notes'];
    const rows = keywords.map(k => [
      `"${k.keyword}"`,
      k.difficulty,
      k.searchVolume,
      k.intent,
      `"${k.contentAngle.replace(/"/g, '""')}"`,
      `"${k.notes.replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${searchedSeed.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 20) return 'bg-green-100 text-green-800';
    if (difficulty <= 35) return 'bg-orange-100 text-orange-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'informational': return 'bg-blue-100 text-blue-800';
      case 'transactional': return 'bg-purple-100 text-purple-800';
      case 'commercial': return 'bg-pink-100 text-pink-800';
      case 'navigational': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Free Keyword Tool for SEO",
            "applicationCategory": "SEOApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free keyword tool for SEO that finds low-competition, long-tail keyword opportunities you can actually rank for.",
            "featureList": [
              "Free keyword research for SEO",
              "Low-competition keyword discovery",
              "Difficulty and volume estimates",
              "Search intent classification",
              "Content angle suggestions",
              "CSV export",
              "No signup required"
            ]
          })
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Keyword Tool for SEO
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Find low-competition keywords you can actually rank for
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Enter any topic and get long-tail keyword ideas with difficulty scores, search volume estimates, and content suggestions. 100% free, no signup required.
          </p>
          <p className="text-xs text-gray-400 mt-3">
            AI-powered estimates — not from paid SEO APIs like Ahrefs or Semrush.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-1.5">
                Seed keyword or topic <span className="text-red-500">*</span>
              </label>
              <input
                id="seed"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g. 'qr codes for business cards', 'dance content ideas', 'online course marketing'"
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900"
                onKeyDown={(e) => e.key === 'Enter' && findKeywords()}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="maxDifficulty" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Maximum difficulty: {maxDifficulty}
                </label>
                <input
                  id="maxDifficulty"
                  type="range"
                  value={maxDifficulty}
                  onChange={(e) => setMaxDifficulty(Number(e.target.value))}
                  min={10}
                  max={60}
                  step={5}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Easy</span>
                  <span>Medium</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max results
                </label>
                <select
                  id="maxResults"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 bg-white"
                >
                  <option value={20}>20 keywords</option>
                  <option value={30}>30 keywords</option>
                  <option value={50}>50 keywords</option>
                  <option value={75}>75 keywords</option>
                  <option value={100}>100 keywords</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Italian">Italian</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={findKeywords}
              data-track-output="true"
              disabled={isLoading || !seed.trim()}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                isLoading || !seed.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-gray-900'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding keywords... {keywords.length > 0 && `(${keywords.length} found)`}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find low-competition keywords
                </>
              )}
            </button>

            {remaining !== null && (
              <p className="text-center text-xs text-gray-500">
                {remaining} searches remaining this hour
              </p>
            )}
          </div>
        </div>

        {(keywords.length > 0 || isLoading) && searchedSeed && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-gray-700">
                  {isLoading ? (
                    <>Finding keywords for: <strong>&quot;{searchedSeed}&quot;</strong> — <strong>{keywords.length}</strong> found so far...</>
                  ) : (
                    <>Showing <strong>{keywords.length}</strong> low-competition keyword ideas for: <strong>&quot;{searchedSeed}&quot;</strong></>
                  )}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  Max difficulty: {maxDifficulty}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyKeywords}
                  data-track-output="true"
                  disabled={keywords.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
                <button
                  onClick={downloadCSV}
                  data-track-output="true"
                  disabled={keywords.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Keyword</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('difficulty')}
                        className="flex items-center gap-1 hover:text-orange-600"
                      >
                        Difficulty
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('searchVolume')}
                        className="flex items-center gap-1 hover:text-orange-600"
                      >
                        Volume
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Intent</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">Content Angle</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedKeywords.map((kw, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{kw.keyword}</p>
                          <p className="text-xs text-gray-500 lg:hidden mt-1">{kw.contentAngle}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                          {kw.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-700">
                        {kw.searchVolume.toLocaleString()}/mo
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getIntentColor(kw.intent)}`}>
                          {kw.intent}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 hidden lg:table-cell max-w-xs">
                        {kw.contentAngle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!isLoading && <PostResultUpsell />}
          </div>
        )}

        {!isLoading && keywords.length === 0 && searchedSeed && (
          <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8">
            <p className="text-gray-600">No keywords found. Try a broader topic or increase the maximum difficulty.</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-8 md:p-10 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Turn Keywords Into Revenue
          </h2>
          <p className="text-gray-300 mb-5 max-w-xl mx-auto">
            Found winning keywords? APE Funnels helps you create landing pages, lead magnets, and payment systems to monetize your SEO traffic.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold rounded-full transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Explore APE Funnels
          </Link>
        </div>

        <div className="prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Use a Free Keyword Tool for SEO?
          </h2>
          <p className="text-gray-600 mb-4">
            Keyword research is the foundation of any successful SEO strategy. A good free keyword tool for SEO helps you discover what people are actually searching for—and more importantly, which searches you have a realistic chance of ranking for.
          </p>
          <p className="text-gray-600 mb-4">
            Most beginners make the mistake of targeting high-volume, competitive keywords like &quot;marketing&quot; or &quot;fitness tips.&quot; With our free keyword tool, you&apos;ll find low-competition alternatives like &quot;email marketing for handmade jewelry shops&quot; or &quot;home workout routines for busy parents&quot;—phrases where smaller sites can actually compete.
          </p>
          <p className="text-gray-600 mb-8">
            The best part? You don&apos;t need to pay $100+/month for tools like Ahrefs or Semrush to get started. This free keyword tool for SEO gives you the insights you need to find untapped opportunities and start building organic traffic.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            What is a Low-Competition Keyword?
          </h2>
          <p className="text-gray-600 mb-4">
            A low-competition keyword is a search phrase where smaller websites have a realistic chance to rank on the first page of Google. These are typically long-tail keywords—more specific, 3-5 word phrases that larger sites often overlook.
          </p>
          <p className="text-gray-600 mb-8">
            Low-competition keywords usually have lower search volume (10-1,000 searches/month), but they attract highly targeted visitors who are more likely to convert. They&apos;re ideal for bloggers, creators, indie hackers, and small businesses building organic traffic without competing against established giants.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            How This Free Keyword Tool Works
          </h2>
          <p className="text-gray-600 mb-4">
            Our free keyword tool for SEO uses AI to analyze your topic and generate realistic keyword suggestions. Enter any seed keyword or topic, and you&apos;ll get dozens of long-tail variations with estimated difficulty scores, search volumes, and search intent.
          </p>
          <p className="text-gray-600 mb-4">
            Unlike paid SEO tools that pull from live databases, this free keyword tool uses AI pattern recognition to suggest opportunities. The estimates are directional—perfect for brainstorming and discovering angles you might not have considered.
          </p>
          <p className="text-gray-600 mb-8">
            Each keyword comes with a suggested content angle to help you understand what type of article, video, or page would best serve searchers looking for that phrase.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            Free Keyword Tool vs Paid SEO Tools
          </h2>
          <p className="text-gray-600 mb-4">
            Paid tools like Ahrefs, Semrush, and Moz offer precise data from their search databases—but they cost $99-$449/month. Our free keyword tool for SEO is ideal for:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
            <li><strong>Beginners</strong> — Learn keyword research without any investment</li>
            <li><strong>Brainstorming</strong> — Generate content ideas quickly before deeper research</li>
            <li><strong>Small budgets</strong> — Get directional data when paid tools aren&apos;t an option</li>
            <li><strong>Niche discovery</strong> — Find unexpected angles AI might surface that databases miss</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            How to Use Keywords From This Free SEO Tool
          </h2>
          <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
            <li><strong>Create content</strong> — Turn winning keywords into blog posts, YouTube videos, or landing pages</li>
            <li><strong>Monetize traffic</strong> — Use APE Funnels to add paywalls, lead magnets, and checkout flows to your content</li>
            <li><strong>Bridge offline to online</strong> — Use QR Social to connect short-form content or physical products to your SEO assets</li>
            <li><strong>Optimize your content</strong> — Use our other free tools (Word Counter, Image Compressor, Logo Generator) as part of your content creation workflow</li>
          </ul>
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        <ExploreMoreTools currentTool="/tools/keyword-finder" />
      </div>

      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Part of the VCM creator tools. Need a full brand kit? Try APE Funnels.</p>
        </div>
      </footer>
    </>
  );
}
