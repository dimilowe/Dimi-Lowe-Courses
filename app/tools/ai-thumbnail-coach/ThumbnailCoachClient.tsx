"use client";

import { useState, useRef, useCallback } from "react";
import AnalysisDashboard from "./AnalysisDashboard";
import ChatPanel from "./ChatPanel";

export interface AnalysisResult {
  scores: {
    clarity: number;
    intrigue: number;
    emotion: number;
    contrast: number;
    readability: number;
    composition: number;
  };
  overallVerdict: string;
  whatsWorking: string[];
  whatToImprove: string[];
  suggestions: string[];
}

export default function ThumbnailCoachClient() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPEG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("thumbnail", file);

      const response = await fetch("/api/tools/thumbnail-coach/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || "Something went wrong analyzing your thumbnail. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const resetAnalysis = useCallback(() => {
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-8">
      {!analysis && (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
            ${isDragging 
              ? "border-orange-500 bg-orange-50" 
              : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
            }
            ${isAnalyzing ? "opacity-50 pointer-events-none" : "cursor-pointer"}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />

          {isAnalyzing ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg text-gray-600">Analyzing your thumbnail...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Drop your thumbnail here
              </p>
              <p className="text-gray-600 mb-4">
                or click to browse • PNG, JPEG, WebP up to 5MB
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Thumbnail
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
          {error}
        </div>
      )}

      {analysis && imagePreview && (
        <>
          <AnalysisDashboard 
            analysis={analysis} 
            imagePreview={imagePreview} 
            onReset={resetAnalysis}
          />
          <ChatPanel analysis={analysis} imagePreview={imagePreview} />
        </>
      )}
    </div>
  );
}
