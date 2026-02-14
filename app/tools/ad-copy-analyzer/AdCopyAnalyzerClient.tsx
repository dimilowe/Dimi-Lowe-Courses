'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Copy, Check, ChevronDown, ChevronUp, Zap, Target, TrendingUp, AlertTriangle, Lightbulb, FileText, Sparkles } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface ScoreBreakdown {
  hook: number;
  clarity: number;
  benefits: number;
  proof: number;
  specificity: number;
  cta: number;
  platformFit: number;
}

interface MyAdComparison {
  isMyAdProvided: boolean;
  summary: string;
  strongerAreas: string[];
  weakerAreas: string[];
  priorityFixesForMyAd: string[];
}

interface Rewrites {
  safeUpgrade: string;
  boldVersion: string;
  shortFormHookLines: string[];
  headlines: string[];
  ctaIdeas: string[];
}

interface AnalysisResult {
  summary: string;
  overallScore: number;
  scores: ScoreBreakdown;
  diagnosis: string[];
  whatWorks: string[];
  whatHurts: string[];
  improvements: string[];
  myAdComparison: MyAdComparison;
  rewrites: Rewrites;
  platformNotes: string;
  audienceNotes: string;
}

const PLATFORMS = ['Meta', 'TikTok', 'YouTube', 'Google', 'LinkedIn', 'Other'];
const GOALS = ['Leads', 'Purchases', 'Awareness', 'Clicks', 'App Installs', 'Other'];
const TONES = ['Neutral', 'Bold', 'Playful', 'Luxury', 'Educational', 'Other'];

const SAMPLE_AD = `🔥 Stop scrolling. This changed everything for me.

I was stuck at 1,000 followers for 2 years. Tried every "growth hack." Nothing worked.

Then I discovered a simple content system that 10x'd my reach in 90 days.

No dancing. No trends. No posting 5x a day.

Just 3 strategic posts per week that actually convert.

Over 10,000 creators have already downloaded the free guide.

👇 Tap "Learn More" to get instant access (before I take it down)`;

