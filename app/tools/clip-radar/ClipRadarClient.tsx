"use client";

import { useState } from "react";
import { Search, Download, Copy, Check, ChevronDown, ChevronUp, ExternalLink, Zap, Video, FileText, Clock } from "lucide-react";

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipWindow {
  start: number;
  end: number;
}

interface ClipPeak {
  rank: number;
  peakTime: number;
  score: number;
  category: string;
  reasons: string[];
  windows: {
    short: ClipWindow;
    standard: ClipWindow;
    long: ClipWindow;
  };
  titles: string[];
  captions: string[];
}

interface ClipRadarResult {
  videoUrl: string;
  stats: {
    segmentsIn: number;
    segmentsMerged: number;
    durationSec: number;
  };
  results: ClipPeak[];
  exports: {
    csv: string;
    youtubeTimestamps: string;
    markersCsv: string;
  };
}

type ClipStyle = "balanced" | "hype" | "funny" | "rage" | "educational";
type WindowType = "short" | "standard" | "long";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export default function ClipRadarClient() {
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<ClipStyle>("balanced");
  const [minScore, setMinScore] = useState(55);
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClipRadarResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [windowType, setWindowType] = useState<WindowType>("standard");
  const [showOptions, setShowOptions] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    const isYoutubeUrl = url.includes("youtube.com") || url.includes("youtu.be");
    if (!isYoutubeUrl) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const transcriptRes = await fetch("/api/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), format: "segments" })
      });

      const transcriptData = await transcriptRes.json();

      if (!transcriptData.ok || !transcriptData.segments) {
        setError(transcriptData.message || "Failed to fetch transcript. Make sure the video has captions enabled.");
        setLoading(false);
        return;
      }

      const segments: TranscriptSegment[] = transcriptData.segments;

      const analyzeRes = await fetch("/api/tools/clip-radar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments,
          videoUrl: url.trim(),
          options: {
            style,
            minScore,
            maxResults
          }
        })
      });

      const analyzeData = await analyzeRes.json();

      if (analyzeData.error) {
        setError(analyzeData.error);
        return;
      }

      setResult(analyzeData);

    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hype": return "bg-orange-100 text-orange-700 border-orange-200";
      case "funny": return "bg-purple-100 text-purple-700 border-purple-200";
      case "rage": return "bg-red-100 text-red-700 border-red-200";
      case "educational": return "bg-blue-100 text-blue-700 border-blue-200";
      case "highlight": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getYouTubeTimestampUrl = (seconds: number) => {
    if (!result?.videoUrl) return "#";
    const videoId = result.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) return "#";
    return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Video URL
          </label>
          <input
            id="youtube-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
          />
        </div>

        <div>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options
          </button>
          
          {showOptions && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ClipStyle)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="hype">Hype</option>
                    <option value="funny">Funny</option>
                    <option value="rage">Rage</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Score: {minScore}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Results</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing transcript...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Find Clip Moments
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-gray-900">{result.results.length}</div>
              <div className="text-sm text-gray-600">Clips Found</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-gray-900">{result.stats.segmentsIn}</div>
              <div className="text-sm text-gray-600">Segments Analyzed</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-gray-900">{formatDuration(result.stats.durationSec)}</div>
              <div className="text-sm text-gray-600">Video Length</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-gray-900">{result.results.length > 0 ? result.results[0].score : 0}</div>
              <div className="text-sm text-gray-600">Top Score</div>
            </div>
          </div>

          {result.results.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-gray-900">Clip Moments</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Window:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    {(["short", "standard", "long"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setWindowType(type)}
                        className={`px-3 py-1 text-sm capitalize transition-colors ${
                          windowType === type
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {result.results.map((clip) => {
                  const window = clip.windows[windowType];
                  return (
                    <div
                      key={clip.rank}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold">
                          {clip.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <a
                              href={getYouTubeTimestampUrl(window.start)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(window.start)} - {formatTime(window.end)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getCategoryColor(clip.category)}`}>
                              {clip.category}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              Score: {clip.score}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-2">
                            {clip.titles[0]}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {clip.reasons.slice(0, 4).map((reason, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                                {reason}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(clip.titles[0], `title-${clip.rank}`)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                              {copiedIndex === `title-${clip.rank}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              Title
                            </button>
                            <button
                              onClick={() => handleCopy(clip.captions[0], `caption-${clip.rank}`)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                              {copiedIndex === `caption-${clip.rank}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              Caption
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      CSV Export
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(result.exports.csv, "csv")}
                        className="flex-1 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        {copiedIndex === "csv" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Copy
                      </button>
                      <button
                        onClick={() => handleDownload(result.exports.csv, "clipradar-export.csv")}
                        className="flex-1 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      YouTube Timestamps
                    </div>
                    <button
                      onClick={() => handleCopy(result.exports.youtubeTimestamps, "yt")}
                      className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                      {copiedIndex === "yt" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy Timestamps
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Marker CSV
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(result.exports.markersCsv, "markers")}
                        className="flex-1 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        {copiedIndex === "markers" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Copy
                      </button>
                      <button
                        onClick={() => handleDownload(result.exports.markersCsv, "clipradar-markers.csv")}
                        className="flex-1 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {result.results.length === 0 && (
            <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-amber-800 font-medium mb-2">No clip moments found</div>
              <div className="text-sm text-amber-700">
                Try lowering the minimum score threshold or use a video with more energetic commentary.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>How it works:</strong> ClipRadar analyzes the video transcript to find high-energy moments based on emotional reactions, events, audience engagement, and pacing.</p>
          <p><strong>Best for:</strong> Gaming streams, vlogs, podcasts, and any content where you react or talk during highlights.</p>
          <p><strong>Note:</strong> Transcript-based detection works best when you vocalize during key moments. Silent gameplay may not be detected.</p>
        </div>
      </div>
    </div>
  );
}
