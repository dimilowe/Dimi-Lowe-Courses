"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Upload, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Download, 
  X,
  FileText,
  GripVertical,
  AlertCircle
} from "lucide-react";

interface PageData {
  originalIndex: number;
  rotation: number;
  id: string;
}

export default function PDFEditorClient() {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [PDFLib, setPDFLib] = useState<any>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [originalPages, setOriginalPages] = useState<PageData[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPDFLib = async () => {
      try {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
        script.async = true;
        script.onload = () => {
          setPDFLib((window as any).PDFLib);
        };
        script.onerror = () => {
          setError("Failed to load PDF library. Please refresh the page.");
        };
        document.body.appendChild(script);
      } catch (err) {
        setError("Failed to load PDF library. Please refresh the page.");
      }
    };
    loadPDFLib();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setStatus("");

    if (file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit. Please choose a smaller file.");
      return;
    }

    if (!PDFLib) {
      setError("PDF library is still loading. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setStatus("Loading PDF...");
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadedPdf = await PDFLib.PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true 
      });
      
      const pageCount = loadedPdf.getPageCount();
      const initialPages: PageData[] = Array.from({ length: pageCount }, (_, i) => ({
        originalIndex: i,
        rotation: 0,
        id: `page-${i}-${Date.now()}`
      }));

      setPdfDoc(loadedPdf);
      setPages(initialPages);
      setOriginalPages(JSON.parse(JSON.stringify(initialPages)));
      setSelectedPageId(null);
      setStatus(`PDF loaded successfully - ${pageCount} page${pageCount !== 1 ? 's' : ''}`);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Failed to load PDF. The file may be corrupted or password-protected.");
      setIsLoading(false);
      setPdfDoc(null);
      setPages([]);
    }
  };

  const handleSelectPage = (id: string) => {
    setSelectedPageId(selectedPageId === id ? null : id);
  };

  const handleRotateLeft = () => {
    if (!selectedPageId) {
      setError("Select a page first to rotate.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setPages(pages.map(p => 
      p.id === selectedPageId 
        ? { ...p, rotation: (p.rotation - 90 + 360) % 360 }
        : p
    ));
  };

  const handleRotateRight = () => {
    if (!selectedPageId) {
      setError("Select a page first to rotate.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setPages(pages.map(p => 
      p.id === selectedPageId 
        ? { ...p, rotation: (p.rotation + 90) % 360 }
        : p
    ));
  };

  const handleDelete = () => {
    if (!selectedPageId) {
      setError("Select a page first to delete.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!confirm("Delete this page?")) return;
    
    const newPages = pages.filter(p => p.id !== selectedPageId);
    if (newPages.length === 0) {
      handleClear();
      return;
    }
    setPages(newPages);
    setSelectedPageId(null);
  };

  const handleDuplicate = () => {
    if (!selectedPageId) {
      setError("Select a page first to duplicate.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const idx = pages.findIndex(p => p.id === selectedPageId);
    if (idx === -1) return;
    
    const pageToDuplicate = pages[idx];
    const newPage: PageData = {
      ...pageToDuplicate,
      id: `page-${pageToDuplicate.originalIndex}-${Date.now()}`
    };
    
    const newPages = [...pages];
    newPages.splice(idx + 1, 0, newPage);
    setPages(newPages);
  };

  const handleReset = () => {
    if (originalPages.length === 0) return;
    setPages(JSON.parse(JSON.stringify(originalPages)));
    setSelectedPageId(null);
    setStatus("Changes reset to original.");
    setTimeout(() => setStatus(`PDF loaded - ${originalPages.length} pages`), 2000);
  };

  const handleClear = () => {
    setPdfDoc(null);
    setPages([]);
    setOriginalPages([]);
    setSelectedPageId(null);
    setFileName("");
    setFileSize(0);
    setStatus("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIdx = pages.findIndex(p => p.id === draggedId);
    const targetIdx = pages.findIndex(p => p.id === targetId);
    
    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedId(null);
      return;
    }

    const newPages = [...pages];
    const [removed] = newPages.splice(draggedIdx, 1);
    newPages.splice(targetIdx, 0, removed);
    
    setPages(newPages);
    setDraggedId(null);
  };

  const handleDownload = async () => {
    if (!pdfDoc || pages.length === 0 || !PDFLib) {
      setError("No PDF loaded or all pages deleted.");
      return;
    }

    setIsLoading(true);
    setStatus("Creating edited PDF...");

    try {
      const newPdf = await PDFLib.PDFDocument.create();

      for (const pageData of pages) {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageData.originalIndex]);
        
        if (pageData.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(PDFLib.degrees(currentRotation + pageData.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const baseName = fileName.replace(/\.pdf$/i, "");
      link.href = url;
      link.download = `${baseName}-edited.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus("PDF downloaded successfully!");
      setIsLoading(false);
    } catch (err) {
      console.error("Error creating PDF:", err);
      setError("Failed to create edited PDF. Please try again.");
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getRotationLabel = (rotation: number): string => {
    if (rotation === 0) return "";
    return `${rotation}°`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {!pdfDoc ? (
        <div className="p-8 md:p-12">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 text-center hover:border-orange-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload PDF</h3>
            <p className="text-gray-500 mb-4">Click to select or drag & drop your PDF file</p>
            <p className="text-sm text-gray-400">Maximum file size: 25MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload PDF file"
            />
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 text-sm truncate max-w-[200px] md:max-w-none">{fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileSize)} • {pages.length} page{pages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {status && !error && (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">{status}</span>
            )}
            
            {error && (
              <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">{error}</span>
            )}
          </div>

          <div className="p-4 bg-white flex flex-wrap gap-2">
            <button
              onClick={handleRotateLeft}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Rotate page left"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Rotate Left</span>
            </button>
            <button
              onClick={handleRotateRight}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Rotate page right"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">Rotate Right</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Delete page"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Duplicate page"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Reset all changes"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Click a page to select it. Drag and drop to reorder pages.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, page.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, page.id)}
                  onClick={() => handleSelectPage(page.id)}
                  className={`relative aspect-[3/4] bg-gray-100 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedPageId === page.id 
                      ? 'border-orange-500 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${draggedId === page.id ? 'opacity-50' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Page ${index + 1}${page.rotation ? `, rotated ${page.rotation} degrees` : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectPage(page.id);
                    }
                  }}
                >
                  <div className="absolute top-1 left-1 p-1 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="flex flex-col items-center"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    >
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 py-1 px-2 flex items-center justify-between rounded-b-lg">
                    <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                    {page.rotation !== 0 && (
                      <span className="text-xs text-orange-600 font-medium">{getRotationLabel(page.rotation)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex flex-wrap gap-3 justify-end">
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Clear and start over"
            >
              <X className="w-4 h-4" />
              Clear & Start Over
            </button>
            <button
              onClick={handleDownload}
              data-track-output="true"
              disabled={isLoading || pages.length === 0}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Download edited PDF"
            >
              <Download className="w-4 h-4" />
              {isLoading ? "Processing..." : "Download Edited PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
