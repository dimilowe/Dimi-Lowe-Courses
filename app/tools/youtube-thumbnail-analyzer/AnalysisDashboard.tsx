"use client";

import { AnalysisResult } from "./ThumbnailAnalyzerClient";
import ScoreGauge from "./ScoreGauge";

interface Props {
  analysis: AnalysisResult;
  imagePreview: string;
  onReset: () => void;
}

function getOverallGrade(scores: AnalysisResult["scores"]): { grade: string; color: string } {
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
  
  if (avg >= 90) return { grade: "A+", color: "text-green-600" };
  if (avg >= 85) return { grade: "A", color: "text-green-600" };
  if (avg >= 80) return { grade: "A-", color: "text-green-500" };
  if (avg >= 75) return { grade: "B+", color: "text-orange-600" };
  if (avg >= 70) return { grade: "B", color: "text-orange-600" };
  if (avg >= 65) return { grade: "B-", color: "text-orange-500" };
  if (avg >= 60) return { grade: "C+", color: "text-orange-500" };
  if (avg >= 55) return { grade: "C", color: "text-orange-500" };
  if (avg >= 50) return { grade: "C-", color: "text-orange-600" };
  if (avg >= 45) return { grade: "D+", color: "text-red-500" };
  if (avg >= 40) return { grade: "D", color: "text-red-500" };
  return { grade: "F", color: "text-red-600" };
}

export default function AnalysisDashboard({ analysis, imagePreview, onReset }: Props) {
  const { grade, color } = getOverallGrade(analysis.scores);
  const avgScore = Math.round(
    Object.values(analysis.scores).reduce((a, b) => a + b, 0) / Object.values(analysis.scores).length
  );

  const scoreLabels: Record<keyof AnalysisResult["scores"], string> = {
    clarity: "Clarity",
    intrigue: "Intrigue",
    emotion: "Emotion",
    contrast: "Contrast",
    readability: "Text Readability",
    composition: "Composition",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Thumbnail Analysis</h2>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Analyze Another
        </button>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <img 
                src={imagePreview} 
                alt="Uploaded thumbnail" 
                className="w-full h-auto"
              />
              <div className="absolute top-3 right-3">
                <div className={`px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg ${color}`}>
                  <span className="text-3xl font-bold">{grade}</span>
                  <span className="text-sm text-gray-500 ml-1">({avgScore}/100)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">Overall Verdict</h3>
              <p className="text-gray-700">{analysis.overallVerdict}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Performance Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(analysis.scores) as Array<keyof AnalysisResult["scores"]>).map((key) => (
                <ScoreGauge
                  key={key}
                  label={scoreLabels[key]}
                  score={analysis.scores[key]}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-900">What&apos;s Working</h3>
            </div>
            <ul className="space-y-2">
              {analysis.whatsWorking.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-green-800">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-orange-900">What to Improve</h3>
            </div>
            <ul className="space-y-2">
              {analysis.whatToImprove.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-orange-800">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-orange-50 rounded-xl p-5 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-orange-900">Suggested Changes</h3>
          </div>
          <ol className="space-y-2">
            {analysis.suggestions.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-orange-900">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
