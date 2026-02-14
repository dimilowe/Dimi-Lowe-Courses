'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Copy, Check, FileText, Zap, List, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';

interface SummaryResult {
  summary: string;
  takeaways: string[];
  truncated?: boolean;
  originalLength?: number;
}

type SummarizerPresetJson = {
  simpleMode?: boolean;
  bulletsOnly?: boolean;
};

type ToolPreset = ToolPresetRecord<SummarizerPresetJson>;

export default function SummarizerClient() {
  const [inputText, setInputText] = useState('');
  const [simpleMode, setSimpleMode] = useState(false);
  const [bulletsOnly, setBulletsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { presets, savingPreset, savePreset } = useToolPresets<SummarizerPresetJson>({
    toolId: 'summarizer',
    originCloudId: 'writing',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (inputText.trim().length < 200) {
      setError('Please enter at least 200 characters of text to summarize.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/summarizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: inputText.trim(),
          simpleMode,
          bulletsOnly,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const fullText = `Summary:\n${result.summary}\n\nKey Takeaways:\n${result.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    await navigator.clipboard.writeText(fullText);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setError('');
    setSimpleMode(false);
    setBulletsOnly(false);
    setSaved(false);
  };

  const handleSaveToWorkspace = async () => {
    if (!result || saving || saved) return;
    setSaving(true);
    try {
      const firstWords = inputText.trim().split(/\s+/).slice(0, 5).join(' ');
      const title = `Summary: ${firstWords}${inputText.trim().split(/\s+/).length > 5 ? '...' : ''}`;
      
      const response = await fetch('/api/workspace/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: 'copy_output',
          cloud_id: 'writing',
          tool_id: 'summarizer',
          preview_text: result.summary.slice(0, 200),
          payload_json: {
            summary: result.summary,
            takeaways: result.takeaways,
            originalText: inputText.slice(0, 1000),
          },
        }),
      });

      if (response.ok) {
        setSaved(true);
      } else {
        const data = await response.json();
        if (response.status === 401 || data.error === 'Unauthorized') {
          alert('Please sign in to save to your workspace');
        } else if (response.status === 403 || data.code === 'SUBSCRIPTION_REQUIRED') {
          alert('Workspace saving is part of the $11/mo global subscription. Visit Pricing to unlock it.');
        } else {
          alert('Failed to save. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to save to workspace:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreset = async () => {
    const didSave = await savePreset(presetName, { simpleMode, bulletsOnly });
    if (didSave) {
      setPresetName('');
    }
  };

  const applyPreset = (preset: ToolPreset) => {
    setSimpleMode(Boolean(preset.preset_json?.simpleMode));
    setBulletsOnly(Boolean(preset.preset_json?.bulletsOnly));
  };

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            Free AI Summarizer Tool
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free AI Summarizer Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            VCM Summarizer is a free <strong>AI summarizer generator</strong>. Paste any article, essay, or document 
            and our <strong>text summarizer</strong> will produce a clear summary and bullet-point key takeaways in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Paste Your Text</h2>
              <span className="text-sm text-gray-500">
                {wordCount} words / {charCount} chars
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your article, essay, notes, email, or any text you want to summarize..."
                className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
                required
              />

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={simpleMode}
                    onChange={(e) => setSimpleMode(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900">
                    Explain it in simpler language
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={bulletsOnly}
                    onChange={(e) => setBulletsOnly(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900">
                    Make the summary mostly bullet points
                  </span>
                </label>

                <ToolPresetBar
                  presetName={presetName}
                  onPresetNameChange={setPresetName}
                  onSave={handleSavePreset}
                  saving={savingPreset}
                  presets={presets}
                  onApply={applyPreset}
                />
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-track-output="true"
                disabled={loading || charCount < 200}
                className="mt-6 w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Summary
                  </>
                )}
              </button>

              {charCount > 0 && charCount < 200 && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {200 - charCount} more characters needed
                </p>
              )}
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              {result && (
                <button
                  onClick={handleCopyAll}
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {copiedField === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === 'all' ? 'Copied!' : 'Copy All'}
                </button>
              )}
            </div>

            {!result && !loading && (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-center">
                  Paste your text and click &quot;Generate Summary&quot; to get your AI-powered summary and key takeaways
                </p>
              </div>
            )}

            {loading && (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-12 h-12 mb-3 animate-spin text-orange-500" />
                <p className="text-center">Analyzing your text and generating summary...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.truncated && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    Note: Your input was very long, so we summarized the first {result.originalLength?.toLocaleString()} characters.
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      Summary
                    </h3>
                    <button
                      onClick={() => handleCopy(result.summary, 'summary')}
                      className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1"
                    >
                      {copiedField === 'summary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.summary}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <List className="w-4 h-4 text-orange-500" />
                      Key Takeaways
                    </h3>
                    <button
                      onClick={() => handleCopy(result.takeaways.join('\n'), 'takeaways')}
                      className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1"
                    >
                      {copiedField === 'takeaways' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {result.takeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveToWorkspace}
                    data-track-output="true"
                    disabled={saving || saved}
                    className={`flex-1 py-3 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      saved 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved to Workspace
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-4 h-4" />
                        Save to Workspace
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    Summarize Another
                  </button>
                </div>
                
                <PostResultUpsell />
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            How Our AI Summarizer Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paste Your Text</h3>
              <p className="text-gray-600 text-sm">
                Copy and paste any article, essay, email, notes, or document into our <strong>text summarizer</strong>.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analyzes Content</h3>
              <p className="text-gray-600 text-sm">
                Our <strong>AI summarizer</strong> reads your content, identifies key points, and removes unnecessary fluff.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Your Summary</h3>
              <p className="text-gray-600 text-sm">
                Receive a clean summary and bullet-point key takeaways you can copy and use anywhere.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <button 
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            {showFaq ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {showFaq && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What is a summarizer generator?
                </h3>
                <p className="text-gray-600">
                  A <strong>summarizer generator</strong> is an AI-powered tool that automatically condenses long 
                  texts into shorter, more digestible summaries. It identifies the most important information 
                  and presents it in a clear, concise format, saving you time when reviewing articles, 
                  documents, or research materials.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How does an AI summarizer work?
                </h3>
                <p className="text-gray-600">
                  An <strong>AI summarizer</strong> uses natural language processing (NLP) to understand the 
                  context and meaning of your text. It analyzes sentence importance, identifies key themes, 
                  and generates a coherent summary that preserves the essential meaning while removing 
                  redundant or less important content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What can I use this text summarizer for?
                </h3>
                <p className="text-gray-600">
                  Our <strong>text summarizer</strong> is perfect for summarizing articles, research papers, 
                  meeting notes, emails, essays, blog posts, news articles, and any other long-form content. 
                  Students use it for study notes, professionals for meeting summaries, and content creators 
                  for research.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is this summarizer tool really free?
                </h3>
                <p className="text-gray-600">
                  Yes! Our <strong>summarizer</strong> is completely free to use. You can summarize texts 
                  up to 8,000 characters without any account or payment. We built this tool to help 
                  students, professionals, and anyone who needs to quickly understand long content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What are the options for &quot;simpler language&quot; and &quot;bullet points&quot;?
                </h3>
                <p className="text-gray-600">
                  The &quot;simpler language&quot; option makes the <strong>summarizer</strong> use everyday 
                  vocabulary and shorter sentences, perfect for complex technical content. The &quot;bullet 
                  points&quot; option formats the summary primarily as bullet points for easier scanning.
                </p>
              </div>
            </div>
          )}
        </div>

        <ExploreMoreTools currentTool="/tools/summarizer" />

        <div className="mt-12 text-center text-sm text-gray-500">
          Part of the VCM creator tool stack. Build, monetize, and grow with APE & VCM OS.
        </div>
      </div>
    </div>
  );
}
