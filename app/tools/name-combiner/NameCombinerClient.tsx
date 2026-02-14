'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Heart, Baby, Briefcase, Users, Gamepad2 } from 'lucide-react';
import PostResultUpsell from '@/components/PostResultUpsell';

type CombineStyle = 'balanced' | 'cute' | 'edgy' | 'fantasy' | 'brandable';

interface CombineResult {
  baseNames: string[];
  style: CombineStyle;
  suggestions: string[];
}

const styleOptions: { value: CombineStyle; label: string; description: string }[] = [
  { value: 'balanced', label: 'Balanced', description: 'Clean, natural-sounding blends' },
  { value: 'cute', label: 'Cute', description: 'Sweet endings like -y, -ie, -kins' },
  { value: 'edgy', label: 'Edgy', description: 'Sharp endings like -x, -zor, -vex' },
  { value: 'fantasy', label: 'Fantasy', description: 'Mystical endings like -riel, -wyn' },
  { value: 'brandable', label: 'Brandable', description: 'Short, punchy, business-ready' },
];

export default function NameCombinerClient() {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [name3, setName3] = useState('');
  const [style, setStyle] = useState<CombineStyle>('balanced');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CombineResult | null>(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name1.trim() || !name2.trim()) {
      setError('Please enter at least two names to combine.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/tools/name-combiner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name1: name1.trim(),
          name2: name2.trim(),
          name3: name3.trim() || null,
          style,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      
      setResult(data);
    } catch (err) {
      setError('Failed to generate names. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="name1" className="block text-sm font-medium text-gray-700 mb-2">
              Name 1 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              id="name1"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              placeholder="e.g., Alex"
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-gray-900"
            />
          </div>
          
          <div>
            <label htmlFor="name2" className="block text-sm font-medium text-gray-700 mb-2">
              Name 2 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              id="name2"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              placeholder="e.g., Jordan"
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-gray-900"
            />
          </div>
          
          <div>
            <label htmlFor="name3" className="block text-sm font-medium text-gray-700 mb-2">
              Name 3 <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="name3"
              value={name3}
              onChange={(e) => setName3(e.target.value)}
              placeholder="e.g., Blake"
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-gray-900"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Combination Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {styleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStyle(option.value)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  style === option.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {styleOptions.find((o) => o.value === style)?.description}
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Names...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Combine Names
            </>
          )}
        </button>
      </form>
      
      {result && result.suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Combined Name Ideas</h2>
              <p className="text-sm text-gray-500">
                Showing {result.suggestions.length} unique combinations from{' '}
                {result.baseNames.join(' + ')}
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium capitalize">
              {result.style}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.suggestions.map((name, index) => (
              <div
                key={index}
                className="group bg-gray-50 hover:bg-orange-50 rounded-xl p-4 flex items-center justify-between transition-all border border-transparent hover:border-orange-200"
              >
                <span className="font-semibold text-gray-900">{name}</span>
                <button
                  onClick={() => copyToClipboard(name, index)}
                  data-track-output="true"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white rounded-lg"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {result && result.suggestions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            No combinations found. Try shorter names or a different style.
          </p>
        </div>
      )}
      
      {result && result.suggestions.length > 0 && (
        <PostResultUpsell />
      )}
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 md:p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Use Cases</h3>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Couple Names</p>
              <p className="text-xs text-gray-500">Ship names & mashups</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Baby className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Baby Names</p>
              <p className="text-xs text-gray-500">Blend parent names</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Brand Names</p>
              <p className="text-xs text-gray-500">Business & startup</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Team Names</p>
              <p className="text-xs text-gray-500">Groups & clubs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Usernames</p>
              <p className="text-xs text-gray-500">Gaming & social</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