export default function AdCopyAnalyzerClient() {
  const [competitorAd, setCompetitorAd] = useState('');
  const [myAd, setMyAd] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [goal, setGoal] = useState('Leads');
  const [audience, setAudience] = useState('');
  const [brandTone, setBrandTone] = useState('Neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAnalyze = async () => {
    if (!competitorAd.trim()) {
      setError('Please enter competitor ad copy to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/ad-copy-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorAd: competitorAd.trim(),
          myAd: myAd.trim() || undefined,
          platform,
          goal,
          audience: audience.trim() || 'General audience',
          brandTone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze ad');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze ad. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillSample = () => {
    setCompetitorAd(SAMPLE_AD);
    setAudience('early-stage creators trying to grow with no ad budget');
    setPlatform('Meta');
    setGoal('Leads');
    setBrandTone('Bold');
  };

  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            Free Ad Copy Tool
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Ad Copy Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste any <strong>ad copy</strong> and get an AI-powered breakdown with scores, 
            insights, and improved versions for your campaigns.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Input</h2>
              <button
                onClick={fillSample}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Try Sample Ad
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor Ad Copy <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={competitorAd}
                  onChange={(e) => setCompetitorAd(e.target.value)}
                  placeholder="Paste the full ad copy here (primary text, headline, CTA, etc.)..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Ad Copy (optional)
                </label>
                <textarea
                  value={myAd}
                  onChange={(e) => setMyAd(e.target.value)}
                  placeholder="Paste your version to compare and improve..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {GOALS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. early-stage creators trying to grow with no ad budget"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Tone
                    </label>
                    <select
                      value={brandTone}
                      onChange={(e) => setBrandTone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {TONES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !competitorAd.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Ad Copy...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Ad Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Results</h2>

            {!result && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <Target className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center">
                  Paste ad copy and click "Analyze" to get<br />
                  your detailed breakdown and improvements
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600">Analyzing your ad copy...</p>
                <p className="text-sm text-gray-400 mt-2">This takes about 15-30 seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                  <div className="text-gray-600 mt-1">Overall Score</div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Score Breakdown</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.scores).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-20 text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreBarColor(value)}`}
                            style={{ width: `${value * 10}%` }}
                          />
                        </div>
                        <div className="w-8 text-sm font-medium text-gray-900">
                          {value}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-600 text-sm">{result.summary}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Key Insights
                  </h3>
                  <ul className="space-y-1">
                    {result.diagnosis.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  What Works
                </h3>
                <ul className="space-y-2">
                  {result.whatWorks.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  What Hurts
                </h3>
                <ul className="space-y-2">
                  {result.whatHurts.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-500" />
                Top Improvements
              </h3>
              <ul className="space-y-2">
                {result.improvements.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {result.myAdComparison.isMyAdProvided && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Your Ad Comparison
                </h3>
                <p className="text-gray-600 text-sm mb-4">{result.myAdComparison.summary}</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">Stronger Areas</h4>
                    <ul className="space-y-1">
                      {result.myAdComparison.strongerAreas.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-2">Weaker Areas</h4>
                    <ul className="space-y-1">
                      {result.myAdComparison.weakerAreas.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-2">Priority Fixes</h4>
                    <ul className="space-y-1">
                      {result.myAdComparison.priorityFixesForMyAd.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Rewritten Versions
              </h3>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Safe Upgrade</h4>
                    <button
                      onClick={() => handleCopy(result.rewrites.safeUpgrade, 'safe')}
                      data-track-output="true"
                      className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      {copiedField === 'safe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'safe' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.rewrites.safeUpgrade}</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Bold Version</h4>
                    <button
                      onClick={() => handleCopy(result.rewrites.boldVersion, 'bold')}
                      data-track-output="true"
                      className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      {copiedField === 'bold' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'bold' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.rewrites.boldVersion}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Hook Lines</h4>
                    <ul className="space-y-2">
                      {result.rewrites.shortFormHookLines.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-orange-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Headlines</h4>
                    <ul className="space-y-2">
                      {result.rewrites.headlines.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-orange-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">CTA Ideas</h4>
                    <ul className="space-y-2">
                      {result.rewrites.ctaIdeas.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-orange-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Platform Notes</h3>
                <p className="text-sm text-gray-600">{result.platformNotes}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Audience Notes</h3>
                <p className="text-sm text-gray-600">{result.audienceNotes}</p>
              </div>
            </div>
            
            <PostResultUpsell />
          </div>
        )}

        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What is Ad Copy and Why Analyze It?
          </h2>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Ad copy</strong> is the text in your advertisements that persuades people to take action. 
              Whether you're running Meta ads, TikTok campaigns, or Google search ads, your ad copy is often 
              the difference between a scroll-past and a click-through.
            </p>
            
            <p className="text-gray-600 mb-4">
              Great ad copy follows proven principles: a strong hook to stop the scroll, clear benefits 
              that speak to your audience's desires, social proof to build trust, and a compelling 
              call-to-action that drives conversions.
            </p>

            <p className="text-gray-600">
              Our free ad copy analyzer uses AI to evaluate your ads against these principles, 
              providing actionable insights and improved versions you can test in your campaigns.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions About Ad Copy
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What makes good ad copy?</h3>
              <p className="text-gray-600">
                Effective ad copy has a scroll-stopping hook, speaks directly to your target audience's 
                pain points or desires, includes proof elements (numbers, testimonials, results), 
                and ends with a clear call-to-action. The best ad copy feels personal, not salesy.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I write ad copy for Meta/Facebook?</h3>
              <p className="text-gray-600">
                Meta ad copy should lead with a pattern interrupt or emotional hook in the first line. 
                Keep paragraphs short (2-3 lines max), use line breaks liberally, and front-load the 
                value proposition. Emojis can help break up text but use them sparingly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How long should my ad copy be?</h3>
              <p className="text-gray-600">
                It depends on your offer and audience. Simple, low-commitment offers (free guides, quizzes) 
                can work with short copy. High-ticket or complex offers often need longer copy to overcome 
                objections. Test both and let your audience decide.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How does this ad copy analyzer work?</h3>
              <p className="text-gray-600">
                Our AI analyzes your ad copy against direct-response copywriting best practices. 
                It evaluates your hook strength, clarity of message, benefit articulation, proof elements, 
                specificity, CTA effectiveness, and platform fit—then generates improved versions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is this ad copy tool really free?</h3>
              <p className="text-gray-600">
                Yes! You can analyze up to 10 ads per hour completely free. We built this tool to help 
                creators and marketers write better ads without needing an expensive copywriter or 
                agency.
              </p>
            </div>
          </div>
        </div>

        <ExploreMoreTools currentTool="/tools/ad-copy-analyzer" />

        <div className="mt-12 text-center text-sm text-gray-500">
          Part of the VCM creator tool stack. Build, monetize, and grow with APE & VCM OS.
        </div>
      </div>
    </div>
  );
}
