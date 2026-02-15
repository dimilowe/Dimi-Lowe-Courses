"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Save, X, ArrowRight, Download, Image, Video, FileText, File as FileIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  TOOL_QUICK_IMPORT_EVENT,
  type QuickImportKind,
  type ToolQuickImportDetail,
  isToolQuickImportCompatible,
} from "@/lib/workspace/toolQuickImport";
import { setWorkspaceDragPayload } from "@/lib/workspace/workspaceDragImport";
import {
  getWorkstationHrefForItem,
  getWorkstationLabelForMode,
  getWorkstationModeForItemType,
} from "@/lib/workstations/getWorkstationTarget";

type WorkspaceItem = {
  id: string;
  title: string;
  type: string;
  thumbnail_url: string | null;
  file_url: string | null;
};

const TYPE_ICON = {
  image: Image,
  video: Video,
  pdf: FileText,
  default: FileIcon,
};

function mapType(type: string): QuickImportKind {
  if (type.includes("image")) return "image";
  if (type.includes("video")) return "video";
  if (type.includes("pdf")) return "pdf";
  return "default";
}

function guessExtension(contentType: string, fallbackKind: QuickImportKind) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("pdf")) return "pdf";
  if (fallbackKind === "image") return "png";
  if (fallbackKind === "video") return "mp4";
  if (fallbackKind === "pdf") return "pdf";
  return "bin";
}

function toWorkspaceType(contentType: string) {
  if (contentType.startsWith("image/")) return "uploaded_image";
  if (contentType.startsWith("video/")) return "uploaded_video";
  if (contentType.startsWith("audio/")) return "uploaded_audio";
  if (contentType === "application/pdf") return "uploaded_document";
  return "uploaded_file";
}

