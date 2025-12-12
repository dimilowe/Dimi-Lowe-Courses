'use client';

import React, { useState } from "react";
import { EngineComponentProps } from "@/lib/engineRegistry";

export default function ThumbnailAnalysisEngine({ tool, canUsePro, canUseBasic }: EngineComponentProps) {
  const preset = tool?.preset;
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      setThumbnail(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function analyze() {
    if (!thumbnail) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("thumbnail", thumbnail);

    try {
      const res = await fetch("/api/thumbnail-analysis", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to analyze thumbnail.");
      } else {
        setResult(json.analysis);
      }
    } catch (err: any) {
      setError("Unexpected error. Try again.");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Thumbnail</h2>

        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFile}
        />

        {previewUrl && (
          <img
            src={previewUrl}
            className="mt-4 rounded-lg border shadow-sm max-h-64 object-contain"
          />
        )}

        <button
          onClick={analyze}
          disabled={!thumbnail || loading}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Thumbnail"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>

      {result && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(result.scores).map(([k, v]) => (
              <div key={k}>
                <p className="font-medium capitalize">{k}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${v as number}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1">{v as number}/100</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-1">Overall Verdict</h3>
            <p>{result.overallVerdict}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-1">What's Working</h3>
            <ul className="list-disc ml-5">
              {result.whatsWorking.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-1">What To Improve</h3>
            <ul className="list-disc ml-5">
              {result.whatToImprove.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Suggestions</h3>
            <ul className="list-disc ml-5">
              {result.suggestions.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
