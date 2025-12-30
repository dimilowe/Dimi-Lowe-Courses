"use client";

import { useState } from "react";

type Motive = "fear" | "status" | "insider";
type Verdict = "red" | "yellow" | "green";

interface EvaluationResult {
  verdict: Verdict;
  reason: string;
  instruction: string;
  metrics?: Record<string, number | string>;
  warning?: string;
  error?: string;
}

const MOTIVE_LABELS: Record<Motive, string> = {
  fear: "Fear Avoidance",
  status: "Status Gain",
  insider: "Insider Access",
};

export default function YouTubePatternCloudClient() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [motive, setMotive] = useState<Motive>("fear");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/youtube-pattern-cloud/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, transcript, motive }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Evaluation failed.");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const getVerdictStyles = (verdict: Verdict) => {
    switch (verdict) {
      case "red":
        return {
          bg: "bg-red-50",
          border: "border-red-300",
          headline: "text-red-700",
          badge: "bg-red-600 text-white",
          label: "REJECT",
        };
      case "yellow":
        return {
          bg: "bg-amber-50",
          border: "border-amber-300",
          headline: "text-amber-700",
          badge: "bg-amber-500 text-white",
          label: "STOP — RISK ELEVATED",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-300",
          headline: "text-green-700",
          badge: "bg-green-600 text-white",
          label: "GREEN-LIGHT",
        };
    }
  };

  if (result) {
    const styles = getVerdictStyles(result.verdict);

    return (
      <div
        className={`max-w-xl mx-auto p-8 rounded-2xl border-2 ${styles.bg} ${styles.border}`}
      >
        <div className="text-center">
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-bold tracking-wide ${styles.badge}`}
          >
            {styles.label}
          </span>

          <p className={`mt-6 text-lg ${styles.headline}`}>{result.reason}</p>

          <p className="mt-4 text-xl font-bold text-gray-900">
            {result.instruction}
          </p>

          {result.warning && (
            <p className="mt-4 text-sm text-gray-500 italic">{result.warning}</p>
          )}

          {result.verdict !== "green" && result.metrics && (
            <div className="mt-6 p-4 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Metrics
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                {Object.entries(result.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="font-medium">
                      {typeof value === "number" ? value.toLocaleString() : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mt-8 px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Evaluate Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-gray-200 shadow-sm"
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            YouTube Video URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            The target video you want to validate
          </p>
        </div>

        <div>
          <label
            htmlFor="transcript"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Transcript (60–120 seconds)
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the first 60–120 seconds of your planned script..."
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Plain text only. Used for retention and density analysis.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dominant Click Motive
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOTIVE_LABELS) as Motive[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotive(m)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  motive === m
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {MOTIVE_LABELS[m]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            What emotion drives the click? No "General Interest" option.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url || !transcript}
          className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Evaluating distribution risk…" : "Submit for Evaluation"}
        </button>
      </div>
    </form>
  );
}
