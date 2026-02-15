"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { getWorkstationHrefForItem, getWorkstationLabelForMode, type WorkstationMode } from "@/lib/workstations/getWorkstationTarget";

function inferModeFromToolSlug(toolSlug: string | null): WorkstationMode {
  const slug = (toolSlug || "").toLowerCase();
  if (slug.includes("pdf")) return "pdf";
  if (
    slug.includes("audio") ||
    slug.includes("mp3") ||
    slug.includes("m4a") ||
    slug.includes("wav") ||
    slug.includes("bpm") ||
    slug.includes("key") ||
    slug.includes("vocal")
  ) {
    return "audio";
  }
  return "image";
}

function getModeBenefits(mode: WorkstationMode): string {
  if (mode === "pdf") {
    return "Reorder pages, combine docs, annotate, and export from one PDF canvas.";
  }
  if (mode === "audio") {
    return "Layer clips, apply audio widgets, and export from one timeline workspace.";
  }
  return "Layer elements, place tool outputs, and keep editing in one image canvas.";
}

type OutputReadyDetail = {
  mode?: WorkstationMode;
  type?: "uploaded_image" | "uploaded_document" | "uploaded_audio";
  title?: string;
  fileUrl?: string;
  blob?: Blob;
  fileName?: string;
};

function inferItemTypeFromMode(mode: WorkstationMode): "uploaded_image" | "uploaded_document" | "uploaded_audio" {
  if (mode === "pdf") return "uploaded_document";
  if (mode === "audio") return "uploaded_audio";
  return "uploaded_image";
}

