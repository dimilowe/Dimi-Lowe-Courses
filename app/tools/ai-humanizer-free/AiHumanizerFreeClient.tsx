'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  Bot, 
  User, 
  Wand2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface AnalysisResult {
  aiProbability: number;
  summary: string;
  reasons: string[];
  suggestions: string[];
  annotatedHtml: string;
}

export default function AiHumanizerFreeClient() {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [humanizedText, setHumanizedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai-humanizer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze text');
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text first.');
      return;
    }

    setIsHumanizing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-humanizer/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to humanize text');
      }

      setHumanizedText(data.humanizedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsHumanizing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(humanizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob <= 30) return 'text-green-600 bg-green-100';
    if (prob <= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProbabilityLabel = (prob: number) => {
    if (prob <= 30) return 'Likely Human';
    if (prob <= 60) return 'Mixed';
    return 'Likely AI';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            ← Back to VCM Suite
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Free AI Detection & Humanization
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Humanizer Free – Make Your AI Writing Sound Human
          </h1>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            This <strong>ai humanizer free</strong> tool helps bloggers, creators, and marketers turn robotic AI drafts 
            into natural, human-sounding writing. Paste your text, see how AI-like it sounds, then humanize it instantly.
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <label htmlFor="inputText" className="block text-sm font-semibold text-gray-700 mb-2">
              Paste your blog or article text
            </label>
            <textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your AI-generated or any text here to analyze and humanize..."
              rows={14}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y mb-4"
              disabled={isAnalyzing || isHumanizing}
            />
            <p className="text-xs text-gray-500 mb-4">
              {inputText.length.toLocaleString()} / 15,000 characters • We don't store your text. Analysis happens in memory and is discarded after the request.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isHumanizing || !inputText.trim()}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Analyze AI Probability
                  </>
                )}
              </button>
              <button
                onClick={handleHumanize}
                disabled={isAnalyzing || isHumanizing || !inputText.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isHumanizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Humanizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Humanize My Text
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {analysis && (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI-Written Probability
                  </h2>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`text-4xl font-bold px-4 py-2 rounded-xl ${getProbabilityColor(analysis.aiProbability)}`}>
                      {analysis.aiProbability}%
                    </div>
                    <div>
                      <p className={`font-semibold ${getProbabilityColor(analysis.aiProbability).split(' ')[0]}`}>
                        {getProbabilityLabel(analysis.aiProbability)}
                      </p>
                      <p className="text-sm text-gray-500">AI Detection Score</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        analysis.aiProbability <= 30 ? 'bg-green-500' :
                        analysis.aiProbability <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.aiProbability}%` }}
                    />
                  </div>

                  <p className="text-gray-600 text-sm">{analysis.summary}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Why It Looks AI-Written
                  </h2>
                  <ul className="space-y-2">
                    {analysis.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-orange-500 mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Suggested Fixes
                  </h2>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-1">✓</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <button
                    onClick={() => setShowAnnotated(!showAnnotated)}
                    className="w-full flex items-center justify-between text-lg font-bold text-gray-900"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Highlighted AI-Like Sections
                    </span>
                    {showAnnotated ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {showAnnotated && (
                    <div 
                      className="mt-4 prose prose-sm max-w-none text-gray-700 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-xl"
                      dangerouslySetInnerHTML={{ __html: analysis.annotatedHtml }}
                    />
                  )}
                </div>
              </>
            )}

            {!analysis && !humanizedText && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Analyze</h3>
                <p className="text-gray-500 text-sm">
                  Paste your text and click "Analyze AI Probability" to see how AI-like your content sounds.
                </p>
              </div>
            )}
          </div>
        </div>

        {humanizedText && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-500" />
                Humanized Version
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
              value={humanizedText}
              rows={12}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 resize-y focus:outline-none"
            />
            
            <PostResultUpsell />
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How This AI Humanizer Free Tool Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paste Your Text</h3>
              <p className="text-sm text-gray-600">
                Copy and paste any blog post, article, or content you want to analyze or humanize.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analyze or Humanize</h3>
              <p className="text-sm text-gray-600">
                Click "Analyze" to see AI probability and suggestions, or "Humanize" to instantly rewrite it.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Copy & Use</h3>
              <p className="text-sm text-gray-600">
                Copy the humanized text and use it in your blog, social posts, or anywhere else.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What is an AI humanizer?</h3>
              <p className="text-sm text-gray-600">
                An AI humanizer is a tool that rewrites AI-generated content to sound more natural and human-written. 
                This ai humanizer free tool analyzes patterns that make text sound robotic and transforms them into 
                conversational, engaging writing that readers connect with.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How accurate is this AI-written detection?</h3>
              <p className="text-sm text-gray-600">
                Our AI humanizer free tool uses advanced pattern recognition to estimate the probability that text was 
                AI-generated. While no detector is 100% accurate, our tool identifies common AI writing patterns like 
                uniform sentence structure, generic phrasing, and lack of personal voice. Use it as a guide, not a definitive verdict.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I use this to humanize my blog posts for SEO?</h3>
              <p className="text-sm text-gray-600">
                Absolutely! This ai humanizer free tool is perfect for making AI-drafted blog posts sound more authentic. 
                Search engines increasingly value original, human-sounding content. By humanizing your AI drafts, you create 
                content that engages readers and performs better in search results.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is my text stored or saved anywhere?</h3>
              <p className="text-sm text-gray-600">
                No. Your text is processed in memory and immediately discarded after analysis or humanization. 
                We don't store, log, or retain any of your content. Your privacy and content ownership are fully protected.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Explore More Free Creator Tools
          </h2>
          <p className="text-gray-600 mb-6">
            The ai humanizer free tool is just one of many free tools designed to help creators succeed online.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/tools/reach-grabber-tool" 
              className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              Reach Grabber Tool →
            </Link>
            <Link 
              href="/tools/keyword-finder" 
              className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              Keyword Finder →
            </Link>
            <Link 
              href="/tools/word-counter" 
              className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              Word Counter →
            </Link>
          </div>
        </section>

        <ExploreMoreTools currentTool="ai-humanizer-free" />
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} VCM Suite. All rights reserved.</p>
          <p className="mt-2">
            The ai humanizer free tool is part of the VCM Suite creator ecosystem.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .ai-flag {
          background-color: #fef3c7;
          border-bottom: 2px solid #f59e0b;
          padding: 0 2px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