export default function FloatingToolsButton() {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isDraggingRecentFile, setIsDraggingRecentFile] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [brokenThumbnailIds, setBrokenThumbnailIds] = useState<Record<string, true>>({});

  const toolSlug = useMemo(() => {
    if (!pathname?.startsWith("/tools/")) return null;
    const parts = pathname.split("/").filter(Boolean);
    return parts[1] || null;
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadRecentFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/items?scope=all&sort=recent&limit=12", { cache: "no-store" });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/workspace/items?scope=all&sort=recent&limit=12", { cache: "no-store" });
        if (!res.ok) {
          if (active) setItems([]);
          return;
        }
        const data = await res.json();
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadRecentFiles();
  }, [isOpen, loadRecentFiles]);

  useEffect(() => {
    const onWorkspaceUpdated = () => {
      void loadRecentFiles();
    };
    window.addEventListener("workspace:items-updated", onWorkspaceUpdated);
    return () => window.removeEventListener("workspace:items-updated", onWorkspaceUpdated);
  }, [loadRecentFiles]);

  const handleUploadFiles = useCallback(
    async (filesInput: FileList | File[] | null, fallbackUrl?: string | null) => {
      const files = filesInput ? (Array.isArray(filesInput) ? filesInput : Array.from(filesInput)) : [];
      if (files.length === 0 && !fallbackUrl) return;
      setIsUploading(true);
      setUploadMessage(null);
      try {
        let uploadedCount = 0;
        let localAddedCount = 0;
        let firstError: string | null = null;
        const queue: File[] = [...files];

        if (queue.length === 0 && fallbackUrl) {
          try {
            const fetched = await fetch(fallbackUrl);
            if (fetched.ok) {
              const blob = await fetched.blob();
              const ext = blob.type.includes("png")
                ? "png"
                : blob.type.includes("jpeg")
                  ? "jpg"
                  : blob.type.includes("webp")
                    ? "webp"
                    : "bin";
              queue.push(new File([blob], `dropped-file.${ext}`, { type: blob.type || "application/octet-stream" }));
            }
          } catch {}
        }

        for (const file of queue) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("cloud_id", "file-data");
          const res = await fetch("/api/workspace/upload", { method: "POST", body: formData, credentials: "same-origin" });
          if (res.ok) {
            uploadedCount += 1;
          } else if (!firstError) {
            let message = `Upload failed (${res.status})`;
            try {
              const data = await res.json();
              if (typeof data?.error === "string") {
                message = data.error;
                if (typeof data?.detail === "string" && data.detail.trim()) {
                  message = `${data.error}: ${data.detail}`;
                }
              } else {
                message = `Upload failed (${res.status})`;
              }
            } catch {
              message = `Upload failed (${res.status})`;
            }
            // Final client fallback: keep workflow moving by adding a local-only recent file entry.
            const localUrl = URL.createObjectURL(file);
            const contentType = file.type || "application/octet-stream";
            setItems((prev) => [
              {
                id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: file.name,
                type: toWorkspaceType(contentType),
                thumbnail_url: contentType.startsWith("image/") ? localUrl : null,
                file_url: localUrl,
              },
              ...prev,
            ]);
            localAddedCount += 1;
            if (!firstError) firstError = message;
          }
        }
        await loadRecentFiles();
        if (uploadedCount > 0 && typeof window !== "undefined") {
          window.dispatchEvent(new Event("workspace:items-updated"));
        }
        setUploadMessage(
          uploadedCount > 0
            ? `Uploaded ${uploadedCount} file${uploadedCount === 1 ? "" : "s"} to workspace.`
            : localAddedCount > 0
              ? `Added ${localAddedCount} file${localAddedCount === 1 ? "" : "s"} locally (not synced to workspace).`
              : firstError || "No files were uploaded.",
        );
      } catch {
        setUploadMessage("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [loadRecentFiles],
  );

  const handleUseInTool = async (item: WorkspaceItem, kind: QuickImportKind) => {
    if (!item.file_url || !toolSlug) return;
    setImportingId(item.id);
    try {
      const res = await fetch(item.file_url);
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const contentType =
        blob.type || (kind === "image" ? "image/png" : kind === "video" ? "video/mp4" : "application/octet-stream");
      const ext = guessExtension(contentType, kind);
      const base = item.title?.trim() || `workspace-${item.id}`;
      const hasExt = /\.[a-z0-9]{2,5}$/i.test(base);
      const filename = hasExt ? base : `${base}.${ext}`;
      const file = new File([blob], filename, { type: contentType });
      const detail: ToolQuickImportDetail = {
        file,
        kind,
        itemId: item.id,
        source: "workspace",
      };
      window.dispatchEvent(new CustomEvent<ToolQuickImportDetail>(TOOL_QUICK_IMPORT_EVENT, { detail }));
      setIsOpen(false);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 flex items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group rounded-full ${
          isCollapsed 
            ? "w-12 hover:w-[200px] h-12 justify-center p-0 hover:pl-4 hover:pr-5 hover:gap-2" 
            : "gap-2 px-4 py-3"
        }`}
        title="Recent Files"
      >
        <Save className="w-5 h-5 flex-shrink-0" />
        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-150 ${
          isCollapsed 
            ? "w-0 opacity-0 group-hover:w-auto group-hover:opacity-100" 
            : "opacity-100"
        }`}>
          Recent Files
        </span>
        <ArrowRight className={`flex-shrink-0 transition-all duration-150 ${
          isCollapsed 
            ? "w-0 opacity-0 group-hover:w-4 group-hover:h-4 group-hover:opacity-100 group-hover:translate-x-0.5" 
            : "w-4 h-4 opacity-100 group-hover:translate-x-0.5"
        }`} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isDraggingRecentFile ? "pointer-events-none" : ""}`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Save className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Recent Files</h2>
                <p className="text-orange-100 text-xs">Reuse your workspace files anywhere</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-sm text-gray-500 px-1">Loading recent files...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
                No recent files yet. Save outputs to Workspace and they&apos;ll show up here.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const kind = mapType(item.type);
                  const Icon = TYPE_ICON[kind] || TYPE_ICON.default;
                  const workstationMode = getWorkstationModeForItemType(item.type);
                  const workstationHref = getWorkstationHrefForItem({
                    type: item.type,
                    fileUrl: item.file_url,
                    title: item.title,
                    itemId: item.id,
                  });
                  return (
                    <div
                      key={item.id}
                      className={`p-3 bg-gray-50 border border-gray-200 rounded-xl ${item.file_url ? "cursor-grab active:cursor-grabbing" : ""}`}
                      draggable={Boolean(item.file_url)}
                      onDragStart={(e) => {
                        if (!item.file_url) return;
                        setIsDraggingRecentFile(true);
                        setWorkspaceDragPayload(e.dataTransfer, {
                          itemId: item.id,
                          title: item.title,
                          type: item.type,
                          fileUrl: item.file_url,
                        });
                      }}
                      onDragEnd={() => {
                        setIsDraggingRecentFile(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {item.thumbnail_url && !brokenThumbnailIds[item.id] ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            onError={() =>
                              setBrokenThumbnailIds((prev) =>
                                prev[item.id] ? prev : { ...prev, [item.id]: true }
                              )
                            }
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs uppercase text-gray-500">{kind}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {toolSlug && item.file_url && isToolQuickImportCompatible(toolSlug, kind) && (
                          <button
                            onClick={() => handleUseInTool(item, kind)}
                            data-track-output="true"
                            disabled={importingId === item.id}
                            className="text-xs px-2 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                          >
                            {importingId === item.id ? "Using..." : "Use here"}
                          </button>
                        )}
                        {workstationMode && workstationHref && (
                          <Link
                            href={workstationHref}
                            onClick={() => setIsOpen(false)}
                            className="text-xs px-2 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 font-semibold"
                          >
                            {getWorkstationLabelForMode(workstationMode)}
                          </Link>
                        )}
                        <Link
                          href={`/workspace/${item.id}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                          Open
                        </Link>
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            download
                            data-track-output="true"
                            className="text-xs px-2 py-1 rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDropActive(false);
                const droppedUrl = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
                const itemFiles = Array.from(e.dataTransfer.items || [])
                  .map((item) => item.getAsFile())
                  .filter((file): file is File => Boolean(file));
                void handleUploadFiles(itemFiles.length > 0 ? itemFiles : e.dataTransfer.files, droppedUrl || null);
              }}
              className={`w-full rounded-xl border-2 border-dashed px-4 py-4 text-center cursor-pointer transition-colors ${
                isDropActive ? "border-orange-400 bg-orange-50" : "border-gray-300 bg-white hover:bg-gray-100"
              }`}
            >
              <p className="text-sm font-medium text-gray-800">{isUploading ? "Uploading..." : "Drop files here to add to Workspace"}</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              Files uploaded here appear in this Recent Files list.
            </p>
            {uploadMessage && <p className="text-center text-xs text-orange-700 mt-1">{uploadMessage}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