export default function ToolOutputHandoffPrompt() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbedMode = searchParams?.get("embed") === "1";
  const [isVisible, setIsVisible] = useState(false);
  const [handoffHref, setHandoffHref] = useState<string | null>(null);
  const [downloadHref, setDownloadHref] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const lastTriggerRef = useRef<{ key: string; at: number } | null>(null);

  const toolSlug = useMemo(() => {
    const m = (pathname || "").match(/^\/tools\/([^/?#]+)/);
    return m?.[1] || null;
  }, [pathname]);

  const workstationMode = useMemo(() => inferModeFromToolSlug(toolSlug), [toolSlug]);

  const uploadBlobToWorkspace = async (blob: Blob, fileName: string) => {
    const formData = new FormData();
    formData.append("file", new File([blob], fileName, { type: blob.type || "application/octet-stream" }));
    formData.append("cloud_id", "file-data");
    const res = await fetch("/api/workspace/upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = await res.json();
    window.dispatchEvent(new Event("workspace:items-updated"));
    return {
      itemId: data?.id ? String(data.id) : undefined,
      fileUrl: typeof data?.file_url === "string" ? data.file_url : undefined,
      title: typeof data?.title === "string" && data.title.trim() ? data.title : fileName,
    };
  };

  const showPreparedHandoff = async (params: {
    mode: WorkstationMode;
    fileUrl?: string | null;
    title?: string | null;
    blob?: Blob;
    fileName?: string | null;
  }) => {
    const mode = params.mode;
    const itemType = inferItemTypeFromMode(mode);
    let fileUrl = params.fileUrl || null;
    let title = params.title || params.fileName || null;
    let itemId: string | undefined;

    setIsPreparing(true);
    try {
      if ((!fileUrl || fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) && params.blob && params.fileName) {
        const uploaded = await uploadBlobToWorkspace(params.blob, params.fileName);
        if (uploaded) {
          fileUrl = uploaded.fileUrl || fileUrl;
          title = uploaded.title || title;
          itemId = uploaded.itemId;
        }
      }

      const nextHandoffHref =
        getWorkstationHrefForItem({
          type: itemType,
          fileUrl: fileUrl || undefined,
          title: title || undefined,
          itemId: itemId || undefined,
        }) || `/workstations?mode=${mode}`;

      setHandoffHref(nextHandoffHref);
      setDownloadHref(fileUrl || null);
      setDownloadName(title || params.fileName || null);
      setIsVisible(true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setIsVisible(false), 12000);
    } finally {
      setIsPreparing(false);
    }
  };

  const shouldSkipDuplicateTrigger = (key: string) => {
    const now = Date.now();
    const prev = lastTriggerRef.current;
    if (prev && prev.key === key && now - prev.at < 1200) return true;
    lastTriggerRef.current = { key, at: now };
    return false;
  };

  const triggerFromCandidate = async (params: {
    mode: WorkstationMode;
    candidateHref?: string | null;
    outputName: string;
    blob?: Blob;
    fileName?: string;
  }) => {
    const href = (params.candidateHref || "").trim();
    const key = `${params.mode}::${href}::${params.outputName}`;
    if (shouldSkipDuplicateTrigger(key)) return;

    const isBlobHref = href.startsWith("blob:");
    const isDataHref = href.startsWith("data:");
    if ((isBlobHref || isDataHref) && !params.blob) {
      try {
        const res = await fetch(href);
        if (res.ok) {
          const blob = await res.blob();
          await showPreparedHandoff({
            mode: params.mode,
            fileUrl: href,
            title: params.outputName,
            blob,
            fileName: params.fileName || params.outputName,
          });
          return;
        }
      } catch {}
    }
    await showPreparedHandoff({
      mode: params.mode,
      fileUrl: href || null,
      title: params.outputName,
      blob: params.blob,
      fileName: params.fileName || params.outputName,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined" || isEmbedMode || !toolSlug) return;

    const outputActionRegex = /(download|generate|analyze|convert|create|export|run|process|build)/i;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest("button,a,[role='button']") as HTMLElement | null;
      if (!el) return;

      const forcedTrack = el.getAttribute("data-track-output") === "true";
      const text = (el.textContent || "").trim();
      if (!forcedTrack && !outputActionRegex.test(text)) return;

      const anchor = el.closest("a") as HTMLAnchorElement | null;
      const explicitOutputUrl = el.getAttribute("data-output-url") || el.getAttribute("data-file-url");
      const candidateHref = (explicitOutputUrl || anchor?.href || "").trim();
      if (!candidateHref) return;
      const explicitOutputName = el.getAttribute("data-output-name") || anchor?.download || "";
      if (!explicitOutputUrl && !explicitOutputName.trim()) return;
      const outputName = (anchor?.download || el.getAttribute("data-output-name") || `output-${Date.now()}`).trim();
      void triggerFromCandidate({
        mode: workstationMode,
        candidateHref,
        outputName,
      });
    };

    const onOutputReady = (event: Event) => {
      const custom = event as CustomEvent<OutputReadyDetail>;
      const detail = custom.detail || {};
      const mode = detail.mode || workstationMode;
      const title = detail.title || detail.fileName || `output-${Date.now()}`;
      void triggerFromCandidate({
        mode,
        candidateHref: detail.fileUrl || null,
        outputName: title,
        blob: detail.blob,
        fileName: detail.fileName || title,
      });
    };

    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedAnchorClick(this: HTMLAnchorElement) {
      try {
        const href = (this.getAttribute("href") || this.href || "").trim();
        const download = (this.getAttribute("download") || this.download || "").trim();
        const shouldCapture = Boolean(download) || href.startsWith("blob:") || href.startsWith("data:");
        if (shouldCapture) {
          const outputName = download || `output-${Date.now()}`;
          void triggerFromCandidate({
            mode: workstationMode,
            candidateHref: href,
            outputName,
          });
        }
      } catch {}
      return originalAnchorClick.apply(this);
    };

    window.addEventListener("click", onClick);
    window.addEventListener("vcm:tool-output-ready", onOutputReady as EventListener);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("vcm:tool-output-ready", onOutputReady as EventListener);
      HTMLAnchorElement.prototype.click = originalAnchorClick;
    };
  }, [isEmbedMode, toolSlug, workstationMode]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!isVisible || isEmbedMode || !toolSlug) return null;

  return (
    <div className="fixed top-20 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-3xl mx-auto px-4">
        <div className="pointer-events-auto rounded-xl border border-orange-300 bg-white shadow-lg px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Output ready. Continue in workstation.</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Keep download speed, then move into one canvas for deeper edits with modular widgets.
            </p>
            <p className="text-xs text-gray-700 mt-1 font-medium">{getModeBenefits(workstationMode)}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Link
                href={handoffHref || `/workstations?mode=${workstationMode}`}
                data-track-output="true"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isPreparing ? "bg-orange-300 text-white cursor-wait" : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {isPreparing ? "Preparing file..." : getWorkstationLabelForMode(workstationMode)}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {downloadHref && (
                <a
                  href={downloadHref}
                  download={downloadName || undefined}
                  data-track-output="true"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Download Again
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Dismiss workstation prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
