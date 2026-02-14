"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles, Trash2 } from "lucide-react";

interface PromptResult {
  label: string;
  text: string;
}

const MOOD_OPTIONS = [
  "Euphoric",
  "Romantic", 
  "Dark",
  "Aggressive",
  "Chill",
  "Melancholic",
  "Inspirational",
  "Party"
];

const ENERGY_OPTIONS = ["Low", "Medium", "High"];

const VOCAL_OPTIONS = [
  "Female vocals",
  "Male vocals", 
  "No vocals (instrumental)",
  "Mixed vocals"
];

const TEMPO_OPTIONS = ["Slow", "Mid", "Fast"];

export default function SunoPromptGeneratorClient() {
  const [input, setInput] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [vocalType, setVocalType] = useState("");
  const [artistInspo, setArtistInspo] = useState("");
  const [tempo, setTempo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prompts, setPrompts] = useState<PromptResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("Please describe the song or vibe you want.");
      return;
    }

    setLoading(true);
    setError("");
    setPrompts([]);

    try {
      const res = await fetch("/api/suno-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          genre: genre.trim(),
          mood,
          energy,
          vocalType,
          artistInspo: artistInspo.trim(),
          tempo
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setPrompts(data.prompts);
    } catch {
      setError("Failed to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setGenre("");
    setMood("");
    setEnergy("");
    setVocalType("");
    setArtistInspo("");
    setTempo("");
    setPrompts([]);
    setError("");
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setError("Failed to copy. Please try selecting and copying manually.");
    }
  };

  const getCharCountColor = (length: number) => {
    if (length < 450) return "text-green-600";
    if (length <= 500) return "text-amber-600";
    return "text-red-600";
  };

  const getCharCountBg = (length: number) => {
    if (length < 450) return "bg-green-50";
    if (length <= 500) return "bg-amber-50";
    return "bg-red-50";
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Song / Vibe Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the song you want... e.g., 'A dreamy summer night driving through the city, windows down, feeling free'"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={3}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the vibe, reference a song style, or set the scene. Do not paste lyrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Pop, R&B, EDM, Lo-fi"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Select mood...</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Select energy...</option>
                {ENERGY_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vocal Type
              </label>
              <select
                value={vocalType}
                onChange={(e) => setVocalType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Select vocals...</option>
                {VOCAL_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artist Inspiration
              </label>
              <input
                type="text"
                value={artistInspo}
                onChange={(e) => setArtistInspo(e.target.value)}
                placeholder="e.g., The Weeknd, Daft Punk"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-converts to &quot;-style&quot; format
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo
              </label>
              <select
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Select tempo...</option>
                {TEMPO_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Suno Prompts
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {prompts.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
              <Check className="w-4 h-4" />
              Auto-optimized for Suno (≤500 chars)
            </div>
          </div>

          <div className="grid gap-4">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{prompt.label}</h3>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${getCharCountBg(prompt.text.length)} ${getCharCountColor(prompt.text.length)}`}>
                    {prompt.text.length} / 500
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {prompt.text}
                  </p>
                  <button
                    onClick={() => handleCopy(prompt.text, index)}
                    data-track-output="true"
                    disabled={!prompt.text}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            Tip: Suno works best with clear genre + mood + instrumentation + vocal type + structure cues. Don&apos;t paste lyrics.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-8">
        Prompts are generated on-demand and not stored.
      </p>
    </div>
  );
}
