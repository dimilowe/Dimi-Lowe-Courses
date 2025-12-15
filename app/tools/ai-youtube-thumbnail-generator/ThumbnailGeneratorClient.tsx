"use client";

import { useState } from "react";

interface GeneratedImage {
  id: string;
  pngBase64: string;
  variationHint: string;
}

interface GenerationResult {
  promptUsed: string;
  images: GeneratedImage[];
  warning?: string;
}

const HOOK_ANGLES = [
  { value: "curiosity", label: "Curiosity", description: "Makes viewers wonder what happens" },
  { value: "shock", label: "Shock", description: "Surprising or unexpected content" },
  { value: "authority", label: "Authority", description: "Expert or educational feel" },
  { value: "comparison", label: "Comparison", description: "Before/after or vs layouts" },
  { value: "tutorial", label: "Tutorial", description: "Step-by-step instructional look" },
];

const COUNT_OPTIONS = [1, 2, 4];

const SUGGESTED_PROMPTS = [
  "Dramatic close-up",
  "Split-screen comparison",
  "Minimalist design",
  "Bold text focus",
  "Shocked reaction",
];

export default function ThumbnailGeneratorClient() {
  const [videoTitle, setVideoTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [hookAngle, setHookAngle] = useState("curiosity");
  const [textOverlay, setTextOverlay] = useState("");
  const [styleRef, setStyleRef] = useState("");
  const [count, setCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const handleGenerate = async (variantHint: string = "") => {
    if (!videoTitle.trim() && !customPrompt.trim()) {
      setError("Please enter a video title or describe your thumbnail");
      return;
    }

    setError(null);
    setIsGenerating(true);
    if (!variantHint) {
      setResult(null);
    }

    try {
      const response = await fetch("/api/thumbnail/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: videoTitle.trim(),
          topic: topic.trim() || undefined,
          hookAngle,
          textOverlay: textOverlay.trim() || undefined,
          styleRef: styleRef.trim() || undefined,
          count: variantHint ? 1 : count,
          variantHint,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (variantHint && result) {
        const existingImages = result.images.filter(img => img.id !== regeneratingId);
        setResult({
          ...data,
          images: [...existingImages, ...data.images],
        });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
      setRegeneratingId(null);
    }
  };

  const handleRegenerate = async (image: GeneratedImage) => {
    setRegeneratingId(image.id);
    await handleGenerate(image.variationHint + " slightly different composition");
  };

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fillExample = () => {
    setVideoTitle("I Tried the Viral $1 vs $1000 Challenge");
    setTopic("lifestyle challenge");
    setHookAngle("curiosity");
    setTextOverlay("$1 vs $1000");
    setStyleRef("");
    setCustomPrompt("");
  };

  const handleCustomPromptGenerate = () => {
    if (!customPrompt.trim()) {
      setError("Please describe your thumbnail idea");
      return;
    }
    handleGenerate();
  };

  const getGridCols = () => {
    if (!result?.images) return "";
    const len = result.images.length;
    if (len === 1) return "grid-cols-1 max-w-xl mx-auto";
    if (len === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2";
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          {/* Video Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="e.g., I Tried the Viral $1 vs $1000 Challenge"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          {/* Topic & Hook Angle Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., gaming, cooking, tech review"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hook Angle
              </label>
              <select
                value={hookAngle}
                onChange={(e) => setHookAngle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
              >
                {HOOK_ANGLES.map((angle) => (
                  <option key={angle.value} value={angle.value}>
                    {angle.label} - {angle.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Overlay & Style Ref Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Overlay <span className="text-gray-400">(2-5 words max)</span>
              </label>
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="e.g., GONE WRONG"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              {textOverlay.trim().split(/\s+/).filter(Boolean).length > 5 && (
                <p className="text-red-500 text-xs mt-1">Text overlay must be 5 words or less</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style Reference <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={styleRef}
                onChange={(e) => setStyleRef(e.target.value)}
                placeholder="e.g., cinematic, cartoon, minimalist"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Count Selector & Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Generate:</span>
              {COUNT_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    count === c
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c} {c === 1 ? "image" : "images"}
                </button>
              ))}
            </div>

            <div className="flex-1 flex justify-end gap-3">
              <button
                onClick={fillExample}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fill Example
              </button>
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !videoTitle.trim()}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  isGenerating || !videoTitle.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Thumbnails"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Prompt Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-orange-500 px-6 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-semibold text-white">Or describe your thumbnail</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setCustomPrompt(prev => prev ? `${prev}, ${prompt.toLowerCase()}` : prompt)}
                className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors border border-orange-200"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe exactly what you want in your thumbnail... e.g., 'A person holding two objects side by side with shocked expression, bold yellow text saying WOW, bright studio lighting'"
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Tip: Be specific about composition, colors, text, and mood</p>
            <button
              onClick={handleCustomPromptGenerate}
              disabled={isGenerating || !customPrompt.trim()}
              className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
                isGenerating || !customPrompt.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate from Description
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {isGenerating && !result && (
        <div className={`grid ${count === 1 ? "grid-cols-1 max-w-xl mx-auto" : count === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"} gap-6`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && result.images.length > 0 && (
        <div className="space-y-6">
          {/* Warning */}
          {result.warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
              {result.warning}
            </div>
          )}

          {/* Prompt Preview */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-gray-700">Prompt Preview</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${showPrompt ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPrompt && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 font-mono">
                  {result.promptUsed}
                </p>
              </div>
            )}
          </div>

          {/* Image Grid */}
          <div className={`grid ${getGridCols()} gap-6`}>
            {result.images.map((image) => (
              <div key={image.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 relative">
                  {regeneratingId === image.id ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={`data:image/png;base64,${image.pngBase64}`}
                      alt={`Generated thumbnail ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-gray-500">{image.variationHint}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadImage(image.pngBase64, `thumbnail-${image.id}.png`)}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                    >
                      Download 1280×720 PNG
                    </button>
                    <button
                      onClick={() => handleRegenerate(image)}
                      disabled={regeneratingId === image.id}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
