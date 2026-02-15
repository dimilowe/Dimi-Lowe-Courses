"use client";

import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Mode = "merge" | "split";
type SplitMode = "every" | "ranges";

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function SortableItem({ item, onRemove }: { item: FileItem; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      
      <div className="p-2 bg-red-100 rounded">
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
      </div>
      
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function PdfMergeSplitClient() {
  const [mode, setMode] = useState<Mode>("merge");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("every");
  const [ranges, setRanges] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const resetState = () => {
    setFiles([]);
    setSplitFile(null);
    setRanges("");
    setError(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetState();
  };

  const validateAndAddFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    
    if (mode === "split") {
      const file = filesArray[0];
      if (!file) return;
      
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File exceeds 50MB limit.");
        return;
      }
      setSplitFile(file);
      setError(null);
      return;
    }

    const validFiles: FileItem[] = [];
    let newTotalSize = totalSize;

    for (const file of filesArray) {
      if (files.length + validFiles.length >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        break;
      }

      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds 50MB limit.`);
        continue;
      }

      if (newTotalSize + file.size > MAX_TOTAL_SIZE) {
        setError("Total file size exceeds 100MB limit.");
        break;
      }

      newTotalSize += file.size;
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  }, [mode, files.length, totalSize]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setError(null);
  };

  const clearAll = () => {
    resetState();
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Add at least 2 PDFs to merge.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((fileItem) => {
        formData.append("files[]", fileItem.file);
      });

      const response = await fetch("/api/pdf/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Merge failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `merged-${Date.now()}.pdf`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("vcm:tool-output-ready", {
            detail: {
              mode: "pdf",
              type: "uploaded_document",
              title: fileName,
              blob,
              fileName,
            },
          }),
        );
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) {
      setError("Upload a PDF to split.");
      return;
    }

    if (splitMode === "ranges" && !ranges.trim()) {
      setError("Enter page ranges (e.g., 1-3, 4-7).");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", splitFile);
      formData.append("mode", splitMode);
      if (splitMode === "ranges") {
        formData.append("ranges", ranges.trim());
      }

      const response = await fetch("/api/pdf/split", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Split failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "split-pages.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("merge")}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === "merge"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Merge PDFs
        </button>
        <button
          onClick={() => handleModeChange("split")}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === "split"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Split PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple={mode === "merge"}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="p-3 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {mode === "merge" ? (
            <>
              <p className="text-gray-700 font-medium mb-2">
                Drop PDF files here or click to browse
              </p>
              <p className="text-gray-500 text-sm">
                Up to {MAX_FILES} files, max {formatFileSize(MAX_TOTAL_SIZE)} total
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 font-medium mb-2">
                Drop a PDF file here or click to browse
              </p>
              <p className="text-gray-500 text-sm">
                Max file size: {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </>
          )}
        </div>

        {mode === "merge" && files.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {files.length} file{files.length !== 1 ? "s" : ""} ({formatFileSize(totalSize)})
            </span>
            <button
              onClick={clearAll}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {mode === "split" && splitFile && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{splitFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(splitFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => setSplitFile(null)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {mode === "merge" && files.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Files to Merge
            <span className="text-sm font-normal text-gray-500">(drag to reorder)</span>
          </h3>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {files.map((item) => (
                  <SortableItem key={item.id} item={item} onRemove={removeFile} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {files.length === 1 && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Add at least 2 PDFs to merge.
            </p>
          )}
        </div>
      )}

      {mode === "split" && splitFile && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Options</h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
              <input
                type="radio"
                name="splitMode"
                value="every"
                checked={splitMode === "every"}
                onChange={() => setSplitMode("every")}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <p className="font-medium text-gray-900">Split Every Page</p>
                <p className="text-sm text-gray-500">Each page becomes a separate PDF</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
              <input
                type="radio"
                name="splitMode"
                value="ranges"
                checked={splitMode === "ranges"}
                onChange={() => setSplitMode("ranges")}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500 mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Split by Ranges</p>
                <p className="text-sm text-gray-500 mb-2">Define custom page ranges</p>
                {splitMode === "ranges" && (
                  <input
                    type="text"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="e.g., 1-3, 4-7, 10-10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={mode === "merge" ? handleMerge : handleSplit}
        disabled={
          isProcessing ||
          (mode === "merge" && files.length < 2) ||
          (mode === "split" && !splitFile)
        }
        className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          isProcessing ||
          (mode === "merge" && files.length < 2) ||
          (mode === "split" && !splitFile)
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : mode === "merge" ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Merge PDFs
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Split PDF
          </>
        )}
      </button>
    </div>
  );
}
