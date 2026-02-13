"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Download, Trash2, Image as ImageIcon, Check, AlertCircle, Loader2, Archive, Shield, Bookmark } from "lucide-react";
import JSZip from "jszip";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";

interface ConvertedFile {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalUrl: string;
  jpgBlob: Blob | null;
  pngBlob: Blob | null;
  jpgSize: number;
  pngSize: number;
  convertedUrl: string;
  status: "converting" | "ready" | "failed";
  error?: string;
}

type WebpPresetJson = {
  outputFormat?: OutputFormat;
  qualityPreset?: QualityPreset;
  autoDownload?: boolean;
  zipFormat?: ZipFormat;
};
type WebpToolPreset = ToolPresetRecord<WebpPresetJson>;

type QualityPreset = "small" | "balanced" | "high";
type OutputFormat = "jpg" | "png";
type ZipFormat = "jpg" | "png";

const QUALITY_VALUES: Record<QualityPreset, number> = {
  small: 0.7,
  balanced: 0.85,
  high: 0.95,
};

export default function WebpToJpgClient() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("balanced");
  const [autoDownload, setAutoDownload] = useState(true);
  const [zipFormat, setZipFormat] = useState<ZipFormat>("jpg");
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { presets, savingPreset, savePreset } = useToolPresets<WebpPresetJson>({
    toolId: "webp-to-jpg",
    originCloudId: "file",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedIds = useRef<Set<string>>(new Set());
  const createdUrls = useRef<Set<string>>(new Set());

  const trackUrl = useCallback((url: string) => {
    if (url) createdUrls.current.add(url);
  }, []);

  const revokeUrl = useCallback((url: string) => {
    if (url && createdUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      createdUrls.current.delete(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      createdUrls.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      createdUrls.current.clear();
    };
  }, []);

  const convertImage = useCallback(
    async (file: File, id: string): Promise<Partial<ConvertedFile>> => {
      return new Promise((resolve) => {
        const img = new Image();
        const originalUrl = URL.createObjectURL(file);
        trackUrl(originalUrl);

        img.onload = async () => {
          try {
            const jpgCanvas = document.createElement("canvas");
            jpgCanvas.width = img.naturalWidth;
            jpgCanvas.height = img.naturalHeight;
            const jpgCtx = jpgCanvas.getContext("2d");

            if (!jpgCtx) {
              resolve({ status: "failed", error: "Canvas not supported" });
              return;
            }

            jpgCtx.fillStyle = "#FFFFFF";
            jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
            jpgCtx.drawImage(img, 0, 0);

            const jpgBlob = await new Promise<Blob | null>((res) => {
              jpgCanvas.toBlob((blob) => res(blob), "image/jpeg", QUALITY_VALUES[qualityPreset]);
            });

            const pngCanvas = document.createElement("canvas");
            pngCanvas.width = img.naturalWidth;
            pngCanvas.height = img.naturalHeight;
            const pngCtx = pngCanvas.getContext("2d");

            if (pngCtx) {
              pngCtx.drawImage(img, 0, 0);
            }

            const pngBlob = await new Promise<Blob | null>((res) => {
              pngCanvas.toBlob((blob) => res(blob), "image/png");
            });

            if (!jpgBlob && !pngBlob) {
              resolve({ status: "failed", error: "Conversion failed" });
              return;
            }

            const defaultBlob = outputFormat === "jpg" ? jpgBlob : pngBlob;
            const convertedUrl = defaultBlob ? URL.createObjectURL(defaultBlob) : "";
            if (convertedUrl) trackUrl(convertedUrl);

            resolve({
              originalUrl,
              jpgBlob,
              pngBlob,
              jpgSize: jpgBlob?.size || 0,
              pngSize: pngBlob?.size || 0,
              convertedUrl,
              status: "ready",
            });
          } catch {
            resolve({ status: "failed", error: "Conversion error" });
          }
        };

        img.onerror = () => {
          resolve({ status: "failed", error: "Invalid image file" });
        };

        img.src = originalUrl;
      });
    },
    [qualityPreset, outputFormat, trackUrl]
  );

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const processFiles = useCallback(
    async (inputFiles: FileList | File[]) => {
      const newFiles: ConvertedFile[] = [];

      for (const file of Array.from(inputFiles)) {
        if (!file.type.includes("image")) {
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          const id = `${Date.now()}-${Math.random()}`;
          newFiles.push({
            id,
            originalFile: file,
            originalName: file.name,
            originalSize: file.size,
            originalUrl: "",
            jpgBlob: null,
            pngBlob: null,
            jpgSize: 0,
            pngSize: 0,
            convertedUrl: "",
            status: "failed",
            error: "File too large (max 50MB)",
          });
          continue;
        }

        const id = `${Date.now()}-${Math.random()}`;
        newFiles.push({
          id,
          originalFile: file,
          originalName: file.name,
          originalSize: file.size,
          originalUrl: "",
          jpgBlob: null,
          pngBlob: null,
          jpgSize: 0,
          pngSize: 0,
          convertedUrl: "",
          status: "converting",
        });
      }

      if (newFiles.length === 0) return;

      setSaved(false);
      setFiles((prev) => [...prev, ...newFiles]);

      for (const fileEntry of newFiles) {
        if (fileEntry.status === "failed") continue;

        const result = await convertImage(fileEntry.originalFile, fileEntry.id);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, ...result } : f
          )
        );

        if (result.status === "ready" && autoDownload && !processedIds.current.has(fileEntry.id)) {
          processedIds.current.add(fileEntry.id);
          const blob = outputFormat === "jpg" ? result.jpgBlob : result.pngBlob;
          if (blob) {
            const baseName = fileEntry.originalName.replace(/\.[^.]+$/, "");
            triggerDownload(blob, `${baseName}.${outputFormat}`);
          }
        }
      }
    },
    [convertImage, autoDownload, outputFormat, triggerDownload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const downloadFile = useCallback(
    (file: ConvertedFile, format: "jpg" | "png") => {
      const blob = format === "jpg" ? file.jpgBlob : file.pngBlob;
      if (!blob) return;
      const baseName = file.originalName.replace(/\.[^.]+$/, "");
      triggerDownload(blob, `${baseName}.${format}`);
    },
    [triggerDownload]
  );

  const downloadAllAsZip = useCallback(async () => {
    const readyFiles = files.filter((f) => f.status === "ready");
    if (readyFiles.length === 0) return;

    const zip = new JSZip();

    for (const file of readyFiles) {
      const blob = zipFormat === "jpg" ? file.jpgBlob : file.pngBlob;
      if (blob) {
        const baseName = file.originalName.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}.${zipFormat}`, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, `converted-images.zip`);
  }, [files, zipFormat, triggerDownload]);

  const clearAll = useCallback(() => {
    files.forEach((f) => {
      revokeUrl(f.originalUrl);
      revokeUrl(f.convertedUrl);
    });
    setFiles([]);
    processedIds.current.clear();
    setSaved(false);
  }, [files, revokeUrl]);

  const handleSaveToWorkspace = useCallback(async () => {
    const readyFiles = files.filter((f) => f.status === "ready");
    if (readyFiles.length === 0 || saving || saved) return;
    
    setSaving(true);
    try {
      const totalOriginalSize = readyFiles.reduce((sum, f) => sum + f.originalSize, 0);
      const totalConvertedSize = readyFiles.reduce((sum, f) => sum + (outputFormat === "jpg" ? f.jpgSize : f.pngSize), 0);
      
      const response = await fetch("/api/workspace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: readyFiles.length === 1 
            ? `Converted: ${readyFiles[0].originalName}` 
            : `Converted ${readyFiles.length} WEBP files`,
          type: "file_output",
          cloud_id: "files",
          tool_id: "webp-to-jpg",
          preview_text: `${formatBytes(totalOriginalSize)} → ${formatBytes(totalConvertedSize)} (${readyFiles.length} file${readyFiles.length > 1 ? "s" : ""} to ${outputFormat.toUpperCase()})`,
          payload_json: {
            fileCount: readyFiles.length,
            outputFormat,
            qualityPreset: outputFormat === "jpg" ? qualityPreset : null,
            files: readyFiles.map(f => ({
              originalName: f.originalName,
              originalSize: f.originalSize,
              convertedSize: outputFormat === "jpg" ? f.jpgSize : f.pngSize,
            })),
          },
        }),
      });

      if (response.ok) {
        setSaved(true);
      } else {
        const data = await response.json();
        if (response.status === 401 || data.error === "Unauthorized") {
          alert("Please sign in to save to your workspace");
        } else if (response.status === 403 || data.code === "SUBSCRIPTION_REQUIRED") {
          alert("Workspace saving is part of the $11/mo global subscription. Visit Pricing to unlock it.");
        } else {
          alert("Failed to save. Please try again.");
        }
      }
    } catch (err) {
      console.error("Failed to save to workspace:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [files, saving, saved, outputFormat, qualityPreset]);

  const handleSavePreset = useCallback(async () => {
    const didSave = await savePreset(presetName, {
      outputFormat,
      qualityPreset,
      autoDownload,
      zipFormat,
    });
    if (didSave) {
      setPresetName("");
    }
  }, [presetName, outputFormat, qualityPreset, autoDownload, zipFormat, savePreset]);

  const applyPreset = useCallback((preset: WebpToolPreset) => {
    if (preset.preset_json.outputFormat) setOutputFormat(preset.preset_json.outputFormat);
    if (preset.preset_json.qualityPreset) setQualityPreset(preset.preset_json.qualityPreset);
    if (typeof preset.preset_json.autoDownload === "boolean") setAutoDownload(preset.preset_json.autoDownload);
    if (preset.preset_json.zipFormat) setZipFormat(preset.preset_json.zipFormat);
    setSaved(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        revokeUrl(file.originalUrl);
        revokeUrl(file.convertedUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    setSaved(false);
  }, [revokeUrl]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const readyCount = files.filter((f) => f.status === "ready").length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setOutputFormat("jpg"); setSaved(false); }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  outputFormat === "jpg"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                JPG
              </button>
              <button
                onClick={() => { setOutputFormat("png"); setSaved(false); }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  outputFormat === "png"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                PNG
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JPG Quality
            </label>
            <select
              value={qualityPreset}
              onChange={(e) => { setQualityPreset(e.target.value as QualityPreset); setSaved(false); }}
              disabled={outputFormat === "png"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="small">Small (70%)</option>
              <option value="balanced">Balanced (85%)</option>
              <option value="high">High (95%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Download
            </label>
            <button
              onClick={() => setAutoDownload(!autoDownload)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                autoDownload
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {autoDownload ? "ON" : "OFF"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Format
            </label>
            <select
              value={zipFormat}
              onChange={(e) => setZipFormat(e.target.value as ZipFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="jpg">ZIP as JPG</option>
              <option value="png">ZIP as PNG</option>
            </select>
          </div>
        </div>

        <div className="mb-6 pt-2">
          <ToolPresetBar
            presetName={presetName}
            onPresetNameChange={setPresetName}
            onSave={handleSavePreset}
            saving={savingPreset}
            presets={presets}
            onApply={applyPreset}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,.webp,image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-orange-500" : "text-gray-400"}`} />
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragging ? "Drop files here" : "Drop WEBP files or click to upload"}
          </p>
          <p className="text-sm text-gray-500">
            Supports batch conversion. Max 50MB per file.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Runs in your browser. We don&apos;t upload your files.</span>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Converted Files ({readyCount}/{files.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                {readyCount > 0 && (
                  <>
                    <button
                      onClick={downloadAllAsZip}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Download All as ZIP
                    </button>
                    <button
                      onClick={handleSaveToWorkspace}
                      disabled={saving || saved}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border-2 ${
                        saved
                          ? "border-green-500 text-green-600 bg-green-50"
                          : "border-orange-500 text-orange-600 hover:bg-orange-50"
                      } disabled:opacity-70`}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          Save to Workspace
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                    {file.status === "ready" && file.convertedUrl ? (
                      <img
                        src={file.convertedUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : file.status === "converting" ? (
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>Original: {formatBytes(file.originalSize)}</span>
                      {file.status === "ready" && (
                        <>
                          <span>→</span>
                          <span className="text-green-600">
                            JPG: {formatBytes(file.jpgSize)} / PNG: {formatBytes(file.pngSize)}
                          </span>
                        </>
                      )}
                    </div>
                    {file.status === "converting" && (
                      <p className="text-sm text-orange-600 mt-1">Converting...</p>
                    )}
                    {file.status === "failed" && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {file.error || "Conversion failed"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "ready" && (
                      <>
                        <button
                          onClick={() => downloadFile(file, "jpg")}
                          disabled={!file.jpgBlob}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          JPG
                        </button>
                        <button
                          onClick={() => downloadFile(file, "png")}
                          disabled={!file.pngBlob}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          PNG
                        </button>
                      </>
                    )}
                    {file.status === "ready" && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Note: Animated WEBP files will convert to a single frame (first frame only).
        </p>
      </div>
    </div>
  );
}
