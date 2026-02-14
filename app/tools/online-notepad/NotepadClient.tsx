"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Type, 
  Bold, 
  Italic, 
  Heading1, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Expand, 
  Minimize2,
  Download,
  Trash2,
  Copy,
  Check,
  Loader2
} from "lucide-react";

const STORAGE_KEY = "vcm-online-notepad-content";
const SAVE_DELAY = 500;

type AIMode = "summarize" | "rewrite" | "expand" | "shorten";

export default function NotepadClient() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAiMode, setActiveAiMode] = useState<AIMode | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setContent(saved);
      updateCounts(saved);
    }
  }, []);

  const updateCounts = (text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const saveToStorage = useCallback((text: string) => {
    localStorage.setItem(STORAGE_KEY, text);
    setSaveStatus("saved");
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateCounts(newContent);
    setSaveStatus("unsaved");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(newContent);
    }, SAVE_DELAY);
  };

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    updateCounts(newText);
    setSaveStatus("saving");
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(newText);
    }, SAVE_DELAY);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleFormat = (format: "h1" | "bold" | "italic") => {
    switch (format) {
      case "h1":
        insertFormatting("# ", "");
        break;
      case "bold":
        insertFormatting("**");
        break;
      case "italic":
        insertFormatting("*");
        break;
    }
  };

  const handleAiAction = async (mode: AIMode) => {
    if (!content.trim()) {
      setAiError("Please write some text first.");
      return;
    }

    if (content.trim().length < 10) {
      setAiError("Please write at least 10 characters.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setActiveAiMode(mode);

    try {
      const response = await fetch("/api/notepad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: content })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      if (data.result) {
        setContent(data.result);
        updateCounts(data.result);
        saveToStorage(data.result);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI request failed. Please try again.");
    } finally {
      setAiLoading(false);
      setActiveAiMode(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setAiError("Failed to copy. Please select and copy manually.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notepad.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (content && !confirm("Are you sure you want to clear all content?")) {
      return;
    }
    setContent("");
    updateCounts("");
    localStorage.removeItem(STORAGE_KEY);
    setSaveStatus("saved");
  };

  const aiActions: { mode: AIMode; label: string; icon: React.ReactNode; description: string }[] = [
    { mode: "summarize", label: "Summarize", icon: <FileText className="w-4 h-4" />, description: "Condense to key points" },
    { mode: "rewrite", label: "Rewrite", icon: <RefreshCw className="w-4 h-4" />, description: "Make clearer" },
    { mode: "expand", label: "Expand", icon: <Expand className="w-4 h-4" />, description: "Add more detail" },
    { mode: "shorten", label: "Shorten", icon: <Minimize2 className="w-4 h-4" />, description: "Reduce length" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFormat("h1")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Heading (H1)"
          >
            <Heading1 className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleFormat("bold")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleFormat("italic")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button
            onClick={handleCopy}
            data-track-output="true"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Copy all"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={handleDownload}
            data-track-output="true"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Download as .txt"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-red-500 transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{wordCount} words</span>
          <span className="text-gray-300">|</span>
          <span>{charCount} characters</span>
          <span className="text-gray-300">|</span>
          <span className={`flex items-center gap-1 ${
            saveStatus === "saved" ? "text-green-600" :
            saveStatus === "saving" ? "text-orange-500" : "text-gray-500"
          }`}>
            {saveStatus === "saved" && <Check className="w-3 h-3" />}
            {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
            {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
          </span>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing your notes here...

Tips:
• Your notes auto-save in your browser
• Use the formatting toolbar for headings, bold, and italic
• Try the AI actions below to transform your writing"
        className="w-full min-h-[400px] p-6 text-gray-800 text-lg leading-relaxed resize-y focus:outline-none font-mono"
        style={{ minHeight: "400px" }}
      />

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-gray-900">AI Actions</span>
          <span className="text-sm text-gray-500">(transforms your entire note)</span>
        </div>

        {aiError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {aiError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aiActions.map((action) => (
            <button
              key={action.mode}
              onClick={() => handleAiAction(action.mode)}
              disabled={aiLoading}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all ${
                aiLoading && activeAiMode === action.mode
                  ? "bg-orange-50 border-orange-300"
                  : "bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`p-2 rounded-lg ${
                aiLoading && activeAiMode === action.mode
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600"
              }`}>
                {aiLoading && activeAiMode === action.mode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  action.icon
                )}
              </div>
              <span className="font-medium text-gray-900 text-sm">{action.label}</span>
              <span className="text-xs text-gray-500">{action.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
